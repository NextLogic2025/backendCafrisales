# Flujos CREDIT-SERVICE

Basado **exclusivamente** en las tablas de `cafrilosa_creditos`:
- `app.aprobaciones_credito`
- `app.pagos_credito`
- `app.historial_estado_credito`
- `app.v_credito_totales` (vista)
- `app.outbox_eventos`

---

## 1. Aprobar Crédito (por Vendedor)

### Diagrama de Secuencia
```
Vendedor         Credit-Service   DB-Creditos      Order-Service
    |                 |                |                  |
    |-- POST /creditos/aprobar         |                  |
    |   {pedido_id, cliente_id, monto_aprobado,          |
    |    plazo_dias, notas}            |                  |
    |                 |                |                  |
    |          [1] Validar pedido -------------------->  |
    |                 |  GET /pedidos/{id}               |
    |                 |  (estado, metodo_pago='credito') |
    |                 |<---------- 200 OK                |
    |                 |                |                  |
    |          [2] Calcular fecha_vencimiento           |
    |                 |  = fecha_aprobacion + plazo_dias |
    |                 |                |                  |
    |          [3] BEGIN TRANSACTION  |                  |
    |                 |                |                  |
    |          [4] INSERT aprobaciones_credito          |
    |                 |  (id, pedido_id, cliente_id,     |
    |                 |   aprobado_por_vendedor_id,      |
    |                 |   origen='vendedor', monto_aprobado,
    |                 |   moneda='USD', plazo_dias,      |
    |                 |   fecha_aprobacion, fecha_vencimiento,
    |                 |   estado='activo', notas,        |
    |                 |   creado_en, actualizado_en,     |
    |                 |   creado_por, actualizado_por, version)
    |                 |                |                  |
    |          [5] INSERT historial_estado_credito      |
    |                 |  (aprobacion_credito_id,         |
    |                 |   estado='activo',               |
    |                 |   cambiado_por_id=vendedor_id,   |
    |                 |   motivo='Crédito aprobado')     |
    |                 |                |                  |
    |          [6] INSERT outbox_eventos                |
    |                 |  (agregado='credit',             |
    |                 |   tipo_evento='CreditoAprobado', |
    |                 |   clave_agregado=credito_id, payload)
    |                 |                |                  |
    |          [7] COMMIT             |                  |
    |                 |                |                  |
    |<-- 201 Created  |                |                  |
    |  {credito_id, monto_aprobado, fecha_vencimiento}  |
```

**Tablas involucradas:**
```sql
-- [4] Insertar aprobación
app.aprobaciones_credito: id, pedido_id, cliente_id, aprobado_por_vendedor_id,
                          origen, monto_aprobado, moneda, plazo_dias,
                          fecha_aprobacion, fecha_vencimiento, estado, notas,
                          creado_en, actualizado_en, creado_por, 
                          actualizado_por, version

-- [5] Historial inicial
app.historial_estado_credito: id, aprobacion_credito_id, estado,
                              cambiado_por_id, motivo, creado_en

-- [6] Evento
app.outbox_eventos: id, agregado, tipo_evento, clave_agregado, payload,
                    creado_en, procesado_en
```

---

## 2. Aprobar Crédito Excepcional (origen='excepcion')

### Diagrama de Secuencia
```
Supervisor       Credit-Service   DB-Creditos      Order-Service
    |                 |                |                  |
    |-- POST /creditos/aprobar-excepcion               |
    |   {pedido_id, cliente_id, monto_aprobado,          |
    |    plazo_dias, notas='Cliente especial'}          |
    |                 |                |                  |
    |          [1] Validar pedido -------------------->  |
    |                 |                |                  |
    |          [2] BEGIN TRANSACTION  |                  |
    |                 |                |                  |
    |          [3] INSERT aprobaciones_credito          |
    |                 |  (origen='excepcion',            |
    |                 |   aprobado_por_vendedor_id=supervisor_id,
    |                 |   estado='activo', ...)          |
    |                 |                |                  |
    |          [4] INSERT historial_estado_credito      |
    |                 |  (motivo='Crédito excepcional aprobado')
    |                 |                |                  |
    |          [5] INSERT outbox_eventos                |
    |                 |  (tipo_evento='CreditoExcepcionalAprobado')
    |                 |                |                  |
    |          [6] COMMIT             |                  |
    |                 |                |                  |
    |<-- 201 Created  |                |                  |
```

