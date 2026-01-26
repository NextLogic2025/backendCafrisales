# Route Service

Microservicio de gestión de rutas comerciales, logísticas y flota de vehículos.

## 🚀 Inicio Rápido

### Requisitos
- Node.js 24+
- PostgreSQL 17+
- Docker (opcional)

### Instalación

```bash
npm install
```

### Ejecutar

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## 📦 Módulos

### 1. Fleet Module (Vehículos)
Gestión del parque automotor.

**Endpoints:**
- `POST /api/fleet` - Crear vehículo
- `GET /api/fleet` - Listar flota disponible
- `PATCH /api/fleet/:id/status` - Actualizar estado (disponible/mantenimiento)

### 2. Commercial Module (Rutas de Venta)
Planificación de visitas de vendedores.

**Endpoints:**
- `POST /api/commercial-routes` - Crear rutero diario (borrador)
- `POST /api/commercial-routes/:id/visits` - Agregar visitas
- `PATCH /api/commercial-routes/:id/publish` - Publicar rutero
- `GET /api/commercial-routes/my-routes` - Mis rutas (Vendedor)

### 3. Logistics Module (Rutas de Entrega)
Planificación de despachos con vehículos.

**Endpoints:**
- `POST /api/logistic-routes` - Crear rutero logístico
- `POST /api/logistic-routes/:id/orders` - Asignar pedidos al camión
- `PATCH /api/logistic-routes/:id/publish` - Publicar para despacho

### 4. History Module
Auditoría unificada de cambios de estado en ruteros (comerciales y logísticos).

---

## 🔐 Seguridad
Los endpoints están protegidos por roles:
- **Admin/Supervisor:** Gestión total.
- **Vendedor:** Puede ver y ejecutar sus propias rutas.
- **Transportista:** (Futuro) Podrá ver sus rutas logísticas.

## 🔌 Conexiones
Se conecta con:
- **User Service:** Para validar vendedores y obtener direcciones.
- **Order Service:** Para obtener detalle de pedidos a despachar.
- **Zone Service:** Para validar zonas de cobertura.
