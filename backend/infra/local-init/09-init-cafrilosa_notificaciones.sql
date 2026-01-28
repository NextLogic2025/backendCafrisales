-- =====================================================
-- NOTIFICATION-SERVICE
-- Base: cafrilosa_notificaciones
-- Propósito: Sistema híbrido de notificaciones con WebSocket
-- =====================================================

\c cafrilosa_notificaciones

CREATE EXTENSION IF NOT EXISTS pgcrypto;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS audit;

-- Trigger para actualizado_en + version
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
-- Tipos ENUM
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_notificacion') THEN
    CREATE TYPE tipo_notificacion AS ENUM (
      'pedido_creado',
      'pedido_aprobado',
      'pedido_ajustado',
      'pedido_rechazado',
      'pedido_asignado_ruta',
      'pedido_en_ruta',
      'pedido_entregado',
      'pedido_cancelado',
      'credito_aprobado',
      'credito_rechazado',
      'credito_vencido',
      'pago_registrado',
      'entrega_iniciada',
      'entrega_completada',
      'incidente_reportado',
      'rutero_asignado',
      'rutero_iniciado',
      'rutero_completado'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prioridad_notificacion') THEN
    CREATE TYPE prioridad_notificacion AS ENUM ('baja','normal','alta','urgente');
  END IF;
END$$;

-- =========================
-- 1) Notificaciones principales
-- =========================
CREATE TABLE app.notificaciones (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Destinatario
  usuario_id        uuid NOT NULL,  -- cliente, vendedor, bodeguero, etc
  
  -- Contenido
  tipo              tipo_notificacion NOT NULL,
  titulo            varchar(255) NOT NULL,
  mensaje           text NOT NULL,
  
  -- Metadata del evento origen
  payload           jsonb,                   -- datos adicionales (pedido_id, monto, etc)
  origen_servicio   varchar(50) NOT NULL,    -- 'order', 'credit', 'delivery', 'route'
  origen_evento_id  uuid,                    -- ID del evento outbox original
  
  -- Configuración
  prioridad         prioridad_notificacion NOT NULL DEFAULT 'normal',
  requiere_accion   boolean NOT NULL DEFAULT false,  -- notif requiere interacción del usuario
  url_accion        text,                            -- URL para la acción (ej: /pedidos/123)
  
  -- Estado
  leida             boolean NOT NULL DEFAULT false,
  leida_en          timestamptz,
  
  -- Expiración (opcional)
  expira_en         timestamptz,
  
  -- Auditoría
  creado_en         timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_en    timestamptz NOT NULL DEFAULT transaction_timestamp(),
  version           int NOT NULL DEFAULT 1,
  
  CHECK (
    (leida = false AND leida_en IS NULL) OR
    (leida = true AND leida_en IS NOT NULL)
  )
);

CREATE TRIGGER trg_notificaciones_actualizado
BEFORE UPDATE ON app.notificaciones
FOR EACH ROW EXECUTE FUNCTION audit.set_actualizado();

-- Índices para consultas eficientes
CREATE INDEX idx_notif_usuario_fecha 
  ON app.notificaciones(usuario_id, creado_en DESC);

CREATE INDEX idx_notif_usuario_no_leidas 
  ON app.notificaciones(usuario_id, creado_en DESC) 
  WHERE leida = false;

CREATE INDEX idx_notif_tipo_usuario 
  ON app.notificaciones(tipo, usuario_id, creado_en DESC);

CREATE INDEX idx_notif_expiracion 
  ON app.notificaciones(expira_en) 
  WHERE expira_en IS NOT NULL;

-- =========================
-- 2) Preferencias de notificación por usuario
-- =========================
CREATE TABLE app.preferencias_notificacion (
  usuario_id        uuid PRIMARY KEY,
  
  -- Canales habilitados
  websocket_enabled boolean NOT NULL DEFAULT true,
  email_enabled     boolean NOT NULL DEFAULT true,
  sms_enabled       boolean NOT NULL DEFAULT false,
  
  -- Tipos de notificación suscritos (jsonb array de tipos)
  tipos_suscritos   jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  -- Configuración de "no molestar"
  no_molestar       boolean NOT NULL DEFAULT false,
  no_molestar_desde time,
  no_molestar_hasta time,
  
  creado_en         timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_en    timestamptz NOT NULL DEFAULT transaction_timestamp(),
  version           int NOT NULL DEFAULT 1
);

CREATE TRIGGER trg_preferencias_actualizado
BEFORE UPDATE ON app.preferencias_notificacion
FOR EACH ROW EXECUTE FUNCTION audit.set_actualizado();

-- =========================
-- 3) Outbox para propagación
-- =========================
CREATE TABLE app.outbox_eventos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agregado        text NOT NULL,     -- 'notification'
  tipo_evento     text NOT NULL,     -- 'NotificacionCreada', 'NotificacionLeida'
  clave_agregado  text NOT NULL,     -- notification_id
  payload         jsonb NOT NULL,
  creado_en       timestamptz NOT NULL DEFAULT transaction_timestamp(),
  procesado_en    timestamptz,
  intentos        integer NOT NULL DEFAULT 0
);

CREATE INDEX idx_outbox_pendientes
  ON app.outbox_eventos(creado_en)
  WHERE procesado_en IS NULL;

-- =========================
-- 4) Historial de envíos (para debugging)
-- =========================
CREATE TABLE app.historial_envios (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  notificacion_id   uuid NOT NULL REFERENCES app.notificaciones(id) ON DELETE CASCADE,
  
  canal             varchar(50) NOT NULL,  -- 'websocket', 'email', 'sms'
  exitoso           boolean NOT NULL,
  error_mensaje     text,
  
  enviado_en        timestamptz NOT NULL DEFAULT transaction_timestamp()
);

CREATE INDEX idx_historial_notificacion
  ON app.historial_envios(notificacion_id, enviado_en DESC);

-- =========================
-- 5) Función helper para limpiar notificaciones expiradas
-- =========================
CREATE OR REPLACE FUNCTION app.limpiar_notificaciones_expiradas()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM app.notificaciones
  WHERE expira_en IS NOT NULL AND expira_en < transaction_timestamp();
END;
$$;

-- Comentarios útiles
COMMENT ON TABLE app.notificaciones IS 'Notificaciones en tiempo real para usuarios del sistema';
COMMENT ON COLUMN app.notificaciones.requiere_accion IS 'Indica si la notificación requiere una acción explícita del usuario';
COMMENT ON COLUMN app.notificaciones.url_accion IS 'URL relativa o ruta para navegar cuando el usuario hace clic';
COMMENT ON TABLE app.preferencias_notificacion IS 'Preferencias de notificación por usuario';
COMMENT ON TABLE app.historial_envios IS 'Registro de intentos de envío por canal para debugging';