**Tablas involucradas:**
```sql
-- [3] Aprobación excepcional
app.aprobaciones_credito: origen='excepcion', 
                          aprobado_por_vendedor_id (supervisor en este caso)

-- [4] Historial
app.historial_estado_credito: motivo='Crédito excepcional aprobado'

-- [5] Evento
app.outbox_eventos: tipo_evento='CreditoExcepcionalAprobado'
```

---

## 3. Registrar Pago de Crédito

### Diagrama de Secuencia
```
Vendedor/Cobrador Credit-Service  DB-Creditos
    |                 |                |
    |-- POST /creditos/{id}/pagos     |
    |   {monto_pago, fecha_pago, referencia,
    |    metodo_registro='efectivo', notas}
    |                 |                |
    |          [1] SELECT * FROM aprobaciones_credito
    |                 |  WHERE id = credito_id
    |                 |  AND estado = 'activo'
    |                 |  FOR UPDATE    |
    |                 |                |
    |          [2] SELECT monto_aprobado, total_pagado, saldo
    |                 |  FROM v_credito_totales
    |                 |  WHERE aprobacion_credito_id = ?
    |                 |                |
    |          [3] Validar: monto_pago <= saldo
    |                 |                |
    |          [4] BEGIN TRANSACTION  |
    |                 |                |
    |          [5] INSERT pagos_credito
    |                 |  (id, aprobacion_credito_id,
    |                 |   monto_pago, moneda='USD', fecha_pago,
    |                 |   registrado_por_id, metodo_registro,
    |                 |   referencia, notas, creado_en)
    |                 |                |
    |          [6] IF saldo - monto_pago = 0 THEN
    |                 |    UPDATE aprobaciones_credito
    |                 |    SET estado = 'pagado',
    |                 |        actualizado_por = actor_id
    |                 |    (trigger -> actualizado_en, version++)
    |                 |                |
    |          [7]    INSERT historial_estado_credito
    |                 |    (estado='pagado',
    |                 |     motivo='Crédito pagado completamente')
    |                 |                |
    |          [8] INSERT outbox_eventos
    |                 |  (tipo_evento='PagoCreditoRegistrado')
    |                 |                |
    |          [9] COMMIT             |
    |                 |                |
    |<-- 201 Created  |                |
    |  {pago_id, monto_pago, saldo_restante}
```

**Tablas involucradas:**
```sql
-- [1] Bloquear crédito
app.aprobaciones_credito: id, estado='activo'

-- [2] Consultar saldo (vista)
app.v_credito_totales: aprobacion_credito_id, monto_aprobado, 
                       total_pagado, saldo

-- [5] Insertar pago
app.pagos_credito: id, aprobacion_credito_id, monto_pago, moneda, fecha_pago,
                   registrado_por_id, metodo_registro, referencia, 
                   notas, creado_en

-- [6] Cambiar estado si saldo=0
app.aprobaciones_credito: estado='pagado', actualizado_en, actualizado_por

-- [7] Historial
app.historial_estado_credito: estado='pagado'

-- [8] Evento
app.outbox_eventos: tipo_evento='PagoCreditoRegistrado'
```

---

## 4. Registrar Pago Parcial

### Diagrama de Secuencia
```
Vendedor         Credit-Service   DB-Creditos
    |                 |                |
    |-- POST /creditos/{id}/pagos     |
    |   {monto_pago=300, fecha_pago, referencia}
    |                 |                |
    |          [1] SELECT aprobaciones_credito FOR UPDATE
    |                 |  WHERE estado = 'activo'
    |                 |                |
    |          [2] SELECT saldo FROM v_credito_totales
    |                 |  (monto_aprobado=1000, total_pagado=500,
    |                 |   saldo=500)    |
    |                 |                |
    |          [3] Validar: 300 <= 500 ✓
    |                 |                |
    |          [4] INSERT pagos_credito
    |                 |  (monto_pago=300)
    |                 |                |
    |          [5] Calcular nuevo_saldo = 500 - 300 = 200
    |                 |  estado permanece 'activo'
    |                 |                |
    |          [6] INSERT outbox_eventos
    |                 |  (tipo_evento='PagoParcialRegistrado')
    |                 |                |
    |<-- 201 Created  |                |
    |  {pago_id, monto_pago=300, saldo_restante=200}
```

