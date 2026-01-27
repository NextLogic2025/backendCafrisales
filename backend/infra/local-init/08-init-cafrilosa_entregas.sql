-- 8) DELIVERY-SERVICE (entregas, evidencias, incidencias)
-- Principios del modelo

-- Una entrega corresponde a un pedido asignado a un rutero logístico (ambas referencias lógicas).

-- El transportista ejecuta y registra el resultado.

-- No se exponen precios ni crédito (eso lo controla la API; DB no mezcla).

-- Evidencias: guardar URLs y metadata, no blobs.

-- Incidencias: entidad propia, relacionada a la entrega.

-- DDL (PostgreSQL 17)
-- =====================================================
-- DELIVERY-SERVICE
-- Base: cafrilosa_entregas
-- Solo: entregas, evidencias, incidencias
-- =====================================================


\c cafrilosa_entregas

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
-- ENUMs estables
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_entrega') THEN
    CREATE TYPE estado_entrega AS ENUM ('pendiente','en_ruta','entregado_completo','entregado_parcial','no_entregado','cancelado');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_evidencia') THEN
    CREATE TYPE tipo_evidencia AS ENUM ('foto','firma','documento','audio','otro');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'severidad_incidencia') THEN
    CREATE TYPE severidad_incidencia AS ENUM ('baja','media','alta','critica');
  END IF;
END$$;

-- =====================================================
-- 1) Entregas (ejecución)
-- =====================================================
CREATE TABLE app.entregas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referencias lógicas
  pedido_id            uuid NOT NULL, -- order-service
  rutero_logistico_id  uuid NOT NULL, -- route-service
  transportista_id     uuid NOT NULL, -- user-service

  estado               estado_entrega NOT NULL DEFAULT 'pendiente',

  -- Tiempos relevantes
  asignado_en          timestamptz NOT NULL DEFAULT transaction_timestamp(),
  salida_ruta_en       timestamptz,
  entregado_en         timestamptz,

  -- Resultado / motivos
  motivo_no_entrega    text,
  observaciones        text,

  -- Ubicación (opcional, sin PostGIS aquí; si luego quieres, se migra)
  latitud              numeric(9,6),
  longitud             numeric(9,6),

  -- Auditoría estándar
  creado_en            timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_en       timestamptz NOT NULL DEFAULT transaction_timestamp(),
  creado_por           uuid,
  actualizado_por      uuid,
  version              int NOT NULL DEFAULT 1,

  -- Evitar duplicidad: un pedido debería tener una entrega “activa” por rutero
  UNIQUE (pedido_id, rutero_logistico_id),

  CHECK (
    (latitud IS NULL AND longitud IS NULL)
    OR (latitud BETWEEN -90 AND 90 AND longitud BETWEEN -180 AND 180)
  ),
  CHECK (entregado_en IS NULL OR (salida_ruta_en IS NOT NULL AND entregado_en >= salida_ruta_en))
);

CREATE TRIGGER trg_entregas_actualizado
BEFORE UPDATE ON app.entregas
FOR EACH ROW EXECUTE FUNCTION audit.set_actualizado();

CREATE INDEX idx_entregas_rutero
  ON app.entregas(rutero_logistico_id);

CREATE INDEX idx_entregas_pedido
  ON app.entregas(pedido_id);

CREATE INDEX idx_entregas_transportista_fecha
  ON app.entregas(transportista_id, asignado_en DESC);

CREATE INDEX idx_entregas_estado_fecha
  ON app.entregas(estado, asignado_en DESC);

-- =====================================================
-- 2) Evidencias de entrega
-- =====================================================
CREATE TABLE app.evidencias_entrega (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entrega_id       uuid NOT NULL REFERENCES app.entregas(id) ON DELETE CASCADE,

  tipo            tipo_evidencia NOT NULL,
  url             text NOT NULL,          -- storage externo (S3/GCS/etc)
  hash_archivo    text,                   -- opcional: integridad (sha256, etc)
  mime_type       varchar(100),
  tamano_bytes    bigint CHECK (tamano_bytes IS NULL OR tamano_bytes >= 0),

  descripcion     text,
  meta            jsonb NOT NULL DEFAULT '{}'::jsonb,

  creado_en       timestamptz NOT NULL DEFAULT transaction_timestamp(),
  creado_por      uuid
);

