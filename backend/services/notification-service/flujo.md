# Flujos NOTIFICATION-SERVICE

Basado **exclusivamente** en las tablas de `cafrilosa_notificaciones`:
- `app.tipos_notificacion`
- `app.notificaciones`
- `app.preferencias_notificacion`
- `app.suscripciones_notificacion`
- `app.historial_envios`
- `app.outbox_eventos`

---

## 1. Crear Tipo de Notificación

### Diagrama de Secuencia
```
Admin            Notification-Service  DB-Notificaciones
    |                 |                      |
    |-- POST /tipos-notificacion            |
    |   {codigo, nombre, descripcion}       |
    |                 |                      |
    |          [1] SELECT COUNT(*) tipos_notificacion
    |                 |  WHERE codigo = ?    |
    |                 |                      |
    |          [2] INSERT app.tipos_notificacion
    |                 |  (id, codigo, nombre, descripcion,
    |                 |   activo=true, creado_en, creado_por)
    |                 |                      |
    |<-- 201 Created  |                      |
    |  {tipo_id, codigo, nombre}             |
```

**Tablas involucradas:**
```sql
-- [1] Verificar unicidad
app.tipos_notificacion: codigo (UNIQUE)

-- [2] Insertar tipo
app.tipos_notificacion: id, codigo, nombre, descripcion, activo,
                        creado_en, creado_por
```

---

## 2. Crear Notificación (consumiendo evento de otro servicio)

### Diagrama de Secuencia
```
Event-Bus        Notification-Service  DB-Notificaciones
    |                 |                      |
    |-- Evento: PedidoCreado                |
    |   {pedido_id, cliente_id, numero, total}
    |                 |                      |
    |          [1] SELECT * FROM tipos_notificacion
    |                 |  WHERE codigo = 'pedido_creado'
    |                 |  AND activo = true   |
    |                 |                      |
    |          [2] SELECT * FROM preferencias_notificacion
    |                 |  WHERE usuario_id = cliente_id
    |                 |                      |
    |          [3] SELECT * FROM suscripciones_notificacion
    |                 |  WHERE usuario_id = cliente_id
    |                 |  AND tipo_id = tipo_notif_id
    |                 |                      |
    |          [4] Evaluar si enviar (no molestar, suscripción)
    |                 |                      |
    |          [5] BEGIN TRANSACTION        |
    |                 |                      |
    |          [6] INSERT app.notificaciones |
    |                 |  (id, usuario_id, tipo_id, titulo, mensaje,
    |                 |   origen_servicio='order',
    |                 |   origen_evento_id=pedido_id,
    |                 |   payload={numero, total},
    |                 |   prioridad='normal',
    |                 |   requiere_accion=true,
    |                 |   url_accion='/pedidos/{pedido_id}',
    |                 |   leida=false, creado_en, creado_por)
    |                 |  (UNIQUE origen_servicio, origen_evento_id, usuario_id)
    |                 |                      |
    |          [7] INSERT app.outbox_eventos |
    |                 |  (tipo_evento='NotificacionCreada')
    |                 |                      |
    |          [8] COMMIT                   |
    |                 |                      |
    |          [9] Enviar por WebSocket (si enabled)
    |                 |                      |
    |          [10] INSERT historial_envios |
    |                 |  (notificacion_id, canal='websocket',
    |                 |   exitoso=true)      |
    |                 |                      |
    |<-- ACK          |                      |
```

