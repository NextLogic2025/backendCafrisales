# Auth-Service: Uso y pruebas (Postman / curl)

Este README muestra cómo probar las rutas de autenticación locales y cómo verificar las tablas `app.credenciales` y `app.sesiones` en la base de datos de desarrollo.

Base URL (desarrollo):

- http://localhost:3001/v1

Endpoints principales:

- `POST /auth/register` — registra credenciales (email + password).
- `POST /auth/login` — login con `email` y `password` (passport-local), devuelve `accessToken` y `refreshToken`.
- `POST /auth/refresh` — rota refresh token y devuelve nuevo `accessToken` (+ nuevo refresh token si aplica).
- `POST /auth/logout` — revoca sesión / refresh token.

Headers:

- `Content-Type: application/json`
- `Authorization: Bearer <accessToken>` para endpoints protegidos.

Ejemplo: Registrar un usuario (curl)

```bash
curl -v -X POST http://localhost:3001/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user.example@example.com","password":"P4ssw0rd!"}'
```

Ejemplo: Login (curl)

```bash
curl -v -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user.example@example.com","password":"P4ssw0rd!"}'
```

Respuesta esperada (login):

{
  "accessToken": "eyJ...",
  "refreshToken": "<texto-del-refresh-no-guardado-en-claro-en-DB>"
}

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
