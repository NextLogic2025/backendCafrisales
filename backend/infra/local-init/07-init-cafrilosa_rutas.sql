-- 7) ROUTE-SERVICE (ruteros comerciales + logísticos, visitas, flota)
-- Principios del modelo

-- Rutero comercial: agenda del vendedor por zona/fecha, con lista ordenada de clientes (paradas).

-- Rutero logístico: plan del día por zona con vehículo + transportista y lista ordenada de pedidos (paradas).

-- Trazabilidad: quién creó, publicó, inició, completó, canceló.

-- Ejecución ligera: el rutero puede marcar “iniciado/completado”, pero el resultado de entrega va en delivery.

-- Referencias externas: cliente_id, pedido_id, vendedor_id, transportista_id, zona_id son UUID sin FK (viven en otros servicios).

-- DDL (PostgreSQL 17)
-- =====================================================
-- ROUTE-SERVICE
-- Base: cafrilosa_rutas
-- Solo: ruteros comerciales + logísticos, visitas, flota
-- =====================================================


\c cafrilosa_rutas

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
-- ENUMs (estables)
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_rutero') THEN
    CREATE TYPE estado_rutero AS ENUM ('borrador','publicado','en_curso','completado','cancelado');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_vehiculo') THEN
    CREATE TYPE estado_vehiculo AS ENUM ('disponible','asignado','mantenimiento','fuera_servicio');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resultado_visita') THEN
    CREATE TYPE resultado_visita AS ENUM ('pedido_tomado','no_compro','no_atendido','seguimiento','cobranza');
  END IF;
END$$;

-- =====================================================
-- 1) Flota (Vehículos)
-- =====================================================
CREATE TABLE app.vehiculos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placa            varchar(20) NOT NULL UNIQUE,
  modelo           varchar(100),
  capacidad_kg     int CHECK (capacidad_kg IS NULL OR capacidad_kg > 0),

  estado           estado_vehiculo NOT NULL DEFAULT 'disponible',

  creado_en        timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_en   timestamptz NOT NULL DEFAULT transaction_timestamp(),
  creado_por       uuid,
  actualizado_por  uuid,
  version          int NOT NULL DEFAULT 1
);

CREATE TRIGGER trg_vehiculos_actualizado
BEFORE UPDATE ON app.vehiculos
FOR EACH ROW EXECUTE FUNCTION audit.set_actualizado();

CREATE INDEX idx_vehiculos_estado
  ON app.vehiculos(estado);

-- =====================================================
-- 2) Rutero Comercial (agenda de visitas)
-- =====================================================
CREATE TABLE app.ruteros_comerciales (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_rutero          date NOT NULL,
  zona_id               uuid NOT NULL,  -- referencia lógica a zone-service
  vendedor_id           uuid NOT NULL,  -- referencia lógica a user-service
  creado_por_supervisor_id uuid NOT NULL,

  estado                estado_rutero NOT NULL DEFAULT 'borrador',

  publicado_en          timestamptz,
  publicado_por         uuid,
  iniciado_en           timestamptz,
  iniciado_por          uuid,
  completado_en         timestamptz,
  completado_por        uuid,
  cancelado_en          timestamptz,
  cancelado_por         uuid,
  cancelado_motivo      text,

  creado_en             timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_en        timestamptz NOT NULL DEFAULT transaction_timestamp(),
  version               int NOT NULL DEFAULT 1,

  -- Un vendedor no debería tener dos ruteros para la misma fecha (por simplicidad)
  UNIQUE (fecha_rutero, vendedor_id)
);

CREATE TRIGGER trg_ruteros_comerciales_actualizado
BEFORE UPDATE ON app.ruteros_comerciales
FOR EACH ROW EXECUTE FUNCTION audit.set_actualizado();

CREATE INDEX idx_ruteros_comerciales_vendedor_fecha
  ON app.ruteros_comerciales(vendedor_id, fecha_rutero DESC);

CREATE INDEX idx_ruteros_comerciales_zona_fecha
  ON app.ruteros_comerciales(zona_id, fecha_rutero DESC);

CREATE INDEX idx_ruteros_comerciales_estado_fecha
  ON app.ruteros_comerciales(estado, fecha_rutero);

-- Paradas (visitas) del rutero comercial
CREATE TABLE app.paradas_rutero_comercial (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rutero_id        uuid NOT NULL REFERENCES app.ruteros_comerciales(id) ON DELETE CASCADE,

  cliente_id       uuid NOT NULL,  -- referencia lógica a user-service
  orden_visita     int NOT NULL CHECK (orden_visita > 0),
  objetivo         text,

  -- Ejecución (ligera; detalle y evidencias si se requiere se puede extender)
  checkin_en       timestamptz,
  checkout_en      timestamptz,
  resultado        resultado_visita,
  notas            text,

  creado_en        timestamptz NOT NULL DEFAULT transaction_timestamp(),

  UNIQUE (rutero_id, orden_visita),
  UNIQUE (rutero_id, cliente_id),

  CHECK (checkout_en IS NULL OR checkin_en IS NOT NULL),
  CHECK (checkout_en IS NULL OR checkout_en >= checkin_en)
);

CREATE INDEX idx_paradas_comercial_rutero_orden
  ON app.paradas_rutero_comercial(rutero_id, orden_visita);

CREATE INDEX idx_paradas_comercial_cliente
  ON app.paradas_rutero_comercial(cliente_id, checkin_en DESC);

