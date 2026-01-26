-- =====================================================
-- CREDIT-SERVICE (aprobaciones de crédito, seguimiento, pagos)
-- =====================================================

-- Un crédito está asociado a un pedido (order-service) y a un cliente (user-service) por UUID (referencias lógicas).

-- El vendedor es responsable: aprobado_por_vendedor_id obligatorio.

-- Sin “cupo” automático: no hay tablas de límites ni cálculos automáticos en DB (eso podría venir después).

-- Estados estables como ENUM (cambian raro).

-- Pagos: pueden ser múltiples y parciales.

-- Auditoría: quién aprobó, quién registró pagos, cambios de estado.

-- =====================================================
-- Base: cafrilosa_creditos
-- Solo: aprobaciones de crédito, seguimiento, pagos
-- =====================================================

CREATE DATABASE cafrilosa_creditos;
\c cafrilosa_creditos;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS audit;

-- Actualizado + version
CREATE OR REPLACE FUNCTION audit.set_actualizado()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.actualizado_en := transaction_timestamp();
  IF TG_OP = 'UPDATE' THEN
    NEW.version := NEW.version + 1;
  END IF;
  RETURN NEW;
END;
$$;

-- =========================
-- Tipos estables (ENUM)
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_credito') THEN
    CREATE TYPE estado_credito AS ENUM ('activo','vencido','pagado','cancelado');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'origen_credito') THEN
    -- útil si en el futuro hay aprobaciones por políticas especiales
    CREATE TYPE origen_credito AS ENUM ('vendedor','excepcion');
  END IF;
END$$;

-- =========================
-- 1) Aprobaciones de crédito
-- =========================
-- Un pedido puede tener 0 o 1 aprobación de crédito.
-- (Si deseas permitir re-aprobaciones, cambia la unicidad y versiona; por ahora simple.)

CREATE TABLE app.aprobaciones_credito (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  pedido_id               uuid NOT NULL UNIQUE, -- referencia lógica a order-service
  cliente_id              uuid NOT NULL,        -- referencia lógica a user-service

  aprobado_por_vendedor_id uuid NOT NULL,       -- referencia lógica (vendedor)
  origen                  origen_credito NOT NULL DEFAULT 'vendedor',

  monto_aprobado          numeric(12,2) NOT NULL CHECK (monto_aprobado > 0),
  moneda                  char(3) NOT NULL DEFAULT 'USD',

  plazo_dias              int NOT NULL CHECK (plazo_dias > 0),
  fecha_aprobacion        date NOT NULL DEFAULT (current_date),
  fecha_vencimiento       date NOT NULL,

  estado                  estado_credito NOT NULL DEFAULT 'activo',

  notas                   text,

  -- Auditoría estándar
  creado_en               timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_en          timestamptz NOT NULL DEFAULT transaction_timestamp(),
  creado_por              uuid,
  actualizado_por         uuid,
  version                 int NOT NULL DEFAULT 1,

  CHECK (fecha_vencimiento >= fecha_aprobacion)
);

CREATE TRIGGER trg_aprobaciones_actualizado
BEFORE UPDATE ON app.aprobaciones_credito
FOR EACH ROW EXECUTE FUNCTION audit.set_actualizado();

-- Consultas típicas (por cliente, vendedor, vencimiento)
CREATE INDEX idx_creditos_cliente_estado
  ON app.aprobaciones_credito(cliente_id, estado);

CREATE INDEX idx_creditos_vendedor_fecha
  ON app.aprobaciones_credito(aprobado_por_vendedor_id, creado_en DESC);

CREATE INDEX idx_creditos_vencimiento_activos
  ON app.aprobaciones_credito(fecha_vencimiento)
  WHERE estado = 'activo';

-- =========================
-- 2) Pagos de crédito (abonos)
-- =========================
-- Pagos múltiples, parciales; no forzamos el “saldo” en DB para no sobrecargar,
-- pero sí aseguramos no negativos y trazabilidad.