**Tablas involucradas:**
```sql
-- [1] Tipo de notificación
app.tipos_notificacion: id, codigo, activo

-- [2] Preferencias del usuario
app.preferencias_notificacion: usuario_id, websocket_enabled, email_enabled,
                                sms_enabled, no_molestar, no_molestar_desde,
                                no_molestar_hasta

-- [3] Suscripción específica (override)
app.suscripciones_notificacion: usuario_id, tipo_id, websocket_enabled,
                                email_enabled, sms_enabled

-- [6] Insertar notificación
app.notificaciones: id, usuario_id, tipo_id, titulo, mensaje,
                    origen_servicio, origen_evento_id, payload, prioridad,
                    requiere_accion, url_accion, leida, leida_en, expira_en,
                    creado_en, actualizado_en, creado_por, actualizado_por, version
                    (UNIQUE INDEX ux_notif_origen_evento_usuario)

-- [7] Evento outbox
app.outbox_eventos: agregado, tipo_evento, clave_agregado, payload,
                    creado_en, procesado_en, intentos

-- [10] Historial de envío
app.historial_envios: id, notificacion_id, canal, exitoso, error_mensaje,
                      enviado_en
```

---

## 3. Crear Notificación Manual (por Admin/Sistema)

### Diagrama de Secuencia
```
Admin            Notification-Service  DB-Notificaciones
    |                 |                      |
    |-- POST /notificaciones                |
    |   {usuario_id, tipo_codigo, titulo, mensaje,
    |    prioridad, requiere_accion, url_accion}
    |                 |                      |
    |          [1] SELECT * FROM tipos_notificacion
    |                 |  WHERE codigo = tipo_codigo
    |                 |  AND activo = true   |
    |                 |                      |
    |          [2] Validar preferencias usuario
    |                 |                      |
    |          [3] INSERT app.notificaciones |
    |                 |  (origen_servicio='manual',
    |                 |   origen_evento_id=NULL,
    |                 |   creado_por=admin_id)
    |                 |                      |
    |          [4] Enviar por canales habilitados
    |                 |                      |
    |          [5] INSERT historial_envios   |
    |                 |  [por cada canal]    |
    |                 |                      |
    |<-- 201 Created  |                      |
    |  {notificacion_id, titulo}             |
```

**Tablas involucradas:**
```sql
-- [1] Tipo de notificación
app.tipos_notificacion: codigo, activo

-- [3] Notificación manual
app.notificaciones: origen_servicio='manual', origen_evento_id=NULL,
                    creado_por (admin)

-- [5] Historial por canal
app.historial_envios: notificacion_id, canal, exitoso
```

---

## 4. Marcar Notificación como Leída

### Diagrama de Secuencia
```
Usuario          Notification-Service  DB-Notificaciones
    |                 |                      |
    |-- PUT /notificaciones/{id}/leer       |
    |                 |                      |
    |          [1] SELECT * FROM notificaciones
    |                 |  WHERE id = notificacion_id
    |                 |  AND usuario_id = usuario_id_jwt
    |                 |  AND leida = false   |
    |                 |  FOR UPDATE          |
    |                 |                      |
    |          [2] UPDATE notificaciones    |
    |                 |  SET leida = true,   |
    |                 |      leida_en = transaction_timestamp(),
    |                 |      actualizado_por = usuario_id
    |                 |  (trigger -> actualizado_en, version++)
    |                 |                      |
    |          [3] INSERT outbox_eventos    |
    |                 |  (tipo_evento='NotificacionLeida')
    |                 |                      |
    |<-- 200 OK       |                      |
```

**Tablas involucradas:**
```sql
-- [1] Validar notificación no leída
app.notificaciones: id, usuario_id, leida=false

-- [2] Marcar como leída
app.notificaciones: leida=true, leida_en, actualizado_en, actualizado_por, version

-- [3] Evento
app.outbox_eventos: tipo_evento='NotificacionLeida'
```

---

## 5. Marcar Todas las Notificaciones como Leídas

### Diagrama de Secuencia
```
Usuario          Notification-Service  DB-Notificaciones
    |                 |                      |
    |-- PUT /notificaciones/marcar-todas-leidas
    |                 |                      |
    |          [1] UPDATE notificaciones    |
    |                 |  SET leida = true,   |
    |                 |      leida_en = transaction_timestamp(),
    |                 |      actualizado_por = usuario_id
    |                 |  WHERE usuario_id = ?|
    |                 |  AND leida = false   |
    |                 |                      |
    |          [2] INSERT outbox_eventos    |
    |                 |  (tipo_evento='TodasNotificacionesLeidas')
    |                 |                      |
    |<-- 200 OK       |                      |
    |  {actualizadas: 15}                    |
```

