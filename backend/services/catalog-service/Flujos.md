# Flujos CATALOG-SERVICE

Basado **exclusivamente** en las tablas de `cafrilosa_catalogo`:
- `app.categorias`
- `app.productos`
- `app.skus`
- `app.precios_sku`
- `app.outbox_eventos`

---

## 1. Crear Categoría

### Diagrama de Secuencia
```
Admin            Catalog-Service  DB-Catalogo
    |                 |                |
    |-- POST /categorias               |
    |   {nombre, slug, descripcion, orden}
    |                 |                |
    |          [1] SELECT COUNT(*) categorias
    |                 |  WHERE slug = ?
    |                 |                |
    |          [2] INSERT app.categorias
    |                 |  (id=gen_random_uuid(), nombre, slug,
    |                 |   descripcion, orden, activo=true,
    |                 |   creado_por=admin_id)
    |                 |  (trigger -> creado_en, actualizado_en, version)
    |                 |                |
    |<-- 201 Created  |                |
    |  {categoria_id, nombre, slug}    |
```

**Tablas involucradas:**
```sql
-- [1] Verificar unicidad
app.categorias: slug (UNIQUE)

-- [2] Insertar
app.categorias: id, nombre, slug, descripcion, orden, activo,
                creado_en, actualizado_en, creado_por, actualizado_por, version
```

---

## 2. Crear Producto

### Diagrama de Secuencia
```
Admin            Catalog-Service  DB-Catalogo
    |                 |                |
    |-- POST /productos                |
    |   {categoria_id, nombre, slug, descripcion}
    |                 |                |
    |          [1] SELECT id FROM categorias
    |                 |  WHERE id = categoria_id
    |                 |  AND activo = true
    |                 |                |
    |          [2] SELECT COUNT(*) productos
    |                 |  WHERE slug = ?
    |                 |                |
    |          [3] INSERT app.productos
    |                 |  (id=gen_random_uuid(), categoria_id,
    |                 |   nombre, slug, descripcion, activo=true,
    |                 |   creado_por=admin_id)
    |                 |  (trigger -> creado_en, actualizado_en, version)
    |                 |                |
    |          [4] INSERT outbox_eventos
    |                 |  (tipo='ProductoCreado')
    |                 |                |
    |<-- 201 Created  |                |
    |  {producto_id, nombre, slug}     |
```

**Tablas involucradas:**
```sql
-- [1] Validar categoría
app.categorias: id, activo

-- [2] Verificar unicidad
app.productos: slug (UNIQUE)

-- [3] Insertar
app.productos: id, categoria_id (FK), nombre, slug, descripcion, activo,
               creado_en, actualizado_en, creado_por, actualizado_por, version

-- [4] Evento
app.outbox_eventos: tipo_evento='ProductoCreado'
```

---

## 3. Crear SKU

### Diagrama de Secuencia
```
Admin            Catalog-Service  DB-Catalogo
    |                 |                |
    |-- POST /skus    |                |
    |   {producto_id, codigo_sku, nombre,
    |    peso_gramos, tipo_empaque,
    |    requiere_refrigeracion, unidades_por_paquete}
    |                 |                |
    |          [1] SELECT id FROM productos
    |                 |  WHERE id = producto_id
    |                 |  AND activo = true
    |                 |                |
    |          [2] SELECT COUNT(*) skus
    |                 |  WHERE codigo_sku = ?
    |                 |                |
    |          [3] INSERT app.skus    |
    |                 |  (id=gen_random_uuid(), producto_id,
    |                 |   codigo_sku, nombre, peso_gramos,
    |                 |   tipo_empaque, requiere_refrigeracion,
    |                 |   unidades_por_paquete, activo=true,
    |                 |   creado_por=admin_id)
    |                 |                |
    |          [4] INSERT outbox_eventos
    |                 |  (tipo='SkuCreado')
    |                 |                |
    |<-- 201 Created  |                |
    |  {sku_id, codigo_sku, nombre}    |
```

**Tablas involucradas:**
```sql
-- [1] Validar producto
app.productos: id, activo

-- [2] Verificar unicidad
app.skus: codigo_sku (UNIQUE)

-- [3] Insertar
app.skus: id, producto_id (FK), codigo_sku, nombre, peso_gramos,
          tipo_empaque, requiere_refrigeracion, unidades_por_paquete,
          activo, creado_en, creado_por

-- [4] Evento
app.outbox_eventos: tipo_evento='SkuCreado'
```

