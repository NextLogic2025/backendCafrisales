-- 5) ORDER-SERVICE (pedidos, carrito, items, validación de bodega, aceptación cliente)
-- Principios del modelo

-- Un pedido es inmutable en lo esencial: cliente, zona, origen, etc.

-- Bodega no “edita” el pedido: registra un resultado de validación por ítem (aprobado/sustitución/rechazo) + motivo.

-- Cliente acepta/rechaza un ajuste: acto auditable ligado a una “versión de validación”.

-- Precio:

-- precio_unitario_base: snapshot del catálogo en creación.

-- precio_unitario_final: el cobrado (catálogo/regla/negociado).

-- descuentos por ítem y por pedido, con auditoría y aprobación si aplica.

-- Sin inventario real: no hay stock; bodega es el filtro.

-- DDL (PostgreSQL 17)
-- =====================================================
-- ORDER-SERVICE
-- Base: cafrilosa_pedidos
-- Solo: pedidos, items, carrito
-- =====================================================


\c cafrilosa_pedidos

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
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'origen_creacion') THEN
    CREATE TYPE origen_creacion AS ENUM ('cliente','vendedor');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'metodo_pago') THEN
    CREATE TYPE metodo_pago AS ENUM ('contado','credito');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_pedido') THEN
    CREATE TYPE estado_pedido AS ENUM (
      'pendiente_validacion',  -- bodega aún no valida
      'validado',              -- bodega validó sin cambios
      'ajustado_bodega',       -- bodega validó con cambios (requiere acción cliente)
      'aceptado_cliente',      -- cliente aceptó ajustes
      'rechazado_cliente',     -- cliente rechazó ajustes (se cancela)
      'asignado_ruta',         -- route-service lo planificó (referencia lógica)
      'en_ruta',               -- delivery en curso (referencia lógica)
      'entregado',             -- entregado (referencia lógica)
      'cancelado'              -- cancelado por flujo o admin
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_item_resultado') THEN
    CREATE TYPE estado_item_resultado AS ENUM ('aprobado','aprobado_parcial','sustituido','rechazado');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_descuento') THEN
    CREATE TYPE tipo_descuento AS ENUM ('porcentaje','monto_fijo');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'origen_precio') THEN
    CREATE TYPE origen_precio AS ENUM ('catalogo','regla','negociado');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'accion_cliente_ajuste') THEN
    CREATE TYPE accion_cliente_ajuste AS ENUM ('acepta','rechaza');
  END IF;
END$$;

-- =========================
-- 1) Pedidos
-- =========================

CREATE TABLE app.pedidos (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido         varchar(50) NOT NULL UNIQUE, -- generado en software (legible)

  -- Referencias lógicas (no FK cross-service)
  cliente_id            uuid NOT NULL,
  zona_id               uuid NOT NULL,
  creado_por_id         uuid NOT NULL,               -- actor (cliente o vendedor)
  origen                origen_creacion NOT NULL,

  estado                estado_pedido NOT NULL DEFAULT 'pendiente_validacion',
  metodo_pago           metodo_pago NOT NULL,

  -- Totales: snapshot calculado por API (DB valida no-negativos)
  subtotal              numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  descuento_pedido_tipo tipo_descuento,
  descuento_pedido_valor numeric(12,2) CHECK (descuento_pedido_valor >= 0),
  impuesto              numeric(12,2) NOT NULL DEFAULT 0 CHECK (impuesto >= 0),
  total                 numeric(12,2) NOT NULL CHECK (total >= 0),

  notas                 text,
  fecha_entrega_sugerida date,

  -- Auditoría estándar
  creado_en             timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_en        timestamptz NOT NULL DEFAULT transaction_timestamp(),
  creado_por            uuid,
  actualizado_por       uuid,
  version               int NOT NULL DEFAULT 1,

  -- Reglas básicas de coherencia
  CHECK (
    (descuento_pedido_tipo IS NULL AND descuento_pedido_valor IS NULL)
    OR (descuento_pedido_tipo IS NOT NULL AND descuento_pedido_valor IS NOT NULL)
  )
);

CREATE TRIGGER trg_pedidos_actualizado
BEFORE UPDATE ON app.pedidos
FOR EACH ROW EXECUTE FUNCTION audit.set_actualizado();

CREATE INDEX idx_pedidos_cliente_fecha
  ON app.pedidos(cliente_id, creado_en DESC);

CREATE INDEX idx_pedidos_estado_fecha
  ON app.pedidos(estado, creado_en DESC);

CREATE INDEX idx_pedidos_zona_entrega
  ON app.pedidos(zona_id, fecha_entrega_sugerida);

CREATE INDEX idx_pedidos_numero
  ON app.pedidos(numero_pedido);

-- =========================
-- 2) Items solicitados (lo que el cliente/vendedor pidió)
-- =========================