**Tablas involucradas:**
```sql
-- [1] Marcar todas como leídas
app.notificaciones: usuario_id, leida, leida_en, actualizado_en, actualizado_por

-- [2] Evento
app.outbox_eventos: tipo_evento='TodasNotificacionesLeidas'
```

---

## 6. Listar Notificaciones del Usuario (inbox)

### Diagrama de Secuencia
```
Usuario          Notification-Service  DB-Notificaciones
    |                 |                      |
    |-- GET /notificaciones?leida=false&limit=50
    |                 |                      |
    |          [1] SELECT n.*, t.nombre as tipo_nombre
    |                 |  FROM notificaciones n
    |                 |  JOIN tipos_notificacion t ON t.id = n.tipo_id
    |                 |  WHERE n.usuario_id = ?
    |                 |  AND (? IS NULL OR n.leida = ?)
    |                 |  AND (n.expira_en IS NULL OR n.expira_en > now())
    |                 |  ORDER BY n.creado_en DESC
    |                 |  LIMIT ?
    |                 |  (INDEX idx_notif_usuario_no_leidas)
    |                 |                      |
    |<-- 200 OK       |                      |
    |  [{notificacion_id, titulo, mensaje, prioridad,
    |    tipo_nombre, requiere_accion, url_accion,
    |    leida, creado_en}, ...]
```

**Tablas involucradas:**
```sql
-- [1] Notificaciones del usuario
app.notificaciones: usuario_id, leida, expira_en, creado_en, titulo, mensaje,
                    prioridad, requiere_accion, url_accion, tipo_id
                    (INDEX idx_notif_usuario_no_leidas)
app.tipos_notificacion: id, nombre
```

---

## 7. Contar Notificaciones No Leídas

### Diagrama de Secuencia
```
Usuario          Notification-Service  DB-Notificaciones
    |                 |                      |
    |-- GET /notificaciones/count-no-leidas |
    |                 |                      |
    |          [1] SELECT COUNT(*) FROM notificaciones
    |                 |  WHERE usuario_id = ?|
    |                 |  AND leida = false   |
    |                 |  AND (expira_en IS NULL OR expira_en > now())
    |                 |  (INDEX idx_notif_usuario_no_leidas)
    |                 |                      |
    |<-- 200 OK       |                      |
    |  {count: 8}     |                      |
```

**Tablas involucradas:**
```sql
-- [1] Contar no leídas
app.notificaciones: usuario_id, leida, expira_en
                    (INDEX idx_notif_usuario_no_leidas)
```

---

## 8. Actualizar Preferencias de Notificación

### Diagrama de Secuencia
```
Usuario          Notification-Service  DB-Notificaciones
    |                 |                      |
    |-- PUT /preferencias-notificacion      |
    |   {websocket_enabled, email_enabled,  |
    |    sms_enabled, no_molestar,          |
    |    no_molestar_desde, no_molestar_hasta}
    |                 |                      |
    |          [1] INSERT INTO preferencias_notificacion
    |                 |  (usuario_id, websocket_enabled,
    |                 |   email_enabled, sms_enabled,
    |                 |   no_molestar, no_molestar_desde,
    |                 |   no_molestar_hasta, creado_por)
    |                 |  ON CONFLICT (usuario_id)
    |                 |  DO UPDATE SET
    |                 |    websocket_enabled = EXCLUDED.websocket_enabled,
    |                 |    email_enabled = EXCLUDED.email_enabled,
    |                 |    sms_enabled = EXCLUDED.sms_enabled,
    |                 |    no_molestar = EXCLUDED.no_molestar,
    |                 |    no_molestar_desde = EXCLUDED.no_molestar_desde,
    |                 |    no_molestar_hasta = EXCLUDED.no_molestar_hasta,
    |                 |    actualizado_por = usuario_id
    |                 |  (trigger -> actualizado_en, version++)
    |                 |                      |
    |<-- 200 OK       |                      |
```