---

## 4. Crear Precio Inicial de SKU

### Diagrama de Secuencia
```
Admin            Catalog-Service  DB-Catalogo
    |                 |                |
    |-- POST /skus/{id}/precio        |
    |   {precio, moneda}               |
    |                 |                |
    |          [1] SELECT id FROM skus|
    |                 |  WHERE id = sku_id
    |                 |  AND activo = true
    |                 |                |
    |          [2] SELECT COUNT(*) precios_sku
    |                 |  WHERE sku_id = ?
    |                 |  AND vigente_hasta IS NULL
    |                 |  (INDEX ux_precio_vigente_por_sku)
    |                 |                |
    |          [3] IF count > 0 THEN ERROR
    |                 |                |
    |          [4] INSERT app.precios_sku
    |                 |  (id=gen_random_uuid(), sku_id,
    |                 |   precio, moneda='USD',
    |                 |   vigente_desde=now(), vigente_hasta=NULL,
    |                 |   creado_por=admin_id)
    |                 |                |
    |          [5] INSERT outbox_eventos
    |                 |  (tipo='PrecioSkuCreado')
    |                 |                |
    |<-- 201 Created  |                |
    |  {precio_id, sku_id, precio, vigente_desde}
```

**Tablas involucradas:**
```sql
-- [1] Validar SKU activo
app.skus: id, activo

-- [2] Verificar que no existe precio vigente
app.precios_sku: sku_id, vigente_hasta (INDEX ux_precio_vigente_por_sku)

-- [4] Insertar precio
app.precios_sku: id, sku_id (FK), precio, moneda, vigente_desde,
                 vigente_hasta, creado_en, creado_por

-- [5] Evento
app.outbox_eventos: tipo_evento='PrecioSkuCreado'
```

---

## 5. Actualizar Precio de SKU (cerrar vigente y crear nuevo)

### Diagrama de Secuencia
```
Admin            Catalog-Service  DB-Catalogo
    |                 |                |
    |-- PUT /skus/{id}/precio         |
    |   {nuevo_precio, motivo}         |
    |                 |                |
    |          [1] BEGIN TRANSACTION  |
    |                 |                |
    |          [2] SELECT * FROM skus |
    |                 |  WHERE id = sku_id
    |                 |  FOR UPDATE    |
    |                 |                |
    |          [3] UPDATE app.precios_sku
    |                 |  SET vigente_hasta = transaction_timestamp()
    |                 |  WHERE sku_id = ?
    |                 |  AND vigente_hasta IS NULL
    |                 |  (cierra precio vigente anterior)
    |                 |                |
    |          [4] INSERT app.precios_sku
    |                 |  (id=gen_random_uuid(), sku_id,
    |                 |   precio=nuevo_precio, moneda='USD',
    |                 |   vigente_desde=now(), vigente_hasta=NULL,
    |                 |   creado_por=admin_id)
    |                 |                |
    |          [5] INSERT outbox_eventos
    |                 |  (tipo='PrecioSkuActualizado')
    |                 |                |
    |          [6] COMMIT             |
    |                 |                |
    |<-- 200 OK       |                |
    |  {precio_id, precio_anterior, precio_nuevo}
```

**Tablas involucradas:**
```sql
-- [2] Bloqueo pesimista del SKU
app.skus: id (FOR UPDATE)

-- [3] Cerrar precio vigente
app.precios_sku: sku_id, vigente_hasta (INDEX ux_precio_vigente_por_sku)

-- [4] Crear nuevo precio vigente
app.precios_sku: id, sku_id, precio, vigente_desde, vigente_hasta

-- [5] Evento
app.outbox_eventos: tipo_evento='PrecioSkuActualizado'
```

---

## 6. Consultar Precio Vigente de SKU

### Diagrama de Secuencia
```
Order-Service    Catalog-Service  DB-Catalogo
    |                 |                |
    |-- GET /skus/{id}/precio-vigente |
    |                 |                |
    |          [1] SELECT p.*, s.codigo_sku, s.nombre
    |                 |  FROM app.precios_sku p
    |                 |  JOIN app.skus s ON s.id = p.sku_id
    |                 |  WHERE p.sku_id = ?
    |                 |  AND p.vigente_hasta IS NULL
    |                 |  (INDEX ux_precio_vigente_por_sku)
    |                 |                |
    |<-- 200 OK       |                |
    |  {precio_id, sku_id, precio, moneda, vigente_desde}
```

