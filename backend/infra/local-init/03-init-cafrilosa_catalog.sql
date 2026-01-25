-- 3) CATALOG-SERVICE (categorías, productos, SKUs, precios)

-- Objetivo: ser el “source of truth” del catálogo y precios base.
-- Decisión clave (simple y robusta): 1 precio vigente por SKU ⇒ vigente_hasta IS NULL con UNIQUE INDEX parcial.

-- DDL (PostgreSQL 17)
-- =====================================================
-- CATALOG-SERVICE
-- Base: cafrilosa_catalogo
-- Solo: categorías, productos, SKUs, precios
-- =====================================================


\c cafrilosa_catalogo

CREATE EXTENSION IF NOT EXISTS pgcrypto;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS audit;

-- Actualizado + version (mismo patrón)
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
-- 1) Categorías / Productos
-- =========================

CREATE TABLE app.categorias (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           varchar(100) NOT NULL,
  slug             varchar(120) NOT NULL UNIQUE,
  descripcion      text,
  orden            int NOT NULL DEFAULT 0,
  activo           boolean NOT NULL DEFAULT true,

  creado_en        timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_en   timestamptz NOT NULL DEFAULT transaction_timestamp(),
  creado_por       uuid,
  actualizado_por  uuid,
  version          int NOT NULL DEFAULT 1
);

CREATE TRIGGER trg_categorias_actualizado
BEFORE UPDATE ON app.categorias
FOR EACH ROW EXECUTE FUNCTION audit.set_actualizado();

CREATE INDEX idx_categorias_activas_orden
  ON app.categorias(orden)
  WHERE activo;

CREATE TABLE app.productos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id     uuid NOT NULL REFERENCES app.categorias(id),
  nombre           varchar(255) NOT NULL,
  slug             varchar(255) NOT NULL UNIQUE,
  descripcion      text,
  activo           boolean NOT NULL DEFAULT true,

  creado_en        timestamptz NOT NULL DEFAULT transaction_timestamp(),
  actualizado_en   timestamptz NOT NULL DEFAULT transaction_timestamp(),
  creado_por       uuid,
  actualizado_por  uuid,
  version          int NOT NULL DEFAULT 1
);

CREATE TRIGGER trg_productos_actualizado
BEFORE UPDATE ON app.productos
FOR EACH ROW EXECUTE FUNCTION audit.set_actualizado();

CREATE INDEX idx_productos_categoria_activos
  ON app.productos(categoria_id)
  WHERE activo;

-- =========================
-- 2) SKUs (presentaciones)
-- =========================
-- Nota: “tipo_empaque” podría ser catálogo si crece; por ahora texto controlado por la app.

CREATE TABLE app.skus (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id             uuid NOT NULL REFERENCES app.productos(id),

  codigo_sku              varchar(50) NOT NULL UNIQUE,
  nombre                  varchar(255) NOT NULL,

  peso_gramos             int NOT NULL CHECK (peso_gramos > 0),
  tipo_empaque            varchar(50) NOT NULL,
  requiere_refrigeracion  boolean NOT NULL DEFAULT false,
  unidades_por_paquete    int NOT NULL DEFAULT 1 CHECK (unidades_por_paquete > 0),

  activo                  boolean NOT NULL DEFAULT true,

  creado_en               timestamptz NOT NULL DEFAULT transaction_timestamp(),
  creado_por              uuid
);

CREATE INDEX idx_skus_producto_activos
  ON app.skus(producto_id)
  WHERE activo;

CREATE INDEX idx_skus_codigo
  ON app.skus(codigo_sku);

-- =========================
-- 3) Precios por SKU
-- =========================
-- Regla: histórico por vigencia; vigente = vigente_hasta IS NULL.
-- Evitamos NOW() en índices parciales.

CREATE TABLE app.precios_sku (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id          uuid NOT NULL REFERENCES app.skus(id),

  precio          numeric(12,2) NOT NULL CHECK (precio >= 0),
  moneda          char(3) NOT NULL DEFAULT 'USD',

  vigente_desde   timestamptz NOT NULL DEFAULT transaction_timestamp(),
  vigente_hasta   timestamptz,

  creado_en       timestamptz NOT NULL DEFAULT transaction_timestamp(),
  creado_por      uuid,

  CHECK (vigente_hasta IS NULL OR vigente_hasta > vigente_desde)
);

-- Historial y consultas por rango
CREATE INDEX idx_precios_sku_historial
  ON app.precios_sku(sku_id, vigente_desde DESC);

-- Un solo precio vigente por SKU (simple y muy útil)
CREATE UNIQUE INDEX ux_precio_vigente_por_sku
  ON app.precios_sku(sku_id)
  WHERE vigente_hasta IS NULL;

-- =========================
-- 4) Outbox (opcional)
-- =========================
CREATE TABLE app.outbox_eventos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agregado        text NOT NULL,          -- "catalog"
  tipo_evento     text NOT NULL,          -- "PrecioSkuActualizado"
  clave_agregado  text NOT NULL,          -- sku_id o producto_id
  payload         jsonb NOT NULL,         -- permitido: evento
  creado_en       timestamptz NOT NULL DEFAULT transaction_timestamp(),
  procesado_en    timestamptz,
  intentos        integer NOT NULL DEFAULT 0
);

CREATE INDEX idx_outbox_pendientes
  ON app.outbox_eventos(creado_en)
  WHERE procesado_en IS NULL;

-- Qué se controla en DB vs software (Catálogo)

-- DB: unicidad SKU/slug, integridad de vigencias, “un vigente” por SKU, no negativos.

-- API: reglas de publicación, quién puede crear/cambiar (autorización), validación semántica (p.ej. tipo_empaque permitido), cierre del precio vigente anterior antes de insertar el nuevo.

-- Nota práctica: la operación “cambiar precio” en la API debe ser transaccional: cerrar vigente anterior (vigente_hasta) y crear nuevo.