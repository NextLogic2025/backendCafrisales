-- =====================================================
-- NOTIFICATION-SERVICE
-- Base: cafrilosa_notificaciones
-- Propósito: Notificaciones híbridas (WebSocket + email/sms opcional)
-- PostgreSQL 17
-- =====================================================


\c cafrilosa_notificaciones

CREATE EXTENSION IF NOT EXISTS pgcrypto;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS audit;

-- Trigger actualizado_en + version (estándar)
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
-- ENUMs (solo estables)
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prioridad_notificacion') THEN
    CREATE TYPE prioridad_notificacion AS ENUM ('baja','normal','alta','urgente');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'canal_notificacion') THEN
    CREATE TYPE canal_notificacion AS ENUM ('websocket','email','sms');
  END IF;
END$$;

-- =========================
-- 1) Catálogo de tipos
-- =========================
-- En vez de ENUM: permite crecer/cambiar sin migraciones.
CREATE TABLE app.tipos_notificacion (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo       varchar(50) NOT NULL UNIQUE,   -- ej: "pedido_creado", "credito_aprobado"
  nombre       varchar(120) NOT NULL,         -- ej: "Pedido creado"
  descripcion  text,
  activo       boolean NOT NULL DEFAULT true,
  creado_en    timestamptz NOT NULL DEFAULT transaction_timestamp(),
  creado_por   uuid
);

CREATE INDEX idx_tipos_notificacion_activos
  ON app.tipos_notificacion(codigo)
  WHERE activo;

-- =========================
-- 2) Notificaciones
-- =========================
CREATE TABLE app.notificaciones (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Destinatario (referencia lógica a user-service)
  usuario_id        uuid NOT NULL,

  -- Tipo / contenido
  tipo_id           uuid NOT NULL REFERENCES app.tipos_notificacion(id),
  titulo            varchar(255) NOT NULL,
  mensaje           text NOT NULL,

  -- Metadata del evento origen (para trazabilidad e idempotencia)
  origen_servicio   varchar(50) NOT NULL,  -- "order","credit","route","delivery","auth","user","catalog","zone"
  origen_evento_id  uuid,                  -- id del outbox original (si aplica)
  payload           jsonb NOT NULL DEFAULT '{}'::jsonb, -- metadata flexible (NO core)

  -- UX
  prioridad         prioridad_notificacion NOT NULL DEFAULT 'normal',
  requiere_accion   boolean NOT NULL DEFAULT false,
  url_accion        text,  -- ruta/URL relativa para navegación

  -- Estado lectura
  leida             boolean NOT NULL DEFAULT false,
  leida_en          timestamptz,

  -- Expiración (opcional)
  expira_en         timestamptz,

  -- Auditoría estándar
  creado_en         timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_en    timestamptz NOT NULL DEFAULT transaction_timestamp(),
  creado_por        uuid,
  actualizado_por   uuid,
  version           int NOT NULL DEFAULT 1,

  -- Coherencia lectura
  CHECK (
    (leida = false AND leida_en IS NULL) OR
    (leida = true  AND leida_en IS NOT NULL)
  ),

  -- Coherencia acción
  CHECK (
    requiere_accion = false OR url_accion IS NOT NULL
  ),

  -- Coherencia expiración
  CHECK (
    expira_en IS NULL OR expira_en > creado_en
  )
);

CREATE TRIGGER trg_notificaciones_actualizado
BEFORE UPDATE ON app.notificaciones
FOR EACH ROW EXECUTE FUNCTION audit.set_actualizado();

-- Índices para UI (inbox)
CREATE INDEX idx_notif_usuario_fecha
  ON app.notificaciones(usuario_id, creado_en DESC);

CREATE INDEX idx_notif_usuario_no_leidas
  ON app.notificaciones(usuario_id, creado_en DESC)
  WHERE leida = false;

CREATE INDEX idx_notif_tipo_usuario_fecha
  ON app.notificaciones(tipo_id, usuario_id, creado_en DESC);

CREATE INDEX idx_notif_expiracion
  ON app.notificaciones(expira_en)
  WHERE expira_en IS NOT NULL;

-- Idempotencia: evita duplicar notificación si se re-procesa el mismo evento
-- (solo aplica cuando origen_evento_id existe)
CREATE UNIQUE INDEX ux_notif_origen_evento_usuario
  ON app.notificaciones(origen_servicio, origen_evento_id, usuario_id)
  WHERE origen_evento_id IS NOT NULL;