CREATE INDEX idx_evidencias_entrega
  ON app.evidencias_entrega(entrega_id, creado_en DESC);

-- =====================================================
-- 3) Incidencias (reportadas por transportista o soporte)
-- =====================================================
CREATE TABLE app.incidencias_entrega (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entrega_id        uuid NOT NULL REFERENCES app.entregas(id) ON DELETE CASCADE,

  tipo_incidencia   varchar(100) NOT NULL,  -- catálogo futuro si crece mucho
  severidad         severidad_incidencia NOT NULL DEFAULT 'media',
  descripcion       text NOT NULL,

  reportado_por_id  uuid NOT NULL,
  reportado_en      timestamptz NOT NULL DEFAULT transaction_timestamp(),

  resuelto_en       timestamptz,
  resuelto_por_id   uuid,
  resolucion        text,

  creado_en         timestamptz NOT NULL DEFAULT transaction_timestamp()
);

CREATE INDEX idx_incidencias_entrega
  ON app.incidencias_entrega(entrega_id, reportado_en DESC);

CREATE INDEX idx_incidencias_severidad
  ON app.incidencias_entrega(severidad, reportado_en DESC);

-- =====================================================
-- 4) Historial de estado de entrega (auditoría)
-- =====================================================
CREATE TABLE app.historial_estado_entrega (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entrega_id       uuid NOT NULL REFERENCES app.entregas(id) ON DELETE CASCADE,
  estado           estado_entrega NOT NULL,
  cambiado_por_id  uuid NOT NULL,
  motivo           text,
  creado_en        timestamptz NOT NULL DEFAULT transaction_timestamp()
);

CREATE INDEX idx_historial_entrega
  ON app.historial_estado_entrega(entrega_id, creado_en DESC);

-- =====================================================
-- 5) Outbox (recomendado)
-- =====================================================
CREATE TABLE app.outbox_eventos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agregado        text NOT NULL,          -- "delivery"
  tipo_evento     text NOT NULL,          -- "EntregaCompletada", "EntregaFallida", etc.
  clave_agregado  text NOT NULL,          -- entrega_id o pedido_id
  payload         jsonb NOT NULL,
  creado_en       timestamptz NOT NULL DEFAULT transaction_timestamp(),
  procesado_en    timestamptz,
  intentos        int NOT NULL DEFAULT 0
);

CREATE INDEX idx_outbox_pendientes
  ON app.outbox_eventos(creado_en)
  WHERE procesado_en IS NULL;

-- Reglas recomendadas (DB vs Software)
-- DB garantiza

-- Unicidad de entrega por (pedido_id, rutero_logistico_id).

-- Integridad de evidencias/incidencias ligadas a entrega.

-- Validaciones simples de coordenadas y coherencia temporal.

-- Historial de estado por entrega.

-- Software garantiza (para evitar triggers complejos)

-- Transiciones válidas de estado:

-- pendiente → en_ruta → entregado_* | no_entregado

-- Que se inserte en historial_estado_entrega cada vez que cambie estado.

-- Que motivo_no_entrega sea obligatorio si estado = no_entregado.

-- Si quieres, esto se puede reforzar con un CHECK adicional, pero suele requerir que la app setee campos en el mismo update; es viable si lo deseas.

-- Ejemplo de CHECK reforzado (opcional):

ALTER TABLE app.entregas
ADD CONSTRAINT chk_motivo_no_entrega
CHECK (
  estado <> 'no_entregado'
  OR (motivo_no_entrega IS NOT NULL AND length(btrim(motivo_no_entrega)) > 0)
);