**Tablas involucradas:**
```sql
-- [1] Crédito activo
app.aprobaciones_credito: estado='activo'

-- [2] Vista de totales
app.v_credito_totales: saldo

-- [4] Pago parcial
app.pagos_credito: monto_pago

-- [6] Evento
app.outbox_eventos: tipo_evento='PagoParcialRegistrado'
```

---

## 5. Marcar Crédito como Vencido (proceso automático)

### Diagrama de Secuencia
```
Cron/Scheduler   Credit-Service   DB-Creditos
    |                 |                |
    |-- POST /creditos/procesar-vencidos
    |                 |                |
    |          [1] SELECT * FROM aprobaciones_credito
    |                 |  WHERE estado = 'activo'
    |                 |  AND fecha_vencimiento < CURRENT_DATE
    |                 |  FOR UPDATE    |
    |                 |                |
    |          [2] Por cada crédito vencido:
    |                 |                |
    |          [3] BEGIN TRANSACTION  |
    |                 |                |
    |          [4] UPDATE aprobaciones_credito
    |                 |  SET estado = 'vencido',
    |                 |      actualizado_por = 'sistema'
    |                 |  (trigger -> actualizado_en, version++)
    |                 |                |
    |          [5] INSERT historial_estado_credito
    |                 |  (estado='vencido',
    |                 |   cambiado_por_id='sistema',
    |                 |   motivo='Fecha vencimiento superada')
    |                 |                |
    |          [6] INSERT outbox_eventos
    |                 |  (tipo_evento='CreditoVencido')
    |                 |                |
    |          [7] COMMIT             |
    |                 |                |
    |<-- 200 OK       |                |
    |  {procesados: 5}|                |
```

**Tablas involucradas:**
```sql
-- [1] Créditos activos vencidos
app.aprobaciones_credito: estado='activo', fecha_vencimiento

-- [4] Cambiar a vencido
app.aprobaciones_credito: estado='vencido'

-- [5] Historial
app.historial_estado_credito: estado='vencido'

-- [6] Evento
app.outbox_eventos: tipo_evento='CreditoVencido'
```

---

## 6. Cancelar Crédito

### Diagrama de Secuencia
```
Admin/Supervisor Credit-Service   DB-Creditos
    |                 |                |
    |-- PUT /creditos/{id}/cancelar   |
    |   {motivo}      |                |
    |                 |                |
    |          [1] SELECT * FROM aprobaciones_credito
    |                 |  WHERE id = credito_id
    |                 |  AND estado NOT IN ('pagado','cancelado')
    |                 |  FOR UPDATE    |
    |                 |                |
    |          [2] BEGIN TRANSACTION  |
    |                 |                |
    |          [3] UPDATE aprobaciones_credito
    |                 |  SET estado = 'cancelado',
    |                 |      actualizado_por = admin_id
    |                 |                |
    |          [4] INSERT historial_estado_credito
    |                 |  (estado='cancelado',
    |                 |   cambiado_por_id=admin_id, motivo)
    |                 |                |
    |          [5] INSERT outbox_eventos
    |                 |  (tipo_evento='CreditoCancelado')
    |                 |                |
    |          [6] COMMIT             |
    |                 |                |
    |<-- 200 OK       |                |
```

**Tablas involucradas:**
```sql
-- [1] Validar estado cancelable
app.aprobaciones_credito: id, estado NOT IN ('pagado','cancelado')

-- [3] Cancelar
app.aprobaciones_credito: estado='cancelado', actualizado_en, actualizado_por

-- [4] Historial
app.historial_estado_credito: estado='cancelado', motivo

-- [5] Evento
app.outbox_eventos: tipo_evento='CreditoCancelado'
```

