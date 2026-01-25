# User-Service: Crear usuarios (Postman / curl)

Este documento explica cómo probar `user-service` en desarrollo. IMPORTANTE: la creación pública directa de usuarios (`POST /v1/usuarios`) ha sido deshabilitada y la creación centralizada se hace desde `auth-service` via outbox -> `/v1/internal/usuarios/sync`.

Base URL (desarrollo):

- http://localhost:3002/v1

Endpoints relevantes para pruebas:

- `POST /v1/internal/usuarios/sync` — endpoint interno idempotente que crea el `usuario` completo a partir del payload enviado por `auth-service`. Requiere header `x-service-token: <SERVICE_TOKEN>`.
- `GET /v1/usuarios/:id` — consultar usuario creado (protegido por JWT/Roles).
- `PATCH /v1/usuarios/:id` — actualizar (protegido).

Probar la sync interna con Postman (caso debugging)

- Crear una Request `POST {{baseUrlUser}}/v1/internal/usuarios/sync` (donde `{{baseUrlUser}}` = `http://localhost:3002`).
- En `Headers` añadir `Content-Type: application/json` y `x-service-token: {{SERVICE_TOKEN}}`.
- En `Body` -> `raw` -> `JSON` usar un payload idéntico al que `auth-service` publica en su outbox. Ejemplo:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "email": "cliente.ejemplo@example.com",
  "rol": "cliente",
  "perfil": { "nombres": "Juan", "apellidos": "Pérez", "telefono": "+59170000000" },
  "cliente": {
    "canal_id": "00000000-0000-0000-0000-000000000001",
    "nombre_comercial": "Distribuciones XYZ",
    "ruc": "123456789",
    "zona_id": "00000000-0000-0000-0000-000000000002",
    "direccion": "Av. Principal 123",
    "latitud": -17.7833,
    "longitud": -63.1821,
    "condiciones": {
      "permite_negociacion": true,
      "porcentaje_descuento_max": 5.5,
      "requiere_aprobacion_supervisor": false,
      "observaciones": "Cliente demo"
    }
  }
}
```

Curl directo (debugging):

```bash
curl -v -X POST http://localhost:3002/v1/internal/usuarios/sync \
  -H "Content-Type: application/json" \
  -H "x-service-token: <SERVICE_TOKEN>" \
  -d '@payload.json'
```

Notas y comprobaciones rápidas (psql):

- Crear canal necesario (si no existe):

```bash
docker exec -i gcp-sql-local psql -U admin -d cafrilosa_usuarios -c \
  "INSERT INTO app.canales_comerciales (id, codigo, nombre, descripcion, activo, creado_en) \
   VALUES ('00000000-0000-0000-0000-000000000001','CANAL-DEMO','Canal Demo','Canal para pruebas',true,transaction_timestamp()) \
   ON CONFLICT (id) DO NOTHING;"
```

- Comprobaciones (psql):
  - Usuarios: SELECT id,email,rol FROM app.usuarios WHERE email='...';
  - Perfiles: SELECT * FROM app.perfiles_usuario WHERE usuario_id='<id>';
  - Clientes: SELECT * FROM app.clientes WHERE usuario_id='<id>';
  - Condiciones: SELECT * FROM app.condiciones_comerciales_cliente WHERE cliente_id='<id>';

Notas finales:

- No uses `POST /v1/usuarios` públicamente en desarrollo — la creación centralizada se hace desde `auth-service`.
- Para pruebas end-to-end: usa `auth-service` `POST /v1/auth/register` con el payload completo; el `OutboxProcessor` empujará el evento a este endpoint interno.

Archivo de servicio: [services/user-service](services/user-service)
