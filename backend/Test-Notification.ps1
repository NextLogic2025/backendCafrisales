# Script para probar el sistema de notificaciones
# Inserta una notificación de prueba directamente en la base de datos

Write-Host "🧪 Test de Notificaciones - Sistema Cafrilosa" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Pedir el ID del usuario
$USER_ID = Read-Host "Ingresa el ID del usuario (UUID)"

if ([string]::IsNullOrWhiteSpace($USER_ID)) {
    Write-Host "❌ Error: Debes proporcionar un usuario_id" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📝 Insertando notificación de prueba para usuario: $USER_ID" -ForegroundColor Yellow
Write-Host ""

# Timestamp actual en formato ISO
$timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")

# Query SQL
$sql = @"
INSERT INTO app.notificaciones 
(usuario_id, tipo_id, titulo, mensaje, origen_servicio, prioridad, payload) 
VALUES (
  '$USER_ID',
  (SELECT id FROM app.tipos_notificacion WHERE codigo = 'pedido_creado' LIMIT 1),
  '🧪 Prueba Manual de Sistema',
  'Esta notificación fue insertada directamente para probar que el frontend la muestra correctamente.',
  'test-manual',
  'alta',
  '{\"test\": true, \"timestamp\": \"$timestamp\"}'::jsonb
) RETURNING id, titulo, creado_en;
"@

# Ejecutar query
docker exec -it gcp-sql-local psql -U admin -d cafrilosa_notificaciones -c $sql

Write-Host ""
Write-Host "✅ Notificación insertada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Instrucciones:" -ForegroundColor Cyan
Write-Host "1. Abre el frontend en el navegador"
Write-Host "2. Inicia sesión con el usuario: $USER_ID"
Write-Host "3. Ve a la página de Notificaciones"
Write-Host "4. Deberías ver la notificación de prueba"
Write-Host ""
Write-Host "🔍 Para verificar en la base de datos:" -ForegroundColor Cyan
Write-Host "docker exec -it gcp-sql-local psql -U admin -d cafrilosa_notificaciones -c `"SELECT titulo, mensaje, creado_en FROM app.notificaciones WHERE usuario_id = '$USER_ID' ORDER BY creado_en DESC LIMIT 5;`"" -ForegroundColor Gray
Write-Host ""

# También mostrar las notificaciones existentes
Write-Host "📊 Mostrando notificaciones existentes para este usuario:" -ForegroundColor Cyan
docker exec -it gcp-sql-local psql -U admin -d cafrilosa_notificaciones -c "SELECT titulo, mensaje, creado_en FROM app.notificaciones WHERE usuario_id = '$USER_ID' ORDER BY creado_en DESC LIMIT 5;"
