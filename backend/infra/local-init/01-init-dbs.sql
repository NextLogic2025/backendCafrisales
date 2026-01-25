-- =====================================================
-- Inicialización de bases de datos locales para CAFRISALES
-- 1) AUTH-SERVICE (JWT + sesiones/refresh + seguridad)

--Propósito: autenticación/autorización, sesiones y revocación.
--JWT: el access token normalmente no se guarda; el refresh sí se controla (hash + revocación + device info).

-- DDL (PostgreSQL 17)
-- =====================================================
-- AUTH-SERVICE
-- Base: cafrilosa_auth
-- Solo: autenticación, autorización, sesiones
-- =====================================================

CREATE DATABASE cafrilosa_auth;
CREATE DATABASE cafrilosa_usuarios;
\c cafrilosa_auth

-- Extensiones
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- Esquemas
REVOKE ALL ON SCHEMA public FROM PUBLIC;
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS audit;

-- Función común: actualizado_en + version
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

-- Tipos estables (ENUM): cambian rara vez
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_credencial') THEN
    CREATE TYPE estado_credencial AS ENUM ('activo','bloqueado','suspendido');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'motivo_bloqueo') THEN
    CREATE TYPE motivo_bloqueo AS ENUM ('intentos_fallidos','sospecha_fraude','solicitud_usuario','administrativo');
  END IF;
END$$;

-- 1) Credenciales (dueño: auth-service)
-- usuario_id es el id del user-service (referencia lógica, NO FK)
CREATE TABLE app.credenciales (
  usuario_id          uuid PRIMARY KEY,
  email               citext NOT NULL UNIQUE,
  password_hash       text NOT NULL,
  password_alg        text NOT NULL DEFAULT 'argon2id', -- definido por la app
  estado              estado_credencial NOT NULL DEFAULT 'activo',
  bloqueado_motivo    motivo_bloqueo,
  bloqueado_en        timestamptz,

  ultimo_login_en     timestamptz,
  ultimo_login_ip     inet,

  creado_en           timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_en      timestamptz NOT NULL DEFAULT transaction_timestamp(),
  creado_por          uuid,
  actualizado_por     uuid,
  version             int NOT NULL DEFAULT 1,

  CHECK (
    (estado = 'activo' AND bloqueado_en IS NULL AND bloqueado_motivo IS NULL)
    OR (estado <> 'activo')
  )
);

ALTER TABLE app.outbox_eventos ADD COLUMN IF NOT EXISTS intentos integer DEFAULT 0;
ALTER TABLE app.outbox_eventos ADD COLUMN IF NOT EXISTS ultimo_error text;


CREATE TRIGGER trg_credenciales_actualizado
BEFORE UPDATE ON app.credenciales
FOR EACH ROW EXECUTE FUNCTION audit.set_actualizado();

-- 2) Sesiones / Refresh tokens (rotación + revocación)
-- Guardar refresh token en claro NO. Guardar hash SI.
CREATE TABLE app.sesiones (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id         uuid NOT NULL,
  refresh_hash       text NOT NULL UNIQUE,

  direccion_ip       inet,
  user_agent         text,
  dispositivo_meta   jsonb NOT NULL DEFAULT '{}'::jsonb,

  expira_en          timestamptz NOT NULL,
  revocado_en        timestamptz,
  revocado_por       uuid,
  revocado_motivo    text,

  creado_en          timestamptz NOT NULL DEFAULT transaction_timestamp()
);

-- Sesiones activas por usuario
CREATE INDEX idx_sesiones_usuario_activas
  ON app.sesiones(usuario_id, expira_en DESC)
  WHERE revocado_en IS NULL;

-- Caducidad de sesiones activas
CREATE INDEX idx_sesiones_expira_activas
  ON app.sesiones(expira_en)
  WHERE revocado_en IS NULL;

-- 3) Intentos de login (auditoría + rate limit en software)
CREATE TABLE audit.intentos_login (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email            citext NOT NULL,
  direccion_ip     inet NOT NULL,
  exitoso          boolean NOT NULL,
  motivo_fallo     text,
  intentado_en     timestamptz NOT NULL DEFAULT transaction_timestamp()
);

CREATE INDEX idx_intentos_login_email
  ON audit.intentos_login(email, intentado_en DESC);

CREATE INDEX idx_intentos_login_ip
  ON audit.intentos_login(direccion_ip, intentado_en DESC);

-- 4) Outbox (opcional, recomendado): eventos para otros servicios
-- Evita doble escritura entre DB y bus/eventos.
CREATE TABLE app.outbox_eventos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agregado        text NOT NULL,          -- ej: "auth"
  tipo_evento     text NOT NULL,          -- ej: "CredencialBloqueada"
  clave_agregado  text NOT NULL,          -- ej: usuario_id como string
  payload         jsonb NOT NULL,         -- aquí sí JSONB (evento)
  creado_en       timestamptz NOT NULL DEFAULT transaction_timestamp(),
  procesado_en    timestamptz
);

CREATE INDEX idx_outbox_pendientes
  ON app.outbox_eventos(creado_en)
  WHERE procesado_en IS NULL;


-- Control DB vs Software (Auth)

-- DB controla: unicidad email, hash refresh, revocación, estados credencial, auditoría intentos.

-- API controla: emisión JWT, expiración access, rotación refresh, rate limiting, MFA (si aplica).