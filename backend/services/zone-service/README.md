# Zone Service

Servicio encargado de la gestión de zonas geográficas, polígonos de cobertura y horarios de atención.

## Endpoints

### Zones Controller (`/api/zonas`)

Gestión principal de zonas.

| Método | Ruta | Roles Permitidos | Payload (Body) | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | `admin`, `supervisor` | `{ "codigo": "Z-01", "nombre": "Norte", "zonaGeom": { ...GeoJSON... } }` | Crear una nueva zona. |
| `GET` | `/` | *Autenticado* | N/A | Listar zonas (filtros: `estado`, `activo`). |
| `GET` | `/disponibles-entregas` | *Autenticado* | N/A | Zonas disponibles para entrega en un día (`dia_semana`). |
| `GET` | `/disponibles-visitas` | *Autenticado* | N/A | Zonas disponibles para visita en un día (`dia_semana`). |
| `POST` | `/resolver` | *Autenticado* | `{ "lat": -12.04, "lon": -77.03 }` | Identificar zona dado un punto (`lat`, `lon`). |
| `GET` | `/:id` | *Autenticado* | N/A | Obtener detalle de una zona. |
| `PATCH` | `/:id` | `admin`, `supervisor` | `{ "nombre": "Nuevo Nombre" }` | Actualizar zona (parcial). |
| `PUT` | `/:id` | `admin`, `supervisor` | `{ "codigo": "...", "nombre": "..." }` | Actualizar zona (completo). |
| `PUT` | `/:id/desactivar` | `admin`, `supervisor` | N/A | Desactivar una zona. |
| `GET` | `/:id/horarios` | *Autenticado* | N/A | Obtener horarios de una zona. |
| `PUT` | `/:id/horarios` | `admin`, `supervisor` | `[ { "dia_semana": 1, "tipo": "visita", "hora_inicio": "08:00" } ]` | Reemplazar horarios de una zona. |
| `PUT` | `/:id/horarios/:dia` | `admin`, `supervisor` | `{ "dia_semana": 1, "tipo": "visita", "hora_inicio": "08:00" }` | Actualizar horario en un día específico. |
| `GET` | `/:id/disponibilidad-entrega`| *Autenticado* | N/A | Verificar disponibilidad de entrega en fecha. |
| `GET` | `/:id/disponibilidad-visita` | *Autenticado* | N/A | Verificar disponibilidad de visita en fecha. |
| `PUT` | `/:id/geometria` | `admin`, `supervisor` | `{ "geometry": { "type": "Polygon", "coordinates": [...] } }` | Actualizar polígono (geometría) de la zona. |

### Coverage Controller (`/api/coverage`)

Utilidades de cobertura geoespacial.

| Método | Ruta | Roles Permitidos | Payload (Body) | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/check-point` | *Autenticado* | `{ "lat": -12.04, "lon": -77.03 }` | Verificar si un punto (`lat`, `lon`) está cubierto por alguna zona. |

### Schedules Controller (`/api/schedules`)

Gestión general de horarios.

| Método | Ruta | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | *Autenticado* | Listar todos los horarios globales. |

### Internal Controller (`/api/v1/internal/zones`)

Endpoints para comunicación entre servicios (Service-to-Service). Requiere `x-service-token`.

| Método | Ruta | Seguridad | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/:id` | `ServiceTokenGuard` | Obtener zona por ID (uso interno). |

### Health Controller (`/api/health`)

| Método | Ruta | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | *Público* | Health Check (BD status). |