CREATE TABLE app.items_pedido (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id            uuid NOT NULL REFERENCES app.pedidos(id) ON DELETE CASCADE,

  -- Referencia lógica a catalog-service
  sku_id               uuid NOT NULL,

  cantidad_solicitada  int NOT NULL CHECK (cantidad_solicitada > 0),

  -- Snapshot del catálogo al crear el pedido (para estabilidad)
  sku_nombre_snapshot  varchar(255) NOT NULL,
  sku_codigo_snapshot  varchar(50) NOT NULL,
  sku_peso_gramos_snapshot int NOT NULL CHECK (sku_peso_gramos_snapshot > 0),
  sku_tipo_empaque_snapshot varchar(50) NOT NULL,

  precio_unitario_base numeric(12,2) NOT NULL CHECK (precio_unitario_base >= 0),

  -- Pricing aplicado (flexible y auditable)
  descuento_item_tipo  tipo_descuento,
  descuento_item_valor numeric(12,2) CHECK (descuento_item_valor >= 0),
  precio_origen        origen_precio NOT NULL DEFAULT 'catalogo',
  precio_unitario_final numeric(12,2) NOT NULL CHECK (precio_unitario_final >= 0),

  -- Aprobaciones (si la política lo exige)
  requiere_aprobacion  boolean NOT NULL DEFAULT false,
  aprobado_por         uuid,
  aprobado_en          timestamptz,

  subtotal             numeric(12,2) NOT NULL CHECK (subtotal >= 0),

  creado_en            timestamptz NOT NULL DEFAULT transaction_timestamp(),
  creado_por           uuid,

  CHECK (
    (descuento_item_tipo IS NULL AND descuento_item_valor IS NULL)
    OR (descuento_item_tipo IS NOT NULL AND descuento_item_valor IS NOT NULL)
  ),
  CHECK (
    (requiere_aprobacion = false AND aprobado_por IS NULL AND aprobado_en IS NULL)
    OR (requiere_aprobacion = true)
  )
);

CREATE INDEX idx_items_pedido
  ON app.items_pedido(pedido_id);

-- Opcional (si NO quieres duplicar el mismo SKU en un pedido):
-- ALTER TABLE app.items_pedido ADD CONSTRAINT ux_pedido_sku UNIQUE (pedido_id, sku_id);

-- =========================
-- 3) Validación de bodega (versionada por “ciclo de validación”)
-- =========================
-- Motivo: bodega podría volver a ajustar antes de aceptación del cliente.
-- Mantener ciclos hace el historial más claro y evita ambigüedades.

CREATE TABLE app.validaciones_bodega (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id           uuid NOT NULL REFERENCES app.pedidos(id) ON DELETE CASCADE,

  numero_version      int NOT NULL,  -- 1,2,3... (por pedido)
  validado_por_id     uuid NOT NULL, -- bodeguero (referencia lógica)
  validado_en         timestamptz NOT NULL DEFAULT transaction_timestamp(),

  requiere_aceptacion_cliente boolean NOT NULL DEFAULT false,
  motivo_general      text,

  UNIQUE (pedido_id, numero_version)
);

CREATE INDEX idx_validaciones_pedido
  ON app.validaciones_bodega(pedido_id, numero_version DESC);

-- Resultado por ítem (aprobado/parcial/sustituido/rechazado)
CREATE TABLE app.items_validacion_bodega (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  validacion_id          uuid NOT NULL REFERENCES app.validaciones_bodega(id) ON DELETE CASCADE,
  item_pedido_id         uuid NOT NULL REFERENCES app.items_pedido(id) ON DELETE CASCADE,

  estado_resultado       estado_item_resultado NOT NULL,

  -- Si sustituye: SKU aprobado puede cambiar
  sku_aprobado_id        uuid, -- referencia lógica a catalog
  sku_aprobado_nombre_snapshot varchar(255),
  sku_aprobado_codigo_snapshot varchar(50),

  cantidad_aprobada      int CHECK (cantidad_aprobada >= 0),

  motivo                 text NOT NULL,

  creado_en              timestamptz NOT NULL DEFAULT transaction_timestamp(),

  UNIQUE (validacion_id, item_pedido_id),

  CHECK (
    -- aprobado/aprobado_parcial: sku_aprobado_id NULL implica mismo sku del item
    (estado_resultado IN ('aprobado','aprobado_parcial') AND cantidad_aprobada IS NOT NULL AND cantidad_aprobada >= 0)
    OR
    (estado_resultado = 'rechazado' AND (cantidad_aprobada IS NULL OR cantidad_aprobada = 0))
    OR
    (estado_resultado = 'sustituido' AND sku_aprobado_id IS NOT NULL AND cantidad_aprobada IS NOT NULL AND cantidad_aprobada >= 0)
  )
);