**Tablas involucradas:**
```sql
-- [1] Consulta precio vigente
app.precios_sku: id, sku_id, precio, moneda, vigente_desde, vigente_hasta
                 (INDEX ux_precio_vigente_por_sku)
app.skus: id, codigo_sku, nombre
```

---

## 7. Consultar Precios Vigentes por Lote (batch)

### Diagrama de Secuencia
```
Order-Service    Catalog-Service  DB-Catalogo
    |                 |                |
    |-- POST /skus/precios-vigentes   |
    |   {sku_ids: [uuid1, uuid2, ...]}|
    |                 |                |
    |          [1] SELECT p.sku_id, p.precio, p.moneda,
    |                 |         s.codigo_sku, s.nombre,
    |                 |         s.peso_gramos, s.tipo_empaque
    |                 |  FROM app.precios_sku p
    |                 |  JOIN app.skus s ON s.id = p.sku_id
    |                 |  WHERE p.sku_id = ANY(?)
    |                 |  AND p.vigente_hasta IS NULL
    |                 |  AND s.activo = true
    |                 |                |
    |<-- 200 OK       |                |
    |  [{sku_id, precio, codigo_sku, nombre}, ...]
```

**Tablas involucradas:**
```sql
-- [1] Consulta batch
app.precios_sku: sku_id, precio, moneda, vigente_hasta
                 (INDEX idx_precios_sku_historial)
app.skus: id, codigo_sku, nombre, peso_gramos, tipo_empaque, activo
```

---

## 8. Consultar Histórico de Precios de SKU

### Diagrama de Secuencia
```
Admin/Reportes   Catalog-Service  DB-Catalogo
    |                 |                |
    |-- GET /skus/{id}/precios-historial
    |                 |                |
    |          [1] SELECT * FROM precios_sku
    |                 |  WHERE sku_id = ?
    |                 |  ORDER BY vigente_desde DESC
    |                 |  (INDEX idx_precios_sku_historial)
    |                 |                |
    |<-- 200 OK       |                |
    |  [{precio_id, precio, vigente_desde, vigente_hasta}, ...]
```

**Tablas involucradas:**
```sql
-- [1] Historial completo
app.precios_sku: id, sku_id, precio, moneda, vigente_desde, vigente_hasta,
                 creado_en, creado_por
                 (INDEX idx_precios_sku_historial)
```

---

## 9. Listar Productos por Categoría

### Diagrama de Secuencia
```
Cliente/App      Catalog-Service  DB-Catalogo
    |                 |                |
    |-- GET /categorias/{id}/productos|
    |                 |                |
    |          [1] SELECT c.* FROM categorias c
    |                 |  WHERE c.id = categoria_id
    |                 |  AND c.activo = true
    |                 |                |
    |          [2] SELECT p.* FROM productos p
    |                 |  WHERE p.categoria_id = ?
    |                 |  AND p.activo = true
    |                 |  ORDER BY p.nombre
    |                 |  (INDEX idx_productos_categoria_activos)
    |                 |                |
    |<-- 200 OK       |                |
    |  [{producto_id, nombre, slug, descripcion}, ...]
```

**Tablas involucradas:**
```sql
-- [1] Validar categoría activa
app.categorias: id, activo

-- [2] Productos de la categoría
app.productos: id, categoria_id, nombre, slug, descripcion, activo
               (INDEX idx_productos_categoria_activos)
```

---

## 10. Listar SKUs de Producto

### Diagrama de Secuencia
```
Cliente/App      Catalog-Service  DB-Catalogo
    |                 |                |
    |-- GET /productos/{id}/skus      |
    |                 |                |
    |          [1] SELECT p.* FROM productos p
    |                 |  WHERE p.id = producto_id
    |                 |  AND p.activo = true
    |                 |                |
    |          [2] SELECT s.*, p_precio.precio, p_precio.moneda
    |                 |  FROM app.skus s
    |                 |  LEFT JOIN app.precios_sku p_precio
    |                 |    ON p_precio.sku_id = s.id
    |                 |    AND p_precio.vigente_hasta IS NULL
    |                 |  WHERE s.producto_id = ?
    |                 |  AND s.activo = true
    |                 |  ORDER BY s.peso_gramos
    |                 |  (INDEX idx_skus_producto_activos)
    |                 |                |
    |<-- 200 OK       |                |
    |  [{sku_id, codigo, nombre, peso, precio, tipo_empaque}, ...]
```

