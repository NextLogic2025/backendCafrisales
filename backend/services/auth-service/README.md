# Auth-Service: Uso y pruebas (Postman / curl)

Este README muestra cómo probar las rutas de autenticación locales y cómo verificar las tablas `app.credenciales` y `app.sesiones` en la base de datos de desarrollo.

Base URL (desarrollo):

- http://localhost:3001/v1

Endpoints principales:

- `POST /v1/auth/register` — registra credenciales (email + password). Acepta opcionalmente `creado_por` (UUID).
- `POST /v1/auth/login` — login con `email` y `password` (passport-local), devuelve `access_token` y `refresh_token`.
- `POST /v1/auth/refresh` — rota refresh token y devuelve nuevo `access_token` (+ nuevo refresh token si aplica).
- `POST /v1/auth/logout` — revoca sesión / refresh token.

Headers:

- `Content-Type: application/json`
- `Authorization: Bearer <accessToken>` para endpoints protegidos.

Ejemplo: Registrar un usuario (curl)

```bash
curl -v -X POST http://localhost:3001/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user.example@example.com","password":"P4ssw0rd!"}'
```

Probar en Postman (registro completo -> crea usuario en `user-service` via outbox)

- Crear una nueva Request `POST {{baseUrl}}/v1/auth/register` (donde `{{baseUrl}}` = `http://localhost:3001`)
- En `Headers` añadir `Content-Type: application/json`.
- En `Body` seleccionar `raw` -> `JSON` y usar un payload como este (ejemplo para crear un `cliente`):

```json
{
  "email": "cliente.ejemplo@example.com",
  "password": "P4ssw0rd!",
  "perfil": { "nombres": "Juan", "apellidos": "Pérez", "telefono": "+59170000000" },
  "rol": "cliente",
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

Notas rápidas:
- Al enviar este `register`, `auth-service` crea las credenciales en `cafrilosa_auth.app.credenciales` y escribe un evento en su `app.outbox_eventos` con el payload JSON anterior.
- El `OutboxProcessor` del `auth-service` intentará POSTear ese payload a `user-service` en `/v1/internal/usuarios/sync` (secuestro S2S protegido por `x-service-token`).
- Para debugging manual, puedes copiar el mismo JSON y llamar directamente a `user-service` (solo para pruebas) con:

```bash
curl -v -X POST http://localhost:3002/v1/internal/usuarios/sync \
  -H "Content-Type: application/json" \
  -H "x-service-token: <SERVICE_TOKEN>" \
  -d '@payload.json'
```

Postman tip: añade una variable de entorno `SERVICE_TOKEN` y otra `baseUrlAuth` (`http://localhost:3001`) para reusar en la colección.

Payloads de ejemplo incluidos en el repositorio:

- `payloads/payload-cliente.json`
- `payloads/payload-vendedor.json`
- `payloads/payload-supervisor.json`
- `payloads/payload-bodeguero.json`
- `payloads/payload-transportista.json`
- `payloads/payload-admin.json`

Puedes cargar cualquiera de estos archivos en Postman (Body -> raw -> seleccionar archivo) o usar `-d @path` con `curl`.

Ejemplo: Login (curl)

```bash
curl -v -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user.example@example.com","password":"P4ssw0rd!"}'
```

Respuesta esperada (login):

```json
{
  "access_token": "eyJ...",
  "refresh_token": "<refresh-token-en-claro-que-usa-el-cliente>",
  "expires_in": 900,
  "usuario_id": "<uuid>",
  "rol": "cliente"
}
```

Notas sobre persistencia en la DB:

- `app.credenciales`: el registro de credenciales se guarda aquí (email, password_hash, estado, etc.).
- `app.sesiones`: al hacer login se guarda una fila con `refresh_hash` (hash del refresh token), `expira_en`, `direccion_ip`, `user_agent` y `dispositivo_meta`.

Verificar en la base de datos (psql desde host):

```bash
# listar credenciales
docker exec -i gcp-sql-local psql -U admin -d cafrilosa_auth -c "SELECT usuario_id, email, estado, creado_en FROM app.credenciales WHERE email='user.example@example.com';"

# listar sesiones
docker exec -i gcp-sql-local psql -U admin -d cafrilosa_auth -c "SELECT id, usuario_id, expira_en, revocado_en, creado_en FROM app.sesiones WHERE usuario_id='<usuario_id_guid>' ORDER BY creado_en DESC;"
```

Integración con `user-service` (recomendado):

- Cuando se crea un `usuario` desde `user-service`, se publica un evento `UsuarioCreado` en `app.outbox_eventos` (user-service). 
- Opciones para sincronizar credenciales:
  - Async (recomendado): `auth-service` consume `app.outbox_eventos` y crea `app.credenciales` (sin bloquear la creación del usuario).
  - Sync: `user-service` realiza una llamada RPC/HTTP a `auth-service` pidiendo crear credenciales (si necesitas credenciales inmediatamente).

Ejemplo de consumo outbox (manual):

```bash
# leer outbox pendiente desde DB (user-service DB)
docker exec -i gcp-sql-local psql -U admin -d cafrilosa_usuarios -c "SELECT id, agregado, tipo_evento, clave_agregado, payload FROM app.outbox_eventos WHERE procesado_en IS NULL ORDER BY creado_en LIMIT 10;"
```

Consideraciones de seguridad:

- Asegúrate de que `JWT_SECRET` coincida en las variables de entorno durante desarrollo entre servicios si usas JWT simétrico.
- No almacenes `refreshToken` en texto plano en la DB — `auth-service` debe guardar solo su hash (ej. Argon2).

Problemas comunes:

- Si `auth-service` lanza errores de relación `sessions` o `credenciales`, asegúrate de que los scripts en `infra/local-init` se hayan aplicado correctamente y que estés apuntando a la base de datos `cafrilosa_auth` (ver `DATABASE_URL`).

Archivo de servicio: [services/auth-service](services/auth-service)