-- =========================
-- 3) Preferencias por usuario (defaults + no molestar)
-- =========================
CREATE TABLE app.preferencias_notificacion (
  usuario_id          uuid PRIMARY KEY,

  -- Defaults por canal (si no hay suscripción específica por tipo)
  websocket_enabled   boolean NOT NULL DEFAULT true,
  email_enabled       boolean NOT NULL DEFAULT true,
  sms_enabled         boolean NOT NULL DEFAULT false,

  -- No molestar
  no_molestar         boolean NOT NULL DEFAULT false,
  no_molestar_desde   time,
  no_molestar_hasta   time,

  creado_en           timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_en      timestamptz NOT NULL DEFAULT transaction_timestamp(),
  creado_por          uuid,
  actualizado_por     uuid,
  version             int NOT NULL DEFAULT 1,

  -- Coherencia DND
  CHECK (
    no_molestar = false
    OR (no_molestar_desde IS NOT NULL AND no_molestar_hasta IS NOT NULL)
  )
);

CREATE TRIGGER trg_preferencias_actualizado
BEFORE UPDATE ON app.preferencias_notificacion
FOR EACH ROW EXECUTE FUNCTION audit.set_actualizado();

-- =========================
-- 4) Suscripciones por tipo (normalizado, queryable)
-- =========================
-- Define overrides por tipo para un usuario.
-- Si no existe registro, usar defaults de preferencias_notificacion.
CREATE TABLE app.suscripciones_notificacion (
  usuario_id        uuid NOT NULL,
  tipo_id           uuid NOT NULL REFERENCES app.tipos_notificacion(id) ON DELETE CASCADE,

  websocket_enabled boolean,
  email_enabled     boolean,
  sms_enabled       boolean,

  creado_en         timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_en    timestamptz NOT NULL DEFAULT transaction_timestamp(),
  version           int NOT NULL DEFAULT 1,

  PRIMARY KEY (usuario_id, tipo_id)
);

CREATE TRIGGER trg_suscripciones_actualizado
BEFORE UPDATE ON app.suscripciones_notificacion
FOR EACH ROW EXECUTE FUNCTION audit.set_actualizado();

CREATE INDEX idx_suscripciones_tipo
  ON app.suscripciones_notificacion(tipo_id);

-- =========================
-- 5) Historial de envíos (debug/observabilidad)
-- =========================
CREATE TABLE app.historial_envios (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notificacion_id  uuid NOT NULL REFERENCES app.notificaciones(id) ON DELETE CASCADE,

  canal            canal_notificacion NOT NULL,
  exitoso          boolean NOT NULL,
  error_mensaje    text,

  enviado_en       timestamptz NOT NULL DEFAULT transaction_timestamp()
);

CREATE INDEX idx_historial_notificacion
  ON app.historial_envios(notificacion_id, enviado_en DESC);

-- =========================
-- 6) Outbox para propagación (si otros sistemas consumen notif)
-- =========================
CREATE TABLE app.outbox_eventos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agregado        text NOT NULL,     -- "notification"
  tipo_evento     text NOT NULL,     -- "NotificacionCreada", "NotificacionLeida", etc.
  clave_agregado  text NOT NULL,     -- notification_id
  payload         jsonb NOT NULL,
  creado_en       timestamptz NOT NULL DEFAULT transaction_timestamp(),
  procesado_en    timestamptz,
  intentos        integer NOT NULL DEFAULT 0 CHECK (intentos >= 0)
);

CREATE INDEX idx_outbox_pendientes
  ON app.outbox_eventos(creado_en)
  WHERE procesado_en IS NULL;

-- =========================
-- 7) Helper: limpieza de expiradas
-- =========================
CREATE OR REPLACE FUNCTION app.limpiar_notificaciones_expiradas()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer;
BEGIN
  DELETE FROM app.notificaciones
  WHERE expira_en IS NOT NULL
    AND expira_en < transaction_timestamp();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMENT ON TABLE app.notificaciones IS 'Notificaciones para usuarios del sistema (WS/email/sms) con trazabilidad por evento.';
COMMENT ON TABLE app.tipos_notificacion IS 'Catálogo de tipos de notificación (extensible sin migraciones).';
COMMENT ON TABLE app.preferencias_notificacion IS 'Preferencias por usuario (defaults + no molestar).';
COMMENT ON TABLE app.suscripciones_notificacion IS 'Overrides por tipo de notificación por usuario.';
COMMENT ON TABLE app.historial_envios IS 'Registro de intentos de envío por canal (observabilidad).';