-- =====================================================
-- 3) Rutero Logístico (plan de entregas)
-- =====================================================
CREATE TABLE app.ruteros_logisticos (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_rutero          date NOT NULL,
  zona_id               uuid NOT NULL,     -- zone-service
  vehiculo_id           uuid NOT NULL REFERENCES app.vehiculos(id),
  transportista_id      uuid NOT NULL,     -- user-service
  creado_por_supervisor_id uuid NOT NULL,

  estado                estado_rutero NOT NULL DEFAULT 'borrador',

  publicado_en          timestamptz,
  publicado_por         uuid,
  iniciado_en           timestamptz,
  iniciado_por          uuid,
  completado_en         timestamptz,
  completado_por        uuid,
  cancelado_en          timestamptz,
  cancelado_por         uuid,
  cancelado_motivo      text,

  creado_en             timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_en        timestamptz NOT NULL DEFAULT transaction_timestamp(),
  version               int NOT NULL DEFAULT 1,

  -- Evita ruteros duplicados por zona/fecha (ajusta si deseas múltiples camiones por zona)
  UNIQUE (fecha_rutero, zona_id, vehiculo_id)
);

CREATE TRIGGER trg_ruteros_logisticos_actualizado
BEFORE UPDATE ON app.ruteros_logisticos
FOR EACH ROW EXECUTE FUNCTION audit.set_actualizado();

CREATE INDEX idx_ruteros_logisticos_fecha_estado
  ON app.ruteros_logisticos(fecha_rutero DESC, estado);

CREATE INDEX idx_ruteros_logisticos_transportista
  ON app.ruteros_logisticos(transportista_id, fecha_rutero DESC);

CREATE INDEX idx_ruteros_logisticos_vehiculo
  ON app.ruteros_logisticos(vehiculo_id, fecha_rutero DESC);

-- Paradas (pedidos) del rutero logístico
CREATE TABLE app.paradas_rutero_logistico (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rutero_id         uuid NOT NULL REFERENCES app.ruteros_logisticos(id) ON DELETE CASCADE,

  pedido_id         uuid NOT NULL,  -- referencia lógica a order-service
  orden_entrega     int NOT NULL CHECK (orden_entrega > 0),

  -- Nota: “estado de entrega” NO va aquí (va en delivery-service),
  -- pero sí puedes guardar un “marcado para despacho” si te ayuda.
  preparado_en      timestamptz,
  preparado_por     uuid,

  creado_en         timestamptz NOT NULL DEFAULT transaction_timestamp(),

  UNIQUE (rutero_id, orden_entrega),
  UNIQUE (rutero_id, pedido_id)
);

CREATE INDEX idx_paradas_logistico_rutero_orden
  ON app.paradas_rutero_logistico(rutero_id, orden_entrega);

CREATE INDEX idx_paradas_logistico_pedido
  ON app.paradas_rutero_logistico(pedido_id);

-- =====================================================
-- 4) Historial de estados de rutero (comercial y logístico)
-- =====================================================
-- En vez de duplicar tablas, hacemos una sola con “tipo_rutero”
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_rutero') THEN
    CREATE TYPE tipo_rutero AS ENUM ('comercial','logistico');
  END IF;
END$$;

CREATE TABLE app.historial_estado_rutero (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo           tipo_rutero NOT NULL,
  rutero_id      uuid NOT NULL,
  estado         estado_rutero NOT NULL,
  cambiado_por_id uuid NOT NULL,
  motivo         text,
  creado_en      timestamptz NOT NULL DEFAULT transaction_timestamp()
);

CREATE INDEX idx_historial_rutero
  ON app.historial_estado_rutero(tipo, rutero_id, creado_en DESC);

-- Nota: rutero_id aquí no tiene FK (porque podría apuntar a comercial o logístico).
-- Integridad se mantiene en software (simple, evita sobre-ingeniería).

-- =====================================================
-- 5) Outbox (recomendado)
-- =====================================================
CREATE TABLE app.outbox_eventos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agregado        text NOT NULL,       -- "route"
  tipo_evento     text NOT NULL,       -- "RuteroPublicado", "RuteroIniciado", etc.
  clave_agregado  text NOT NULL,       -- rutero_id
  payload         jsonb NOT NULL,
  creado_en       timestamptz NOT NULL DEFAULT transaction_timestamp(),
  procesado_en    timestamptz
);

CREATE INDEX idx_outbox_pendientes
  ON app.outbox_eventos(creado_en)
  WHERE procesado_en IS NULL;

-- Reglas recomendadas (DB vs Software)
-- DB garantiza (sin complejidad)

-- Un rutero comercial por vendedor y fecha (UNIQUE(fecha_rutero, vendedor_id)).

-- Paradas ordenadas sin duplicación (unique por orden y cliente/pedido).

-- Vehículos únicos por placa.

-- Coherencia temporal checkin/checkout.

-- Software garantiza (para no sobre-ingenierizar)

-- Transiciones válidas de estado (borrador → publicado → en_curso → completado).

-- No publicar rutero vacío.

-- No iniciar rutero sin publicar.

-- Marcar vehículo como asignado cuando esté en un rutero activo (puede ser en software o con trigger; yo lo haría en software inicialmente).

-- Validar que pedidos asignados estén en estado correcto (ej. aceptado_cliente/validado) antes de asignarlos.

-- Nota importante sobre “múltiples camiones por zona”

-- Hoy puse UNIQUE (fecha_rutero, zona_id, vehiculo_id) (permite varios ruteros por zona/fecha si cambias vehículo).

-- Si quieres máximo 1 rutero logístico por zona/fecha sin importar vehículo, cambia a:

-- reemplazar UNIQUE
-- UNIQUE (fecha_rutero, zona_id)