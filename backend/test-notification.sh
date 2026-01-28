#!/bin/bash
# Script para probar el sistema de notificaciones
# Inserta una notificación de prueba directamente en la base de datos

echo "🧪 Test de Notificaciones - Sistema Cafrilosa"
echo "============================================="
echo ""

# Pedir el ID del usuario
read -p "Ingresa el ID del usuario (UUID): " USER_ID

if [ -z "$USER_ID" ]; then
    echo "❌ Error: Debes proporcionar un usuario_id"
    exit 1
fi

echo ""
echo "📝 Insertando notificación de prueba para usuario: $USER_ID"
echo ""

# Insertar notificación directamente
docker exec -it gcp-sql-local psql -U admin -d cafrilosa_notificaciones -c "
INSERT INTO app.notificaciones 
(usuario_id, tipo_id, titulo, mensaje, origen_servicio, prioridad, payload) 
VALUES (
  '$USER_ID',
  (SELECT id FROM app.tipos_notificacion WHERE codigo = 'pedido_creado' LIMIT 1),
  '🧪 Prueba Manual de Sistema',
  'Esta notificación fue insertada directamente para probar que el frontend la muestra correctamente.',
  'test-manual',
  'alta',
  '{\"test\": true, \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}'::jsonb
) RETURNING id, titulo, creado_en;
"

echo ""
echo "✅ Notificación insertada!"
echo ""
echo "📋 Instrucciones:"
echo "1. Abre el frontend en el navegador"
echo "2. Inicia sesión con el usuario: $USER_ID"
echo "3. Ve a la página de Notificaciones"
echo "4. Deberías ver la notificación de prueba"
echo ""
echo "🔍 Para verificar en la base de datos:"
echo "   docker exec -it gcp-sql-local psql -U admin -d cafrilosa_notificaciones -c \\"
echo "   \"SELECT titulo, mensaje, creado_en FROM app.notificaciones WHERE usuario_id = '$USER_ID' ORDER BY creado_en DESC LIMIT 5;\""
echo ""
