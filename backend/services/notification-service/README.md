# Notification Service

Sistema híbrido de notificaciones en tiempo real con WebSocket, REST API y persistencia en base de datos.

## 🎯 Características

- ✅ **WebSocket en Tiempo Real** - Notificaciones push instantáneas
- ✅ **REST API** - Consulta de notificaciones históricas
- ✅ **Persistencia** - Todas las notificaciones se guardan en BD
- ✅ **Multi-Origen** - Consume eventos de order-service, credit-service, etc.
- ✅ **Outbox Pattern** - Procesamiento confiable de eventos
- ✅ **Escalable** - Preparado para Redis pub/sub multi-instancia

## 📋 Endpoints REST

```
GET    /api/notifications?usuarioId=xxx&soloNoLeidas=true
POST   /api/notifications
GET    /api/notifications/:id
PATCH  /api/notifications/:id/mark-read
PATCH  /api/notifications/mark-all-read?usuarioId=xxx
GET    /api/notifications/unread/count?usuarioId=xxx
GET    /api/notifications/ws/stats
```

## 🔌 WebSocket

### Conexión del Cliente

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/notifications', {
  auth: { userId: 'uuid-del-usuario' }
});

// Escuchar notificaciones
socket.on('notification', (notification) => {
  console.log('Nueva notificación:', notification);
  // Mostrar toast, actualizar UI, etc.
});

// Ping/pong para health check
socket.emit('ping'); // responde 'pong'
```

## 🗄️ Base de Datos

Usa dos conexiones:
- **cafrilosa_notificaciones** - Almacena las notificaciones
- **cafrilosa_pedidos** - Lee el outbox de order-service

## ⚙️ Variables de Entorno

Ver `.env.example` para todas las variables requeridas.

```bash
# Copiar ejemplo
cp .env.example .env

# Editar con tus valores
nano .env
```

## 🚀 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run start:dev

# Build
npm run build

# Producción
npm run start:prod
```

## 🐳 Docker

```bash
# Build imagen
docker build -t notification-service .

# Run container
docker run -p 3000:3000 --env-file .env notification-service
```

## 📊 Tipos de Notificación Soportados

### Pedidos (order-service)
- `pedido_creado` - Nuevo pedido recibido
- `pedido_aprobado` - Pedido validado por bodega
- `pedido_ajustado` - Requiere aprobación de cliente
- `pedido_cancelado` - Pedido cancelado
- `pedido_asignado_ruta` - Asignado a rutero
- `pedido_en_ruta` - En camino
- `pedido_entregado` - Entregado

### Créditos (credit-service) - *Pendiente*
- `credito_aprobado`
- `credito_rechazado`
- `pago_registrado`

### Entregas (delivery-service) - *Pendiente*
- `entrega_iniciada`
- `entrega_completada`
- `incidente_reportado`

## 🔄 Cómo Funciona

1. **Eventos Ocurren** → Los servicios (order, credit, etc.) crean eventos en sus tablas `outbox_eventos`
2. **Consumer Poll** → `OrderConsumerService` lee eventos cada 10 segundos
3. **Transformación** → Convierte eventos en notificaciones
4. **Persistencia** → Guarda en `app.notificaciones`
5. **Push** → Envía vía WebSocket a usuarios conectados
6. **Fallback** → Los offline pueden consultar vía REST API

## 📚 Documentación API

Una vez iniciado el servicio, visita:
```
http://localhost:3000/api/docs
```

## 🛠️ TODO / Mejoras Futuras

- [ ] Implementar Redis pub/sub para multi-instancia
- [ ] Agregar consumers para credit-service y delivery-service
- [ ] Sistema de templates para mensajes
- [ ] Preferencias de notificación por usuario
- [ ] Rate limiting para prevenir spam
- [ ] Soporte para notificaciones por email/SMS
- [ ] Analytics de notificaciones (tasa de lectura, etc.)
