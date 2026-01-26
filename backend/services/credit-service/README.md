# Credit Service

Microservicio de gestión de créditos, pagos y cobranza con reportes de cartera completos.

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
DATABASE_URL=postgres://admin:root@localhost:5432/cafrilosa_creditos
JWT_SECRET=MiSecretoSuperSeguro2025ParaDesarrolloLocal
SERVICE_TOKEN=MiTokenS2S123
PORT=3000
NODE_ENV=development

# External Services
ORDER_SERVICE_URL=http://order-service:3000
USER_SERVICE_URL=http://user-service:3000
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

### Credits Module
Aprobaciones de crédito con validaciones de negocio.

**Endpoints:**
- `POST /api/credits` - Aprobar crédito (Vendedor/Admin/Supervisor)
- `GET /api/credits` - Listar todos (Admin/Supervisor)
- `GET /api/credits/client/:clienteId` - Créditos por cliente
- `GET /api/credits/seller/:vendedorId` - Créditos por vendedor
- `GET /api/credits/order/:pedidoId` - Crédito por pedido
- `GET /api/credits/:id` - Ver crédito
- `PATCH /api/credits/:id/status` - Cambiar estado (Admin/Supervisor)
- `PATCH /api/credits/:id/cancel` - Cancelar (Admin/Supervisor)

### Payments Module
Registro de pagos con cálculo automático de saldos.

**Endpoints:**
- `POST /api/payments` - Registrar pago (Vendedor/Admin/Supervisor)
- `GET /api/payments/credit/:aprobacionCreditoId` - Pagos por crédito
- `GET /api/payments/credit/:aprobacionCreditoId/balance` - Consultar saldo
- `GET /api/payments/:id` - Ver pago

### Reports Module
Reportes de cartera y análisis de créditos.

**Endpoints:**
- `GET /api/reports/portfolio` - Resumen completo de cartera (Admin/Supervisor)
- `GET /api/reports/active-credits` - Créditos activos
- `GET /api/reports/overdue` - Créditos vencidos (Admin/Supervisor)

### History Module
Auditoría automática de cambios de estado.

### Outbox Module
Patrón Outbox para publicación de eventos.

---

## 🔐 Seguridad

### Roles Disponibles
```typescript
- ADMIN
- CLIENTE
- VENDEDOR
- SUPERVISOR
```

### Guards
- **JwtAuthGuard** - Autenticación JWT
- **RolesGuard** - Control de acceso por roles
- **ServiceTokenGuard** - Endpoints internos S2S

---

## 📊 Estados del Crédito

```typescript
- ACTIVO
- VENCIDO
- PAGADO
- CANCELADO
```

---

## 🗄️ Base de Datos

**Schema:** `app`

**Tablas:**
- `aprobaciones_credito` - Aprobaciones de crédito
- `pagos_credito` - Registro de pagos
- `historial_estado_credito` - Historial de cambios
- `outbox_eventos` - Eventos

**Vista:**
- `v_credito_totales` - Totales por crédito (saldo, pagado)

---

## 🔌 Servicios Externos

### OrderExternalService
Consulta información de pedidos.

### UserExternalService
Consulta información de clientes y vendedores.

---

## 📝 Ejemplo de Uso

### Aprobar Crédito

```bash
POST /api/credits
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "pedido_id": "uuid-pedido",
  "cliente_id": "uuid-cliente",
  "aprobado_por_vendedor_id": "uuid-vendedor",
  "monto_aprobado": 1000.00,
  "plazo_dias": 30,
  "origen": "vendedor",
  "notas": "Aprobado por buen historial"
}
```

**Respuesta:**
```json
{
  "id": "uuid-credito",
  "pedido_id": "uuid-pedido",
  "cliente_id": "uuid-cliente",
  "monto_aprobado": 1000.00,
  "plazo_dias": 30,
  "fecha_aprobacion": "2026-01-25",
  "fecha_vencimiento": "2026-02-24",
  "estado": "activo"
}
```

### Registrar Pago

```bash
POST /api/payments
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "aprobacion_credito_id": "uuid-credito",
  "monto_pago": 500.00,
  "registrado_por_id": "uuid-vendedor",
  "fecha_pago": "2026-01-26",
  "referencia": "RECIBO-001",
  "metodo_registro": "manual"
}
```

**Respuesta:**
```json
{
  "id": "uuid-pago",
  "aprobacion_credito_id": "uuid-credito",
  "monto_pago": 500.00,
  "fecha_pago": "2026-01-26",
  "referencia": "RECIBO-001"
}
```

### Consultar Saldo

```bash
GET /api/payments/credit/{uuid-credito}/balance
Authorization: Bearer <jwt-token>
```

**Respuesta:**
```json
{
  "total_pagado": 500.00,
  "saldo": 500.00
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
credit-service
    ↓ (Service Token)
├─ order-service (Pedidos)
└─ user-service (Clientes, Vendedores)
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
docker build -t credit-service .

# Run
docker run -p 3000:3000 --env-file .env credit-service
```

---

## 💡 Características Clave

- ✅ Aprobación de créditos con validación de pedido único
- ✅ Registro transaccional de pagos
- ✅ Cálculo automático de saldos y vencimientos
- ✅ Actualización automática de estado (pagado/vencido)
- ✅ Reportes de cartera en tiempo real
- ✅ Auditoría completa de cambios
- ✅ Patrón Outbox para eventos

---

## 📚 Documentación Adicional

- [Database Schema](../../infra/local-init/06-init-cafrilosa_creditos.sql)

---

## 🤝 Contribuir

1. Seguir los patrones establecidos
2. Mantener cobertura de tests
3. Documentar cambios importantes
4. Usar commits descriptivos

---

## 📄 Licencia

UNLICENSED - Uso privado
