# User-Service: Gestión de Usuarios Clientes y Staff

Este servicio es responsable de la gestión de información de usuarios, perfiles, clientes, y staff.

## Base URL (Desarrollo)
- `http://localhost:3002/v1`

## Autenticación
La mayoría de los endpoints requieren un token JWT válido en el header `Authorization: Bearer <token>`.
Los endpoints internos requieren el header `x-service-token`.

---

## 1. Gestión de Perfil Personal (`/usuarios/me`)

Controlador: `ProfilesController`
Endpoints para que el usuario autenticado gestione su propia información.

- **GET /usuarios/me/perfil**
  - **Roles:** Todos (cualquier usuario autenticado)
  - **Descripción:** Obtiene los datos del perfil propio (nombres, teléfono, avatar) y su zona asignada.

- **PUT /usuarios/me/perfil**
  - **Roles:** Todos
  - **Descripción:** Actualiza o crea el perfil propio.
  - **Body:** `{ nombres, apellidos, telefono, url_avatar, preferencias }`

---

## 2. Gestión de Usuarios y Staff (`/usuarios`)

Controlador: `UsersController`
Estos endpoints permiten la creación de usuarios administrativos y staff por parte de administradores.

- **POST /usuarios/vendedor**
  - **Roles:** Admin, Staff, Supervisor
  - **Descripción:** Crea un nuevo usuario con rol `vendedor`.
  - **Body:** `CreateStaffUserDto` (nombres, apellidos, email, password, codigo_empleado, supervisor_id).

- **POST /usuarios/bodeguero**
  - **Roles:** Admin, Staff, Supervisor
  - **Descripción:** Crea un nuevo usuario con rol `bodeguero`.
  - **Body:** `CreateStaffUserDto` (nombres, apellidos, email, password, codigo_empleado).

- **POST /usuarios/transportista**
  - **Roles:** Admin, Staff, Supervisor
  - **Descripción:** Crea un nuevo usuario con rol `transportista`.
  - **Body:** `CreateStaffUserDto` (incluye `numero_licencia`).

- **POST /usuarios/supervisor**
  - **Roles:** Admin, Staff
  - **Descripción:** Crea un nuevo usuario con rol `supervisor`.

- **GET /usuarios/:id**
  - **Roles:** Todos (Admin, Staff, Supervisor, Vendedor, Bodeguero, Transportista, Cliente)
  - **Descripción:** Obtiene la información detallada de un usuario por su ID.

- **PATCH /usuarios/:id**
  - **Roles:** Admin, Staff, Supervisor
  - **Descripción:** Actualiza información básica de un usuario.

- **PUT /usuarios/:id/suspender**
  - **Roles:** Admin, Staff, Supervisor
  - **Descripción:** Suspende o bloquea a un usuario.
  - **Body:** `{ "motivo": "string" }`

---

## 3. Gestión de Clientes (`/clientes`)

Controlador: `ClientsController`
Gestiona la información específica de usuarios con rol `cliente`.

- **GET /clientes**
  - **Roles:** Admin, Staff, Supervisor
  - **Query Params:** `estado` (activo, inactivo, todos).
  - **Descripción:** Lista todos los clientes, permitiendo filtrar por estado.

- **POST /clientes**
  - **Roles:** Admin, Staff
  - **Descripción:** Crea un cliente manualmente (uso administrativo). Normalmente los clientes se crean via registro público o sync.

- **GET /clientes/:usuarioId**
  - **Roles:** Supervisor, Vendedor, Bodeguero, Admin, Staff
  - **Descripción:** Obtiene perfil completo del cliente incluyendo datos comerciales y de canal.

- **PATCH /clientes/:usuarioId**
  - **Roles:** Admin, Staff, Supervisor
  - **Descripción:** Actualiza datos del cliente (dirección, ruc, etc).

- **PUT /clientes/:usuarioId/condiciones-comerciales**
  - **Roles:** Admin, Staff, Supervisor
  - **Descripción:** Crea o actualiza las condiciones comerciales (descuentos, plazos). Emite evento `CondicionesActualizadas`.

- **PUT /clientes/:usuarioId/asignar-vendedor**
  - **Roles:** Admin, Staff, Supervisor
  - **Descripción:** Asigna un vendedor a un cliente. Emite evento `VendedorAsignado`.

- **GET /clientes/:usuarioId/condiciones**
  - **Roles:** Admin, Staff, Supervisor, Vendedor
  - **Descripción:** Consulta las condiciones comerciales vigentes de un cliente.

---

## 4. Canales Comerciales (`/canales`)

Controlador: `ChannelsController`
Gestiona los canales de venta (ej. Mayorista, Minorista, Horeca).

- **GET /canales**
  - **Publico** (o restringido según interceptor global).
  - **Descripción:** Lista todos los canales disponibles.

- **GET /canales/:id**
  - **Descripción:** Detalle de un canal.

- **POST /canales**
  - **Roles:** Admin, Staff, Supervisor
  - **Descripción:** Crea nuevo canal comercial.

- **PATCH /canales/:id**
  - **Roles:** Admin, Staff, Supervisor
  - **Descripción:** Actualiza un canal.

- **DELETE /canales/:id**
  - **Roles:** Admin, Staff, Supervisor
  - **Descripción:** Elimina (soft delete o hard delete) un canal.

---

## 5. Staff (`/staff`)

Controlador: `StaffController`
Endpoints de consulta rápida para listas de empleados.

- **GET /staff/vendedores**
  - **Roles:** Admin, Staff, Supervisor
  - **Descripción:** Lista todos los vendedores activos.

- **GET /staff/supervisores**
  - **Roles:** Admin, Staff, Supervisor
  - **Descripción:** Lista todos los supervisores.

- **GET /staff/bodegueros**
  - **Roles:** Admin, Staff, Supervisor
  - **Descripción:** Lista bodegueros.

- **GET /staff/transportistas**
  - **Roles:** Admin, Staff, Supervisor
  - **Descripción:** Lista transportistas.

---

## 6. Endpoints Internos (`/internal/usuarios`)

Uso exclusivo para comunicación entre microservicios (S2S). Requieren header `x-service-token`.

- **POST /internal/usuarios/sync**
  - **Descripción:** Recibe eventos de creación de usuarios desde `auth-service`. Crea el registro local de usuario/perfil/cliente de forma idempotente.
  - **Body:** Payload completo del usuario.

- **GET /internal/usuarios/:id**
  - **Descripción:** Consulta raw de usuario por ID para otros servicios.
