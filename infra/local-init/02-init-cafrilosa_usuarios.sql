-- 2) USER-SERVICE (perfiles + actores del negocio)

-- Propósito: perfiles y roles de negocio (cliente/vendedor/etc).
-- Aquí vive el “quién es quién” para el dominio, no credenciales.

-- DDL (PostgreSQL 17)
-- =====================================================
-- USER-SERVICE
-- Base: cafrilosa_usuarios
-- Solo: perfiles de usuarios (clientes, vendedores, etc)
-- =====================================================


\c cafrilosa_usuarios

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

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

-- ENUMs estables (roles/estado suelen ser estables)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_usuario') THEN
    CREATE TYPE rol_usuario AS ENUM ('cliente','vendedor','bodeguero','supervisor','transportista','admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_usuario') THEN
    CREATE TYPE estado_usuario AS ENUM ('activo','inactivo','suspendido');
  END IF;
END$$;

-- Usuarios del dominio (sin password_hash)
CREATE TABLE app.usuarios (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email            citext NOT NULL UNIQUE,

  rol              rol_usuario NOT NULL,
  estado           estado_usuario NOT NULL DEFAULT 'activo',

  creado_en         timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_en    timestamptz NOT NULL DEFAULT transaction_timestamp(),
  creado_por        uuid,
  actualizado_por   uuid,
  version           int NOT NULL DEFAULT 1
);

CREATE TRIGGER trg_usuarios_actualizado
BEFORE UPDATE ON app.usuarios
FOR EACH ROW EXECUTE FUNCTION audit.set_actualizado();

CREATE INDEX idx_usuarios_rol_activo
  ON app.usuarios(rol)
  WHERE estado = 'activo';

-- Perfil (datos personales mínimos)
CREATE TABLE app.perfiles_usuario (
  usuario_id       uuid PRIMARY KEY REFERENCES app.usuarios(id) ON DELETE CASCADE,

  nombres          varchar(100) NOT NULL,
  apellidos        varchar(100) NOT NULL,
  telefono         varchar(30),
  url_avatar       text,

  preferencias     jsonb NOT NULL DEFAULT '{}'::jsonb,

  creado_en         timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_en    timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_por   uuid,
  version           int NOT NULL DEFAULT 1
);

CREATE TRIGGER trg_perfiles_actualizado
BEFORE UPDATE ON app.perfiles_usuario
FOR EACH ROW EXECUTE FUNCTION audit.set_actualizado();

-- Catálogo: canales comerciales (no ENUM porque puede crecer/cambiar)
CREATE TABLE app.canales_comerciales (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo       varchar(30) NOT NULL UNIQUE,  -- mayorista/minorista/horeca/institucional/exportacion
  nombre       varchar(80) NOT NULL,
  descripcion  text,
  activo       boolean NOT NULL DEFAULT true,
  creado_en    timestamptz NOT NULL DEFAULT transaction_timestamp()
);

-- Clientes (zona_id referencia lógica a zone-service)
CREATE TABLE app.clientes (
  usuario_id           uuid PRIMARY KEY REFERENCES app.usuarios(id) ON DELETE CASCADE,

  canal_id             uuid NOT NULL REFERENCES app.canales_comerciales(id),
  nombre_comercial     varchar(255) NOT NULL,
  ruc                  varchar(50),
  zona_id              uuid NOT NULL,

  direccion            text NOT NULL,
  latitud              numeric(9,6),
  longitud             numeric(9,6),

  vendedor_asignado_id uuid, -- referencia lógica a usuario vendedor
  creado_en            timestamptz NOT NULL DEFAULT transaction_timestamp(),
  creado_por           uuid,

  CHECK (
    (latitud IS NULL AND longitud IS NULL)
    OR (latitud BETWEEN -90 AND 90 AND longitud BETWEEN -180 AND 180)
  )
);

CREATE INDEX idx_clientes_zona ON app.clientes(zona_id);
CREATE INDEX idx_clientes_vendedor ON app.clientes(vendedor_asignado_id);
CREATE INDEX idx_clientes_canal ON app.clientes(canal_id);

-- Condiciones comerciales por cliente (flexible, NO core en JSON)
-- NULL = hereda del canal/política de negocio en software
CREATE TABLE app.condiciones_comerciales_cliente (
  cliente_id                   uuid PRIMARY KEY REFERENCES app.clientes(usuario_id) ON DELETE CASCADE,

  permite_negociacion          boolean,
  porcentaje_descuento_max     numeric(5,2) CHECK (porcentaje_descuento_max BETWEEN 0 AND 100),
  requiere_aprobacion_supervisor boolean NOT NULL DEFAULT false,

  observaciones                text,
  actualizado_en               timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_por              uuid
);

-- Staff
CREATE TABLE app.vendedores (
  usuario_id      uuid PRIMARY KEY REFERENCES app.usuarios(id) ON DELETE CASCADE,
  codigo_empleado varchar(50) NOT NULL UNIQUE,
  supervisor_id   uuid,
  activo          boolean NOT NULL DEFAULT true,
  creado_en       timestamptz NOT NULL DEFAULT transaction_timestamp()
);

CREATE INDEX idx_vendedores_supervisor ON app.vendedores(supervisor_id);

CREATE TABLE app.supervisores (
  usuario_id      uuid PRIMARY KEY REFERENCES app.usuarios(id) ON DELETE CASCADE,
  codigo_empleado varchar(50) NOT NULL UNIQUE,
  creado_en       timestamptz NOT NULL DEFAULT transaction_timestamp()
);

CREATE TABLE app.bodegueros (
  usuario_id      uuid PRIMARY KEY REFERENCES app.usuarios(id) ON DELETE CASCADE,
  codigo_empleado varchar(50) NOT NULL UNIQUE,
  creado_en       timestamptz NOT NULL DEFAULT transaction_timestamp()
);

CREATE TABLE app.transportistas (
  usuario_id        uuid PRIMARY KEY REFERENCES app.usuarios(id) ON DELETE CASCADE,
  codigo_empleado   varchar(50) NOT NULL UNIQUE,
  numero_licencia   varchar(50) NOT NULL,
  licencia_vence_en date,
  activo            boolean NOT NULL DEFAULT true,
  creado_en         timestamptz NOT NULL DEFAULT transaction_timestamp()
);

-- Outbox (opcional)
CREATE TABLE app.outbox_eventos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agregado        text NOT NULL,          -- "user"
  tipo_evento     text NOT NULL,          -- "ClienteCreado", etc.
  clave_agregado  text NOT NULL,
  payload         jsonb NOT NULL,
  creado_en       timestamptz NOT NULL DEFAULT transaction_timestamp(),
  procesado_en    timestamptz
);

CREATE INDEX idx_outbox_pendientes
  ON app.outbox_eventos(creado_en)
  WHERE procesado_en IS NULL;