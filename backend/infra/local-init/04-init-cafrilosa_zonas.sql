-- 4) ZONE-SERVICE (zonas, horarios, opcional PostGIS)

-- Objetivo: zonas y días de atención.
-- Aquí sí tiene sentido considerar PostGIS si vas a: asignar clientes por geocercas, validar cobertura por polígono, o calcular pertenencia.

-- Te dejo dos niveles: (A) MVP simple sin geometría, (B) con PostGIS.

-- 4.A MVP simple (sin PostGIS)
-- =====================================================
-- ZONE-SERVICE
-- Base: cafrilosa_zonas
-- Solo: zonas geográficas, días de atención
-- =====================================================


\c cafrilosa_zonas
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS audit;

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

CREATE TABLE IF NOT EXISTS app.zonas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo           varchar(20) NOT NULL UNIQUE,
  nombre           varchar(100) NOT NULL,
  descripcion      text,
  activo           boolean NOT NULL DEFAULT true,

  creado_en        timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_en   timestamptz NOT NULL DEFAULT transaction_timestamp(),
  creado_por       uuid,
  actualizado_por  uuid,
  version          int NOT NULL DEFAULT 1
);

DROP TRIGGER IF EXISTS trg_zonas_actualizado ON app.zonas;
CREATE TRIGGER trg_zonas_actualizado
BEFORE UPDATE ON app.zonas
FOR EACH ROW EXECUTE FUNCTION audit.set_actualizado();

CREATE INDEX IF NOT EXISTS idx_zonas_activas_codigo
  ON app.zonas(codigo)
  WHERE activo;

-- Horarios por zona (0=domingo .. 6=sábado)
CREATE TABLE IF NOT EXISTS app.horarios_zona (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zona_id             uuid NOT NULL REFERENCES app.zonas(id) ON DELETE CASCADE,
  dia_semana          int NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),

  entregas_habilitadas boolean NOT NULL DEFAULT true,
  visitas_habilitadas  boolean NOT NULL DEFAULT true,

  creado_en            timestamptz NOT NULL DEFAULT transaction_timestamp(),
  creado_por           uuid,

  UNIQUE (zona_id, dia_semana)
);

CREATE INDEX IF NOT EXISTS idx_horarios_zona_zona
  ON app.horarios_zona(zona_id);

-- Outbox (opcional)
CREATE TABLE IF NOT EXISTS app.outbox_eventos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agregado        text NOT NULL,          -- "zone"
  tipo_evento     text NOT NULL,          -- "ZonaActualizada"
  clave_agregado  text NOT NULL,          -- zona_id
  payload         jsonb NOT NULL,
  creado_en       timestamptz NOT NULL DEFAULT transaction_timestamp(),
  procesado_en    timestamptz,
  intentos        integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_outbox_pendientes
  ON app.outbox_eventos(creado_en)
  WHERE procesado_en IS NULL;

-- 4.B Con PostGIS (si quieres geometría real)

-- Si quieres representar la zona como polígono, agrega:

-- zona_geom geometry(MultiPolygon, 4326) (o Polygon)

--índice GiST para consultas espaciales.

-- Solo si necesitas geofencing/cobertura
ALTER TABLE app.zonas
  ADD COLUMN IF NOT EXISTS zona_geom geometry(MultiPolygon, 4326);

CREATE INDEX IF NOT EXISTS idx_zonas_geom
  ON app.zonas
  USING GIST (zona_geom);


-- Qué queda en software incluso con PostGIS:

-- reglas de asignación (si hay solapes, prioridad, etc.)

-- validación de datos (p.ej. geometría válida) — aunque PostGIS ayuda, la política es tuya.