**Tablas involucradas:**
```sql
-- [1] Upsert preferencias
app.preferencias_notificacion: usuario_id (PK), websocket_enabled,
                                email_enabled, sms_enabled, no_molestar,
                                no_molestar_desde, no_molestar_hasta,
                                creado_en, actualizado_en, creado_por,
                                actualizado_por, version
```

---

## 9. Suscribirse/Desuscribirse a Tipo de Notificación

### Diagrama de Secuencia
```
Usuario          Notification-Service  DB-Notificaciones
    |                 |                      |
    |-- PUT /suscripciones-notificacion     |
    |   {tipo_codigo='pedido_creado',       |
    |    websocket_enabled=true,            |
    |    email_enabled=false,               |
    |    sms_enabled=false}                 |
    |                 |                      |
    |          [1] SELECT * FROM tipos_notificacion
    |                 |  WHERE codigo = tipo_codigo
    |                 |  AND activo = true   |
    |                 |                      |
    |          [2] INSERT INTO suscripciones_notificacion
    |                 |  (usuario_id, tipo_id,
    |                 |   websocket_enabled, email_enabled,
    |                 |   sms_enabled)       |
    |                 |  ON CONFLICT (usuario_id, tipo_id)
    |                 |  DO UPDATE SET
    |                 |    websocket_enabled = EXCLUDED.websocket_enabled,
    |                 |    email_enabled = EXCLUDED.email_enabled,
    |                 |    sms_enabled = EXCLUDED.sms_enabled
    |                 |  (trigger -> actualizado_en, version++)
    |                 |                      |
    |<-- 200 OK       |                      |
```

**Tablas involucradas:**
```sql
-- [1] Validar tipo existe
app.tipos_notificacion: codigo, activo

-- [2] Upsert suscripción
app.suscripciones_notificacion: usuario_id, tipo_id (PK), websocket_enabled,
                                email_enabled, sms_enabled, creado_en,
                                actualizado_en, version
```

---

## 10. Consultar Suscripciones del Usuario

### Diagrama de Secuencia
```
Usuario          Notification-Service  DB-Notificaciones
    |                 |                      |
    |-- GET /suscripciones-notificacion     |
    |                 |                      |
    |          [1] SELECT s.*, t.codigo, t.nombre
    |                 |  FROM suscripciones_notificacion s
    |                 |  JOIN tipos_notificacion t ON t.id = s.tipo_id
    |                 |  WHERE s.usuario_id = ?
    |                 |  ORDER BY t.nombre   |
    |                 |                      |
    |<-- 200 OK       |                      |
    |  [{tipo_id, tipo_codigo, tipo_nombre,
    |    websocket_enabled, email_enabled, sms_enabled}, ...]
```

**Tablas involucradas:**
```sql
-- [1] Suscripciones con tipos
app.suscripciones_notificacion: usuario_id, tipo_id, websocket_enabled,
                                email_enabled, sms_enabled
app.tipos_notificacion: id, codigo, nombre
```

---

## 11. Enviar Notificación por Email (proceso asíncrono)