CREATE INDEX idx_items_validacion_validacion
  ON app.items_validacion_bodega(validacion_id);

-- =========================
-- 4) Acción del cliente sobre la validación/ajuste
-- =========================

CREATE TABLE app.acciones_cliente_validacion (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id           uuid NOT NULL REFERENCES app.pedidos(id) ON DELETE CASCADE,
  validacion_id       uuid NOT NULL REFERENCES app.validaciones_bodega(id) ON DELETE CASCADE,

  cliente_id          uuid NOT NULL, -- referencia lógica (quién acepta/rechaza)
  accion              accion_cliente_ajuste NOT NULL,
  comentario          text,

  creado_en           timestamptz NOT NULL DEFAULT transaction_timestamp(),

  UNIQUE (pedido_id, validacion_id)
);

CREATE INDEX idx_acciones_cliente_pedido
  ON app.acciones_cliente_validacion(pedido_id, creado_en DESC);

-- =========================
-- 5) Historial de estados (trazabilidad)
-- =========================

CREATE TABLE app.historial_estado_pedido (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id         uuid NOT NULL REFERENCES app.pedidos(id) ON DELETE CASCADE,
  estado            estado_pedido NOT NULL,
  cambiado_por_id   uuid NOT NULL,
  motivo            text,
  creado_en         timestamptz NOT NULL DEFAULT transaction_timestamp()
);

CREATE INDEX idx_historial_pedido
  ON app.historial_estado_pedido(pedido_id, creado_en DESC);

-- =========================
-- 6) Cancelaciones (opcional, si quieres un registro más claro)
-- =========================
CREATE TABLE app.cancelaciones_pedido (
  pedido_id         uuid PRIMARY KEY REFERENCES app.pedidos(id) ON DELETE CASCADE,
  cancelado_por_id  uuid NOT NULL,
  motivo            text NOT NULL,
  cancelado_en      timestamptz NOT NULL DEFAULT transaction_timestamp()
);

-- =========================
-- 7) Outbox (recomendado)
-- =========================
CREATE TABLE app.outbox_eventos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agregado        text NOT NULL,     -- "order"
  tipo_evento     text NOT NULL,     -- "PedidoCreado", "PedidoValidadoBodega", etc.
  clave_agregado  text NOT NULL,     -- pedido_id
  payload         jsonb NOT NULL,    -- permitido para integración
  creado_en       timestamptz NOT NULL DEFAULT transaction_timestamp(),
  procesado_en    timestamptz,
  intentos        integer NOT NULL DEFAULT 0
);

CREATE INDEX idx_outbox_pendientes
  ON app.outbox_eventos(creado_en)
  WHERE procesado_en IS NULL;

-- Reglas operativas (importantes) que recomiendo documentar para los devs
-- A) Flujo de bodega

-- Bodega crea una fila en validaciones_bodega con numero_version = last+1.

-- Inserta un resultado por cada item en items_validacion_bodega.

-- Si hubo cambios (parcial/sustituido/rechazado), marca requiere_aceptacion_cliente = true y el pedido pasa a ajustado_bodega.

-- Si no hubo cambios, pedido pasa a validado.

-- DB asegura:

-- Resultados por item no duplicados dentro de la misma validación.

-- Sustitución exige sku_aprobado_id.

-- Motivo obligatorio en cada resultado.

-- Software asegura:

-- Que todos los items tengan resultado (puedes validar con query).

-- Que el estado del pedido cambie coherentemente y se registre en historial.

-- B) Aceptación del cliente

-- Cliente crea acciones_cliente_validacion.

-- Si acepta: pedido pasa a aceptado_cliente (o a validado si tu UX lo define así).

-- Si rechaza: pedido pasa a rechazado_cliente y luego cancelado (siempre con registro).

-- DB asegura: una sola acción por validación/pedido.

-- C) Precios y descuentos (flexible sin rigidez)

-- precio_unitario_base siempre existe (snapshot).

-- precio_unitario_final siempre existe (lo cobrado).

-- descuento_item_* y descuento_pedido_* opcionales.

-- “Negociado” se marca con precio_origen = 'negociado' y opcionalmente requiere aprobación.

-- DB asegura: no negativos, coherencia de campos de descuento.

-- Software asegura: políticas (p.ej. max % por cliente/canal, autorización de vendedores, etc.).

-- Seguridad DB (mínimo recomendado)

-- Para no extender demasiado aquí, aplica el mismo patrón de roles por DB:

-- cafrilosa_order_app: CRUD en app.* y lectura en audit.* si necesitas.

-- cafrilosa_order_admin: ALL.

-- cafrilosa_order_readonly: SELECT.

-- Y recuerda:

--REVOKE ALL ON SCHEMA public FROM PUBLIC;

--GRANT explícitos por schema/tablas.