---

## 7. Consultar Crédito con Pagos

### Diagrama de Secuencia
```
Vendedor         Credit-Service   DB-Creditos
    |                 |                |
    |-- GET /creditos/{id}            |
    |                 |                |
    |          [1] SELECT * FROM aprobaciones_credito
    |                 |  WHERE id = credito_id
    |                 |                |
    |          [2] SELECT * FROM v_credito_totales
    |                 |  WHERE aprobacion_credito_id = ?
    |                 |                |
    |          [3] SELECT * FROM pagos_credito
    |                 |  WHERE aprobacion_credito_id = ?
    |                 |  ORDER BY fecha_pago DESC
    |                 |                |
    |<-- 200 OK       |                |
    |  {credito: {id, pedido_id, cliente_id, monto_aprobado,
    |             plazo_dias, fecha_vencimiento, estado, ...},
    |   totales: {total_pagado, saldo},
    |   pagos: [{pago_id, monto, fecha, referencia}, ...]}
```

**Tablas involucradas:**
```sql
-- [1] Crédito base
app.aprobaciones_credito: todas las columnas

-- [2] Totales calculados (vista)
app.v_credito_totales: aprobacion_credito_id, monto_aprobado, moneda,
                       estado, fecha_vencimiento, total_pagado, saldo

-- [3] Pagos del crédito
app.pagos_credito: id, aprobacion_credito_id, monto_pago, moneda, fecha_pago,
                   registrado_por_id, metodo_registro, referencia, notas
```

---

## 8. Listar Créditos por Cliente

### Diagrama de Secuencia
```
Vendedor         Credit-Service   DB-Creditos
    |                 |                |
    |-- GET /creditos?cliente_id={id} |
    |   &estado=activo|                |
    |                 |                |
    |          [1] SELECT ac.*, vct.total_pagado, vct.saldo
    |                 |  FROM aprobaciones_credito ac
    |                 |  JOIN v_credito_totales vct
    |                 |    ON vct.aprobacion_credito_id = ac.id
    |                 |  WHERE ac.cliente_id = ?
    |                 |  AND (? IS NULL OR ac.estado = ?)
    |                 |  ORDER BY ac.creado_en DESC
    |                 |                |
    |<-- 200 OK       |                |
    |  [{credito_id, pedido_id, monto_aprobado, estado,
    |    fecha_vencimiento, total_pagado, saldo}, ...]
```

**Tablas involucradas:**
```sql
-- [1] Créditos del cliente con totales
app.aprobaciones_credito: cliente_id, estado, creado_en
app.v_credito_totales: total_pagado, saldo
```

---

## 9. Listar Créditos por Vendedor

### Diagrama de Secuencia
```
Supervisor       Credit-Service   DB-Creditos
    |                 |                |
    |-- GET /creditos?vendedor_id={id}|
    |   &estado=activo,vencido         |
    |                 |                |
    |          [1] SELECT ac.*, vct.saldo
    |                 |  FROM aprobaciones_credito ac
    |                 |  JOIN v_credito_totales vct
    |                 |    ON vct.aprobacion_credito_id = ac.id
    |                 |  WHERE ac.aprobado_por_vendedor_id = ?
    |                 |  AND ac.estado IN ('activo','vencido')
    |                 |  ORDER BY ac.fecha_vencimiento ASC
    |                 |                |
    |<-- 200 OK       |                |
    |  [{credito_id, cliente_id, monto_aprobado,
    |    fecha_vencimiento, estado, saldo}, ...]
```

**Tablas involucradas:**
```sql
-- [1] Créditos del vendedor
app.aprobaciones_credito: aprobado_por_vendedor_id, estado, fecha_vencimiento
app.v_credito_totales: saldo
```

---

## 10. Listar Créditos Próximos a Vencer

