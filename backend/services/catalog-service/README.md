# Catalog Service - API Testing Guide

Servicio de gestión de catálogo de productos con soporte para categorías, productos, SKUs y precios con historial.

## 🚀 Endpoints Disponibles

### Base URL
```
http://localhost:3003/api
```

---

## 📦 Productos

### 1. Crear Producto Completo (Recomendado)
Crea categoría, producto, SKU y precio en una sola transacción atómica.

**Endpoint:** `POST /products/complete`

**Body:**
```json
{
  "categoria_nombre": "Embutidos",
  "nombre": "Mortadela Especial",
  "descripcion": "Mortadela tradicional con receta de la casa",
  "sku": {
    "codigo_sku": "MORT-ESP-500",
    "nombre": "Mortadela Especial 500g",
    "peso_gramos": 500,
    "tipo_empaque": "tripa_sintetica",
    "requiere_refrigeracion": true
  },
  "precio": {
    "precio": 4.50,
    "moneda": "USD"
  }
}
```

**Características:**
- ✅ Auto-genera slugs (`"Mortadela Especial"` → `"mortadela-especial"`)
- ✅ Detecta categorías existentes por slug
- ✅ Valida unicidad del `codigo_sku` (devuelve 409 si ya existe)
- ✅ Transacción atómica (rollback automático si algo falla)

### 2. Listar Productos con SKUs y Precios
**Endpoint:** `GET /products`

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "nombre": "Mortadela Especial",
    "slug": "mortadela-especial",
    "categoria": { "nombre": "Embutidos" },
    "skus": [
      {
        "codigo_sku": "MORT-ESP-500",
        "nombre": "Mortadela Especial 500g",
        "peso_gramos": 500,
        "precios": [
          {
            "precio": 4.50,
            "vigente_hasta": null
          }
        ]
      }
    ]
  }
]
```

### 3. Ver Producto Individual
**Endpoint:** `GET /products/:id`

---

## 🏷️ Categorías

### 1. Crear Categoría
**Endpoint:** `POST /categories`

```json
{
  "nombre": "Lácteos",
  "descripcion": "Productos derivados de la leche"
}
```
*El slug se genera automáticamente: `"lacteos"`*

### 2. Listar Categorías
**Endpoint:** `GET /categories`

---

## 📋 SKUs

### 1. Listar SKUs (Simple)
Solo SKU + Producto

**Endpoint:** `GET /skus`

```json
[
  {
    "id": "uuid",
    "codigo_sku": "MORT-ESP-500",
    "nombre": "Mortadela Especial 500g",
    "peso_gramos": 500,
    "producto": {
      "nombre": "Mortadela Especial"
    }
  }
]
```

### 2. Listar SKUs (Completo)
SKU + Producto + Categoría + Precios

**Endpoint:** `GET /skus/complete`

```json
[
  {
    "id": "uuid",
    "codigo_sku": "MORT-ESP-500",
    "producto": {
      "nombre": "Mortadela Especial",
      "categoria": {
        "nombre": "Embutidos"
      }
    },
    "precios": [
      {
        "precio": 4.50,
        "vigente_desde": "2026-01-25T10:00:00Z",
        "vigente_hasta": null
      }
    ]
  }
]
```

---

## 💰 Precios

### 1. Actualizar Precio de un SKU
Cierra el precio actual y crea uno nuevo.

**Endpoint:** `POST /prices`

```json
{
  "sku_id": "uuid-del-sku",
  "precio": 5.50
}
```

**Comportamiento:**
1. Marca el precio actual como `vigente_hasta = NOW()`
2. Crea nuevo precio vigente desde ahora

### 2. Consultar Precio Actual de un SKU
**Endpoint:** `GET /prices/:skuId`

Devuelve el precio donde `vigente_hasta` es `null`.

### 3. Ver Historial Completo de Precios
**Endpoint:** `GET /prices`

---

## 🧪 Ejemplos de Prueba

### Crear varios productos en la misma categoría:

```bash
# Producto 1
curl -X POST http://localhost:3003/api/products/complete \
  -H "Content-Type: application/json" \
  -d '{
    "categoria_nombre": "Embutidos",
    "nombre": "Mortadela Especial",
    "sku": {
      "codigo_sku": "MORT-ESP-500",
      "nombre": "Mortadela Especial 500g",
      "peso_gramos": 500
    },
    "precio": { "precio": 4.50 }
  }'

# Producto 2 (usa la misma categoría)
curl -X POST http://localhost:3003/api/products/complete \
  -H "Content-Type: application/json" \
  -d '{
    "categoria_nombre": "Embutidos",
    "nombre": "Chorizo Parrillero",
    "sku": {
      "codigo_sku": "CHOR-PAR-400",
      "nombre": "Chorizo Parrillero 400g",
      "peso_gramos": 400
    },
    "precio": { "precio": 3.80 }
  }'
```

### Actualizar precio:

```bash
curl -X POST http://localhost:3003/api/prices \
  -H "Content-Type: application/json" \
  -d '{
    "sku_id": "uuid-del-sku-aqui",
    "precio": 5.00
  }'
```

---

## ⚠️ Códigos de Error

- **400 Bad Request**: Datos inválidos o faltantes
- **404 Not Found**: Recurso no encontrado
- **409 Conflict**: `codigo_sku` duplicado
- **500 Internal Server Error**: Error del servidor

---

## 🔐 Autenticación

La mayoría de endpoints requieren autenticación JWT y roles específicos:
- **ADMIN**: Acceso completo
- **STAFF**: Crear/editar productos
- **SUPERVISOR**: Crear/editar productos

Endpoints públicos (sin autenticación):
- `GET /products`
- `GET /categories`
- `GET /skus`
- `GET /skus/complete`