**Tablas involucradas:**
```sql
-- [1] Validar producto activo
app.productos: id, activo

-- [2] SKUs del producto con precio vigente
app.skus: id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque,
          requiere_refrigeracion, unidades_por_paquete, activo
          (INDEX idx_skus_producto_activos)
app.precios_sku: sku_id, precio, moneda, vigente_hasta
```

---

## 11. Desactivar SKU

### Diagrama de Secuencia
```
Admin            Catalog-Service  DB-Catalogo
    |                 |                |
    |-- PUT /skus/{id}/desactivar     |
    |   {motivo}      |                |
    |                 |                |
    |          [1] SELECT * FROM skus |
    |                 |  WHERE id = sku_id
    |                 |  AND activo = true
    |                 |  FOR UPDATE    |
    |                 |                |
    |          [2] UPDATE app.skus    |
    |                 |  SET activo = false
    |                 |  WHERE id = sku_id
    |                 |                |
    |          [3] INSERT outbox_eventos
    |                 |  (tipo='SkuDesactivado')
    |                 |                |
    |<-- 200 OK       |                |
```

**Tablas involucradas:**
```sql
-- [1-2] Desactivar SKU
app.skus: id, activo, creado_en

-- [3] Evento
app.outbox_eventos: tipo_evento='SkuDesactivado'
```

---

## 12. Actualizar Categoría (orden/nombre)

### Diagrama de Secuencia
```
Admin            Catalog-Service  DB-Catalogo
    |                 |                |
    |-- PUT /categorias/{id}          |
    |   {nombre, descripcion, orden}  |
    |                 |                |
    |          [1] UPDATE app.categorias
    |                 |  SET nombre = ?,
    |                 |      descripcion = ?,
    |                 |      orden = ?,
    |                 |      actualizado_por = admin_id
    |                 |  WHERE id = categoria_id
    |                 |  (trigger -> actualizado_en, version++)
    |                 |                |
    |<-- 200 OK       |                |
```

**Tablas involucradas:**
```sql
-- [1] Actualizar
app.categorias: id, nombre, descripcion, orden, actualizado_en,
                actualizado_por, version
```

---

## 13. Buscar SKUs por Código o Nombre

### Diagrama de Secuencia
```
Order-Service    Catalog-Service  DB-Catalogo
    |                 |                |
    |-- GET /skus/buscar?q=pollo      |
    |                 |                |
    |          [1] SELECT s.*, p.nombre as producto_nombre,
    |                 |         precio.precio, precio.moneda
    |                 |  FROM app.skus s
    |                 |  JOIN app.productos p ON p.id = s.producto_id
    |                 |  LEFT JOIN app.precios_sku precio
    |                 |    ON precio.sku_id = s.id
    |                 |    AND precio.vigente_hasta IS NULL
    |                 |  WHERE s.activo = true
    |                 |  AND p.activo = true
    |                 |  AND (
    |                 |    s.codigo_sku ILIKE '%pollo%'
    |                 |    OR s.nombre ILIKE '%pollo%'
    |                 |  )
    |                 |  ORDER BY s.nombre
    |                 |  LIMIT 50
    |                 |  (INDEX idx_skus_codigo)
    |                 |                |
    |<-- 200 OK       |                |
    |  [{sku_id, codigo, nombre, precio}, ...]
```

**Tablas involucradas:**
```sql
-- [1] Búsqueda
app.skus: id, producto_id, codigo_sku, nombre, activo
          (INDEX idx_skus_codigo)
app.productos: id, nombre, activo
app.precios_sku: sku_id, precio, moneda, vigente_hasta
```

---

**Resumen de tablas CATALOG-SERVICE:**
- ✅ `app.categorias` - Organización de productos
- ✅ `app.productos` - Productos base
- ✅ `app.skus` - Presentaciones/variantes de productos
- ✅ `app.precios_sku` - Precio vigente + historial
- ✅ `app.outbox_eventos` - Eventos para otros servicios