### Diagrama de Secuencia
```
Admin/Reportes   Credit-Service   DB-Creditos
    |                 |                |
    |-- GET /creditos/proximos-vencer |
    |   ?dias=7        |                |
    |                 |                |
    |          [1] SELECT ac.*, vct.saldo
    |                 |  FROM aprobaciones_credito ac
    |                 |  JOIN v_credito_totales vct
    |                 |    ON vct.aprobacion_credito_id = ac.id
    |                 |  WHERE ac.estado = 'activo'
    |                 |  AND ac.fecha_vencimiento BETWEEN
    |                 |      CURRENT_DATE AND CURRENT_DATE + INTERVAL '? days'
    |                 |  AND vct.saldo > 0
    |                 |  ORDER BY ac.fecha_vencimiento ASC
    |                 |                |
    |<-- 200 OK       |                |
    |  [{credito_id, cliente_id, monto_aprobado,
    |    fecha_vencimiento, dias_restantes, saldo}, ...]
```

**Tablas involucradas:**
```sql
-- [1] Créditos por vencer
app.aprobaciones_credito: estado='activo', fecha_vencimiento
app.v_credito_totales: saldo
```

---

## 11. Consultar Historial de Estados de Crédito

### Diagrama de Secuencia
```
Usuario          Credit-Service   DB-Creditos
    |                 |                |
    |-- GET /creditos/{id}/historial  |
    |                 |                |
    |          [1] SELECT * FROM historial_estado_credito
    |                 |  WHERE aprobacion_credito_id = ?
    |                 |  ORDER BY creado_en DESC
    |                 |                |
    |<-- 200 OK       |                |
    |  [{estado, cambiado_por_id, motivo, creado_en}, ...]
```

**Tablas involucradas:**
```sql
-- [1] Historial completo
app.historial_estado_credito: id, aprobacion_credito_id, estado,
                              cambiado_por_id, motivo, creado_en
```

---

## 12. Listar Pagos de un Crédito

### Diagrama de Secuencia
```
Vendedor         Credit-Service   DB-Creditos
    |                 |                |
    |-- GET /creditos/{id}/pagos      |
    |                 |                |
    |          [1] SELECT * FROM pagos_credito
    |                 |  WHERE aprobacion_credito_id = ?
    |                 |  ORDER BY fecha_pago DESC
    |                 |                |
    |<-- 200 OK       |                |
    |  [{pago_id, monto_pago, moneda, fecha_pago,
    |    registrado_por_id, metodo_registro, referencia,
    |    notas, creado_en}, ...]
```

**Tablas involucradas:**
```sql
-- [1] Pagos del crédito
app.pagos_credito: aprobacion_credito_id, monto_pago, fecha_pago,
                   registrado_por_id, metodo_registro, referencia
```

---

## 13. Reporte de Créditos Vencidos con Saldo

### Diagrama de Secuencia
```
Admin/Cobranza   Credit-Service   DB-Creditos
    |                 |                |
    |-- GET /creditos/reporte-vencidos
    |                 |                |
    |          [1] SELECT ac.*, vct.saldo,
    |                 |         DATE_PART('day', CURRENT_DATE - ac.fecha_vencimiento) as dias_vencido
    |                 |  FROM aprobaciones_credito ac
    |                 |  JOIN v_credito_totales vct
    |                 |    ON vct.aprobacion_credito_id = ac.id
    |                 |  WHERE ac.estado = 'vencido'
    |                 |  AND vct.saldo > 0
    |                 |  ORDER BY ac.fecha_vencimiento ASC
    |                 |                |
    |<-- 200 OK       |                |
    |  [{credito_id, cliente_id, pedido_id, monto_aprobado,
    |    fecha_vencimiento, dias_vencido, saldo}, ...]
```

**Tablas involucradas:**
```sql
-- [1] Créditos vencidos con deuda
app.aprobaciones_credito: estado='vencido', fecha_vencimiento
app.v_credito_totales: saldo > 0
```

---

**Resumen de tablas CREDIT-SERVICE:**
- ✅ `app.aprobaciones_credito` - Créditos aprobados con estado y fechas
- ✅ `app.pagos_credito` - Pagos/abonos al crédito
- ✅ `app.historial_estado_credito` - Trazabilidad de cambios de estado
- ✅ `app.v_credito_totales` - Vista con totales (monto, pagado, saldo)
- ✅ `app.outbox_eventos` - Eventos para otros servicios