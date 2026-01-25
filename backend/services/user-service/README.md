# User-Service: Crear usuarios (Postman / curl)

Este documento explica cómo crear los distintos tipos de usuario (`cliente`, `vendedor`, `supervisor`, `bodeguero`) usando Postman o curl contra el servicio `user-service` en desarrollo.

Base URL (desarrollo):

- http://localhost:3002/v1

Endpoint principal:

- POST /usuarios  — crea `app.usuarios`, `app.perfiles_usuario`, y filas específicas por `rol`.

Headers (requeridos):

- `Content-Type: application/json`

Nota importante:

- Para crear un `cliente` necesitas que exista un `canal` en `app.canales_comerciales` (campo `canal_id`). Puedes crear un canal en la DB local con psql (ejemplo abajo).

Ejemplo: crear un `cliente` (Postman body JSON)

{
  "email": "cliente.example@example.com",
  "rol": "cliente",
  "perfil": {
    "nombres": "Juan",
    "apellidos": "Pérez",
    "telefono": "+51 912345678"
  },
  "cliente": {
    "canal_id": "00000000-0000-0000-0000-000000000001",
    "nombre_comercial": "Tienda Demo S.A.",
    "ruc": "20123456789",
    "zona_id": "00000000-0000-0000-0000-000000000002",
    "direccion": "Av. Test 123",
    "latitud": -12.0464,
    "longitud": -77.0428,
    "condiciones": {
      "permite_negociacion": true,
      "porcentaje_descuento_max": 5.5,
      "requiere_aprobacion_supervisor": false,
      "observaciones": "Cliente demo"
    }
  }
}

Ejemplo: crear un `vendedor`

{
  "email": "vendedor.example@example.com",
  "rol": "vendedor",
  "perfil": { "nombres": "Carlos", "apellidos": "Gomez" },
  "vendedor": { "codigo_empleado": "VEND-001", "supervisor_id": null }
}

Ejemplo: crear un `supervisor`

{
  "email": "supervisor.example@example.com",
  "rol": "supervisor",
  "perfil": { "nombres": "Lucia", "apellidos": "Martinez" },
  "supervisor": { "codigo_empleado": "SUP-001" }
}

Ejemplo: crear un `bodeguero`

{
  "email": "bodeguero.example@example.com",
  "rol": "bodeguero",
  "perfil": { "nombres": "Miguel", "apellidos": "Torres" },
  "bodeguero": { "codigo_empleado": "BOD-001" }
}

Uso con curl (cliente ejemplo):

```bash
curl -v -X POST http://localhost:3002/v1/usuarios \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente.example@example.com","rol":"cliente","perfil":{"nombres":"Juan","apellidos":"Pérez"},"cliente":{"canal_id":"00000000-0000-0000-0000-000000000001","nombre_comercial":"Tienda","zona_id":"00000000-0000-0000-0000-000000000002","direccion":"Av. Test 123"}}'
```

Crear canal requerido (si no existe) via psql (desde host):

```bash
docker exec -i gcp-sql-local psql -U admin -d cafrilosa_usuarios -c \
  "INSERT INTO app.canales_comerciales (id, codigo, nombre, descripcion, activo, creado_en) \
   VALUES ('00000000-0000-0000-0000-000000000001','CANAL-DEMO','Canal Demo','Canal para pruebas',true,transaction_timestamp()) \
   ON CONFLICT (id) DO NOTHING;"
```

Comprobaciones rápidas (psql):

- Usuarios: SELECT id,email,rol FROM app.usuarios WHERE email='...';
- Perfiles: SELECT * FROM app.perfiles_usuario WHERE usuario_id='<id>';
- Clientes: SELECT * FROM app.clientes WHERE usuario_id='<id>';
- Condiciones: SELECT * FROM app.condiciones_comerciales_cliente WHERE cliente_id='<id>';
- Vendedores: SELECT * FROM app.vendedores WHERE usuario_id='<id>';
- Supervisores: SELECT * FROM app.supervisores WHERE usuario_id='<id>';
- Bodegueros: SELECT * FROM app.bodegueros WHERE usuario_id='<id>';
- Outbox (evento UsuarioCreado): SELECT * FROM app.outbox_eventos WHERE clave_agregado='<id>';

Notas finales:

- Si quieres que `auth-service` cree credenciales automáticamente cuando se crea un usuario, implementamos un consumidor que procese `app.outbox_eventos` y llame a `auth-service` o inserte en `app.credenciales`.
- Para Postman: crea una colección y añade una request `POST /v1/usuarios` por cada rol con los bodies de ejemplo.

Archivo de servicio: [services/user-service](services/user-service)
