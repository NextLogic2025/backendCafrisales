# Order Service

Microservicio de gestión de pedidos con validaciones de bodega, acciones de cliente y trazabilidad completa.

## 🚀 Inicio Rápido

### Requisitos
- Node.js 24+
- PostgreSQL 17+
- Docker (opcional)

### Instalación

```bash
npm install
```

### Variables de Entorno

Crear archivo `.env`:

```bash
DATABASE_URL=postgres://admin:root@localhost:5432/cafrilosa_pedidos
JWT_SECRET=MiSecretoSuperSeguro2025ParaDesarrolloLocal
SERVICE_TOKEN=MiTokenS2S123
PORT=3000
NODE_ENV=development

# External Services
CATALOG_SERVICE_URL=http://catalog-service:3000
USER_SERVICE_URL=http://user-service:3000
ZONE_SERVICE_URL=http://zone-service:3000
```

### Ejecutar

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

---

## 📦 Módulos

### Orders Module
Gestión completa de pedidos con CRUD, cálculo automático de totales y estados.

**Endpoints:**
- `POST /api/orders` - Crear pedido
- `GET /api/orders` - Listar todos
- `GET /api/orders/my-orders` - Mis pedidos (Cliente)
- `GET /api/orders/:id` - Ver pedido
- `PATCH /api/orders/:id/status` - Cambiar estado
- `PATCH /api/orders/:id/cancel` - Cancelar
- `DELETE /api/orders/:id` - Eliminar

### Validations Module
Validación de bodega con versionado automático.

**Endpoints:**
- `POST /api/validations` - Crear validación (Bodeguero/Admin)
- `GET /api/validations/order/:pedidoId` - Ver validaciones
- `GET /api/validations/:id` - Ver validación específica

### Actions Module
Acciones del cliente sobre validaciones (aceptar/rechazar ajustes).

### History Module
Trazabilidad automática de cambios de estado.

### Outbox Module
Patrón Outbox para publicación de eventos.

---

## 🔐 Seguridad

### Roles Disponibles
```typescript
- ADMIN
- CLIENTE
- VENDEDOR
- BODEGUERO
- SUPERVISOR
- TRANSPORTISTA
```

### Guards
- **JwtAuthGuard** - Autenticación JWT
- **RolesGuard** - Control de acceso por roles
- **ServiceTokenGuard** - Endpoints internos S2S

---

## 📊 Estados del Pedido

```typescript
- BORRADOR
- PENDIENTE_VALIDACION
- VALIDADO
- AJUSTE_PENDIENTE
- CONFIRMADO
- RECHAZADO
- CANCELADO
```

---

## 🗄️ Base de Datos

**Schema:** `app`

**Tablas:**
- `pedidos` - Pedidos principales
- `items_pedido` - Items de pedidos
- `validaciones_bodega` - Validaciones de bodega
- `items_validacion` - Resultados por item
- `acciones_cliente_validacion` - Acciones del cliente
- `historial_estado_pedido` - Historial de cambios
- `outbox` - Eventos

---

## 🔌 Servicios Externos

### CatalogExternalService
Consulta información de SKUs y precios.

### UserExternalService
Consulta información de clientes y usuarios.

### ZoneExternalService
Consulta información de zonas y cobertura.

---

## 📝 Ejemplo de Uso

### Crear Pedido

```bash
POST /api/orders
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "cliente_id": "uuid-cliente",
  "zona_id": "uuid-zona",
  "notas": "Pedido urgente",
  "items": [
    {
      "sku_id": "uuid-sku-1",
      "cantidad": 10,
      "precio_unitario": 4.50,
      "origen_precio": "catalogo"
    }
  ]
}
```

**Respuesta:**
```json
{
  "id": "uuid-pedido",
  "numero_pedido": "PED-2026-0001",
  "estado": "borrador",
  "subtotal": 45.00,
  "impuestos": 5.40,
  "total": 50.40,
  "items": [...]
}
```

### Validar Pedido (Bodeguero)

```bash
POST /api/validations
Authorization: Bearer <jwt-token-bodeguero>
Content-Type: application/json

{
  "pedido_id": "uuid-pedido",
  "bodeguero_id": "uuid-bodeguero",
  "observaciones": "Stock verificado",
  "items": [
    {
      "item_pedido_id": "uuid-item-1",
      "cantidad_disponible": 10,
      "cantidad_ajustada": 10,
      "aprobado": true
    }
  ]
}
```

---

## 🏗️ Arquitectura

### Patrón de Capas

```
Controllers (API Layer)
    ↓
Services (Business Logic)
    ↓
Repositories (Data Access)
    ↓
Database (PostgreSQL)
```

### Comunicación S2S

```
order-service
    ↓ (Service Token)
├─ catalog-service (SKUs, Precios)
├─ user-service (Clientes, Usuarios)
└─ zone-service (Zonas, Cobertura)
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

---

## 🐳 Docker

```bash
# Build
docker build -t order-service .

# Run
docker run -p 3000:3000 --env-file .env order-service
```

---

## 📚 Documentación Adicional

- [Walkthrough Completo](../../.gemini/antigravity/brain/f0084732-91ae-4204-a29f-baaf28389123/order-service-walkthrough.md)
- [Database Schema](../../infra/local-init/05-init-cafrilosa_pedidos.sql)

---

## 🤝 Contribuir

1. Seguir los patrones establecidos
2. Mantener cobertura de tests
3. Documentar cambios importantes
4. Usar commits descriptivos

---

## 📄 Licencia

UNLICENSED - Uso privado
