**Catalog Service — Postman Quickstart**

- **Descripción**: colección de ejemplo para probar los endpoints del `catalog-service` (categorías, productos, SKUs, precios).

- **Variables de entorno recomendadas (Postman)**
  - `BASE_URL` — URL base del servicio, p. ej. `http://localhost:3003` (ajusta según compose).
  - `AUTH_TOKEN` — JWT de usuario (Bearer token) obtenido desde `auth-service`.
  - `SERVICE_TOKEN` — token compartido para llamadas S2S (`x-service-token`) si aplica.

- **Headers comunes**
  - `Authorization: Bearer {{AUTH_TOKEN}}` — para endpoints protegidos.
  - `x-service-token: {{SERVICE_TOKEN}}` — para llamadas internas S2S (opcional).

Endpoints (ejemplos)

- Listar categorías
  - Método: `GET`
  - URL: `{{BASE_URL}}/categories`

- Crear categoría (protegido — roles: ADMIN/STAFF/SUPERVISOR)
  - Método: `POST`
  - URL: `{{BASE_URL}}/categories`
  - Headers: `Authorization`
  - Body (JSON):
    {
      "nombre": "Bebidas",
      "descripcion": "Refrescos y jugos",
      "meta": { "origen": "importado" }
    }

- Listar productos
  - Método: `GET`
  - URL: `{{BASE_URL}}/products`

- Crear producto (protegido — roles: ADMIN/STAFF/SUPERVISOR)
  - Método: `POST`
  - URL: `{{BASE_URL}}/products`
  - Headers: `Authorization`
  - Body (JSON):
    {
      "nombre": "Cola Zero",
      "categoria_id": "<category-id>",
      "descripcion": "Bebida gasificada",
      "marca": "MarcaX",
      "atributos": { "sabor": "cola", "volumen": "500ml" }
    }

- Listar SKUs
  - Método: `GET`
  - URL: `{{BASE_URL}}/skus`

- Crear SKU (protegido — roles: ADMIN/STAFF/SUPERVISOR)
  - Método: `POST`
  - URL: `{{BASE_URL}}/skus`
  - Headers: `Authorization`
  - Body (JSON):
    {
      "product_id": "<product-id>",
      "codigo": "SKU-12345",
      "atributos": { "tamaño": "500ml", "presentacion": "lata" },
      "enabled": true
    }

- Obtener precio actual de un SKU
  - Método: `GET`
  - URL: `{{BASE_URL}}/prices/:skuId`

- Actualizar precio (protegido — roles: ADMIN/STAFF/SUPERVISOR)
  - Método: `POST`
  - URL: `{{BASE_URL}}/prices`
  - Headers: `Authorization`
  - Body (JSON):
    {
      "sku_id": "<sku-id>",
      "precio": 12900,
      "moneda": "CLP",
      "vigencia_desde": "2026-01-25T00:00:00Z"
    }

Ejemplos JSON completos (solos cuerpos de `POST`)

- Crear categoría

```json
{
  "nombre": "Bebidas",
  "descripcion": "Refrescos y jugos",
  "meta": { "origen": "importado" }
}
```

- Crear producto

```json
{
  "nombre": "Cola Zero",
  "categoria_id": "<category-id>",
  "descripcion": "Bebida gasificada",
  "marca": "MarcaX",
  "atributos": { "sabor": "cola", "volumen": "500ml" }
}
```

- Crear SKU

```json
{
  "product_id": "<product-id>",
  "codigo": "SKU-12345",
  "atributos": { "tamaño": "500ml", "presentacion": "lata" },
  "enabled": true
}
```

- Crear/Actualizar precio

```json
{
  "sku_id": "<sku-id>",
  "precio": 12900,
  "moneda": "CLP",
  "vigencia_desde": "2026-01-25T00:00:00Z"
}
```

Cómo obtener `AUTH_TOKEN` rápidamente
- Usa tu `auth-service` (p. ej. `POST {{AUTH_URL}}/v1/auth/login`) con credenciales válidas.
- Copia el `accessToken` en la variable `AUTH_TOKEN` en Postman.

Ejemplo cURL para crear categoría

```bash
curl -X POST "${BASE_URL}/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{"nombre":"Bebidas","descripcion":"Refrescos"}'
```

Importar a Postman
- Crear un environment con las variables `BASE_URL`, `AUTH_TOKEN` y `SERVICE_TOKEN`.
- Crear requests manualmente usando los ejemplos anteriores, o exportar esta guía como referencia.

Notas
- Los endpoints de creación/actualización están protegidos con JWT y un guard de roles (`ADMIN`, `STAFF`, `SUPERVISOR`). Asegúrate de que el token tenga la propiedad `role` correspondiente.
- Si necesitas, puedo generar y añadir una colección Postman `.json` descargable con todos los requests definidos.