### Diagrama de Secuencia
```
Email-Worker     Notification-Service  DB-Notificaciones  Email-Provider
    |                 |                      |                  |
    |-- GET /notificaciones/pendientes-email               |
    |                 |                      |                  |
    |          [1] SELECT n.*, pn.email_enabled            |
    |                 |  FROM notificaciones n             |
    |                 |  JOIN preferencias_notificacion pn |
    |                 |    ON pn.usuario_id = n.usuario_id |
    |                 |  WHERE pn.email_enabled = true     |
    |                 |  AND NOT EXISTS (                  |
    |                 |    SELECT 1 FROM historial_envios he
    |                 |    WHERE he.notificacion_id = n.id |
    |                 |    AND he.canal = 'email'          |
    |                 |    AND he.exitoso = true           |
    |                 |  )                                 |
    |                 |  AND n.creado_en > now() - interval '1 hour'
    |                 |  LIMIT 100           |                  |
    |                 |                      |                  |
    |          [2] Por cada notificación:    |                  |
    |                 |                      |                  |
    |          [3] Obtener email usuario --> User-Service      |
    |                 |                      |                  |
    |          [4] Enviar email ------------------------->     |
    |                 |                      |                  |
    |          [5] INSERT historial_envios   |                  |
    |                 |  (notificacion_id, canal='email',      |
    |                 |   exitoso=true/false, error_mensaje)   |
    |                 |                      |                  |
    |<-- 200 OK       |                      |                  |
    |  {enviados: 25} |                      |                  |
```

**Tablas involucradas:**
```sql
-- [1] Notificaciones pendientes de email
app.notificaciones: id, usuario_id, titulo, mensaje, creado_en
app.preferencias_notificacion: usuario_id, email_enabled
app.historial_envios: notificacion_id, canal, exitoso

-- [5] Registrar envío
app.historial_envios: notificacion_id, canal='email', exitoso, error_mensaje,
                      enviado_en
```

---

## 12. Enviar Notificación por SMS (proceso asíncrono)

### Diagrama de Secuencia
```
SMS-Worker       Notification-Service  DB-Notificaciones  SMS-Provider
    |                 |                      |                  |
    |-- GET /notificaciones/pendientes-sms                  |
    |                 |                      |                  |
    |          [1] SELECT n.*, pn.sms_enabled              |
    |                 |  FROM notificaciones n             |
    |                 |  JOIN preferencias_notificacion pn |
    |                 |    ON pn.usuario_id = n.usuario_id |
    |                 |  WHERE pn.sms_enabled = true       |
    |                 |  AND n.prioridad IN ('alta','urgente')
    |                 |  AND NOT EXISTS (                  |
    |                 |    SELECT 1 FROM historial_envios he
    |                 |    WHERE he.notificacion_id = n.id |
    |                 |    AND he.canal = 'sms'            |
    |                 |    AND he.exitoso = true           |
    |                 |  )                                 |
    |                 |  LIMIT 50            |                  |
    |                 |                      |                  |
    |          [2] Por cada notificación:    |                  |
    |                 |                      |                  |
    |          [3] Obtener teléfono usuario --> User-Service   |
    |                 |                      |                  |
    |          [4] Enviar SMS --------------------------->     |
    |                 |                      |                  |
    |          [5] INSERT historial_envios   |                  |
    |                 |  (canal='sms', exitoso, error_mensaje) |
    |                 |                      |                  |
    |<-- 200 OK       |                      |                  |
    |  {enviados: 5}  |                      |                  |
```

**Tablas involucradas:**
```sql
-- [1] Notificaciones urgentes pendientes de SMS
app.notificaciones: id, usuario_id, titulo, mensaje, prioridad
app.preferencias_notificacion: usuario_id, sms_enabled
app.historial_envios: notificacion_id, canal, exitoso

-- [5] Registrar envío
app.historial_envios: notificacion_id, canal='sms', exitoso, error_mensaje
```

---

## 13. Limpiar Notificaciones Expiradas (proceso cron)

### Diagrama de Secuencia
```
Cron-Scheduler   Notification-Service  DB-Notificaciones
    |                 |                      |
    |-- POST /notificaciones/limpiar-expiradas
    |                 |                      |
    |          [1] SELECT limpiar_notificaciones_expiradas()
    |                 |  (función que ejecuta DELETE)
    |                 |                      |
    |<-- 200 OK       |                      |
    |  {eliminadas: 342}                     |
```