CREATE TABLE app.pagos_credito (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aprobacion_credito_id   uuid NOT NULL REFERENCES app.aprobaciones_credito(id) ON DELETE CASCADE,

  monto_pago              numeric(12,2) NOT NULL CHECK (monto_pago > 0),
  moneda                  char(3) NOT NULL DEFAULT 'USD',
  fecha_pago              date NOT NULL,

  registrado_por_id       uuid NOT NULL, -- actor (vendedor/supervisor/admin)
  metodo_registro         varchar(30) NOT NULL DEFAULT 'manual', -- catalogable si crece
  referencia              varchar(80), -- nro recibo, transferencia, etc.
  notas                   text,

  creado_en               timestamptz NOT NULL DEFAULT transaction_timestamp()
);

CREATE INDEX idx_pagos_credito_aprobacion_fecha
  ON app.pagos_credito(aprobacion_credito_id, fecha_pago DESC);

-- =========================
-- 3) Historial de estado del crédito (auditoría de cambios)
-- =========================

CREATE TABLE app.historial_estado_credito (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aprobacion_credito_id uuid NOT NULL REFERENCES app.aprobaciones_credito(id) ON DELETE CASCADE,
  estado                estado_credito NOT NULL,
  cambiado_por_id       uuid NOT NULL,
  motivo                text,
  creado_en             timestamptz NOT NULL DEFAULT transaction_timestamp()
);

CREATE INDEX idx_historial_credito
  ON app.historial_estado_credito(aprobacion_credito_id, creado_en DESC);

-- =========================
-- 4) Vista útil: total abonado por crédito
-- =========================
-- No es “rigidez”; es conveniencia para reportes y lógica de negocio.

CREATE VIEW app.v_credito_totales AS
SELECT
  ac.id AS aprobacion_credito_id,
  ac.pedido_id,
  ac.cliente_id,
  ac.monto_aprobado,
  ac.moneda,
  ac.estado,
  ac.fecha_vencimiento,
  COALESCE(SUM(pc.monto_pago), 0)::numeric(12,2) AS total_pagado,
  (ac.monto_aprobado - COALESCE(SUM(pc.monto_pago), 0))::numeric(12,2) AS saldo
FROM app.aprobaciones_credito ac
LEFT JOIN app.pagos_credito pc
  ON pc.aprobacion_credito_id = ac.id
GROUP BY ac.id;

-- =========================
-- 5) Outbox (recomendado)
-- =========================
CREATE TABLE app.outbox_eventos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agregado        text NOT NULL,          -- "credit"
  tipo_evento     text NOT NULL,          -- "CreditoAprobado", "PagoRegistrado", etc.
  clave_agregado  text NOT NULL,          -- aprobacion_credito_id o pedido_id
  payload         jsonb NOT NULL,
  creado_en       timestamptz NOT NULL DEFAULT transaction_timestamp(),
  procesado_en    timestamptz
);

CREATE INDEX idx_outbox_pendientes
  ON app.outbox_eventos(creado_en)
  WHERE procesado_en IS NULL;

-- Reglas recomendadas (DB vs Software)
-- Lo que debe controlar la DB

-- pedido_id UNIQUE (un crédito por pedido).

-- monto_aprobado > 0, plazo_dias > 0, fechas coherentes.

-- Pagos no negativos, pagos ligados a una aprobación existente.

-- Historial de estados (trazabilidad).

-- Lo que controla la API (y por qué)

-- Cambiar estado activo → pagado/vencido: depende del saldo, fecha actual y política; mejor en software.

-- Evitar pagos que exceden el saldo: se puede controlar en software para no complicar con triggers y carreras de concurrencia.
-- (Si luego te preocupa consistencia fuerte, se puede agregar un trigger de validación con bloqueo por fila; por ahora es complejidad innecesaria.)

-- Políticas de auditoría y permisos: quién puede registrar pagos/cancelar créditos (en auth/roles del sistema).

-- Índices y consultas típicas que este modelo optimiza

-- Créditos activos por vencer (idx_creditos_vencimiento_activos).

-- Créditos por vendedor (auditoría de riesgo).

-- Pagos por crédito en orden cronológico.

-- Reporte rápido de saldo via v_credito_totales.