**Tablas involucradas:**
```sql
-- [1] Función de limpieza
-- DELETE FROM app.notificaciones
-- WHERE expira_en IS NOT NULL AND expira_en < transaction_timestamp()

app.notificaciones: expira_en (INDEX idx_notif_expiracion)
```

---

## 14. Consultar Historial de Envíos de Notificación

### Diagrama de Secuencia
```
Admin            Notification-Service  DB-Notificaciones
    |                 |                      |
    |-- GET /notificaciones/{id}/historial-envios
    |                 |                      |
    |          [1] SELECT * FROM historial_envios
    |                 |  WHERE notificacion_id = ?
    |                 |  ORDER BY enviado_en DESC
    |                 |  (INDEX idx_historial_notificacion)
    |                 |                      |
    |<-- 200 OK       |                      |
    |  [{historial_id, canal, exitoso, error_mensaje,
    |    enviado_en}, ...]
```

**Tablas involucradas:**
```sql
-- [1] Historial de envíos
app.historial_envios: id, notificacion_id, canal, exitoso, error_mensaje,
                      enviado_en
                      (INDEX idx_historial_notificacion)
```

---

## 15. Eliminar Notificación

### Diagrama de Secuencia
```
Usuario          Notification-Service  DB-Notificaciones
    |                 |                      |
    |-- DELETE /notificaciones/{id}         |
    |                 |                      |
    |          [1] SELECT * FROM notificaciones
    |                 |  WHERE id = notificacion_id
    |                 |  AND usuario_id = usuario_id_jwt
    |                 |  FOR UPDATE          |
    |                 |                      |
    |          [2] DELETE FROM notificaciones
    |                 |  WHERE id = notificacion_id
    |                 |  (CASCADE elimina historial_envios)
    |                 |                      |
    |<-- 200 OK       |                      |
```

**Tablas involucradas:**
```sql
-- [1] Validar pertenencia
app.notificaciones: id, usuario_id

-- [2] Eliminar (cascade)
app.notificaciones: id
app.historial_envios: notificacion_id (ON DELETE CASCADE)
```

---

## 16. Reenviar Notificación Fallida

### Diagrama de Secuencia
```
Admin            Notification-Service  DB-Notificaciones  Email/SMS-Provider
    |                 |                      |                  |
    |-- POST /notificaciones/{id}/reenviar  |                  |
    |   {canal='email'}                      |                  |
    |                 |                      |                  |
    |          [1] SELECT * FROM notificaciones              |
    |                 |  WHERE id = notificacion_id          |
    |                 |                      |                  |
    |          [2] SELECT * FROM historial_envios            |
    |                 |  WHERE notificacion_id = ?           |
    |                 |  AND canal = 'email' |                  |
    |                 |  AND exitoso = false |                  |
    |                 |                      |                  |
    |          [3] Obtener datos usuario --> User-Service    |
    |                 |                      |                  |
    |          [4] Enviar por canal ------------------------>|
    |                 |                      |                  |
    |          [5] INSERT historial_envios   |                  |
    |                 |  (intento de reenvío)|                  |
    |                 |                      |                  |
    |<-- 200 OK       |                      |                  |
```

**Tablas involucradas:**
```sql
-- [1] Notificación
app.notificaciones: id, usuario_id, titulo, mensaje

-- [2] Intentos previos
app.historial_envios: notificacion_id, canal, exitoso

-- [5] Registrar reintento
app.historial_envios: notificacion_id, canal, exitoso, enviado_en
```

---

**Resumen de tablas NOTIFICATION-SERVICE:**
- ✅ `app.tipos_notificacion` - Catálogo extensible de tipos
- ✅ `app.notificaciones` - Notificaciones con idempotencia por evento
- ✅ `app.preferencias_notificacion` - Defaults por usuario + no molestar
- ✅ `app.suscripciones_notificacion` - Overrides por tipo de notificación
- ✅ `app.historial_envios` - Trazabilidad de envíos por canal
- ✅ `app.outbox_eventos` - Eventos para propagación