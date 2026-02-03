# =============================================================================
# SCRIPT DE LIMPIEZA COMPLETA DE INFRAESTRUCTURA (Windows PowerShell)
# Ejecutar desde: backend\infra\terraform
# =============================================================================

$ErrorActionPreference = "Continue"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "LIMPIEZA DE INFRAESTRUCTURA CAFRILOSA" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "main.tf")) {
    Write-Host "Error: Ejecuta este script desde backend\infra\terraform" -ForegroundColor Red
    exit 1
}

$PROJECT_ID = if ($env:TF_VAR_project_id) { $env:TF_VAR_project_id } else { "gen-lang-client-0059045498" }
$REGION = if ($env:TF_VAR_region) { $env:TF_VAR_region } else { "us-east1" }

Write-Host ""
Write-Host "Proyecto: $PROJECT_ID" -ForegroundColor Yellow
Write-Host "Region: $REGION" -ForegroundColor Yellow
Write-Host ""

# =============================================================================
# PASO 1: Limpiar recursos huerfanos en Google Cloud
# =============================================================================
Write-Host "PASO 1: Limpiando recursos huerfanos en GCP..." -ForegroundColor Green

$SERVICES = @("auth-service", "user-service", "catalog-service", "order-service", "zone-service", "credit-service", "route-service", "delivery-service", "notification-service")
$INSTANCE_NAME = "cafrilosa-db-master"

# 1.1 Eliminar servicios Cloud Run
Write-Host "  -> Eliminando servicios Cloud Run..." -ForegroundColor White
foreach ($svc in $SERVICES) {
    Write-Host "    - Eliminando $svc..."
    gcloud run services delete $svc --region=$REGION --project=$PROJECT_ID --quiet 2>$null
    if ($LASTEXITCODE -ne 0) { Write-Host "      (no existia o ya eliminado)" -ForegroundColor DarkGray }
}

# 1.2 Eliminar usuarios SQL
Write-Host "  -> Eliminando usuarios SQL..." -ForegroundColor White
foreach ($svc in $SERVICES) {
    $user_name = ($svc -replace "-service", "") + "_user"
    Write-Host "    - Eliminando usuario $user_name..."
    gcloud sql users delete $user_name --instance=$INSTANCE_NAME --project=$PROJECT_ID --quiet 2>$null
    if ($LASTEXITCODE -ne 0) { Write-Host "      (no existia o ya eliminado)" -ForegroundColor DarkGray }
}

gcloud sql users delete cafrilosa_admin --instance=$INSTANCE_NAME --project=$PROJECT_ID --quiet 2>$null

# 1.3 Eliminar bases de datos
Write-Host "  -> Eliminando bases de datos..." -ForegroundColor White
$DATABASES = @("cafrilosa_auth", "cafrilosa_user", "cafrilosa_catalog", "cafrilosa_order", "cafrilosa_zone", "cafrilosa_credit", "cafrilosa_route", "cafrilosa_delivery", "cafrilosa_notificaciones")

foreach ($db in $DATABASES) {
    Write-Host "    - Eliminando $db..."
    gcloud sql databases delete $db --instance=$INSTANCE_NAME --project=$PROJECT_ID --quiet 2>$null
    if ($LASTEXITCODE -ne 0) { Write-Host "      (no existia o ya eliminada)" -ForegroundColor DarkGray }
}

# 1.4 Eliminar secretos
Write-Host "  -> Eliminando secretos de Secret Manager..." -ForegroundColor White
foreach ($svc in $SERVICES) {
    $secret_name = "$svc-db-password"
    Write-Host "    - Eliminando secreto $secret_name..."
    gcloud secrets delete $secret_name --project=$PROJECT_ID --quiet 2>$null
    if ($LASTEXITCODE -ne 0) { Write-Host "      (no existia o ya eliminado)" -ForegroundColor DarkGray }
}

gcloud secrets delete db-root-password --project=$PROJECT_ID --quiet 2>$null
gcloud secrets delete cafrilosa-jwt-secret --project=$PROJECT_ID --quiet 2>$null

# 1.5 Eliminar Service Accounts
Write-Host "  -> Eliminando Service Accounts..." -ForegroundColor White
foreach ($svc in $SERVICES) {
    $sa_email = "$svc-sa@$PROJECT_ID.iam.gserviceaccount.com"
    Write-Host "    - Eliminando $sa_email..."
    gcloud iam service-accounts delete $sa_email --project=$PROJECT_ID --quiet 2>$null
    if ($LASTEXITCODE -ne 0) { Write-Host "      (no existia o ya eliminado)" -ForegroundColor DarkGray }
}

# =============================================================================
# PASO 2: Limpiar estado de Terraform
# =============================================================================
Write-Host ""
Write-Host "PASO 2: Limpiando estado de Terraform..." -ForegroundColor Green

Write-Host "  -> Removiendo recursos huerfanos del state..." -ForegroundColor White

# Cloud Run services
foreach ($svc in $SERVICES) {
    terraform state rm "module.cloud_run.google_cloud_run_v2_service.default[`"$svc`"]" 2>$null
    terraform state rm "module.cloud_run.google_service_account.sa[`"$svc`"]" 2>$null
    terraform state rm "module.cloud_run.google_secret_manager_secret_iam_member.db_pass_access[`"$svc`"]" 2>$null
    terraform state rm "module.cloud_run.google_secret_manager_secret_iam_member.jwt_secret_access[`"$svc`"]" 2>$null
    terraform state rm "module.cloud_run.google_cloud_run_service_iam_member.invoker[`"$svc`"]" 2>$null
    terraform state rm "module.cloud_run.google_storage_bucket_iam_member.upload_permission[`"$svc`"]" 2>$null
}

# Database users
foreach ($svc in $SERVICES) {
    terraform state rm "module.database.google_sql_user.users[`"$svc`"]" 2>$null
    terraform state rm "module.database.google_sql_database.databases[`"$svc`"]" 2>$null
}
terraform state rm "module.database.google_sql_user.root" 2>$null

# Secrets
foreach ($svc in $SERVICES) {
    terraform state rm "module.secrets.random_password.service_db_passwords[`"$svc`"]" 2>$null
    terraform state rm "module.secrets.google_secret_manager_secret.service_db_secrets[`"$svc`"]" 2>$null
    terraform state rm "module.secrets.google_secret_manager_secret_version.service_db_secrets_val[`"$svc`"]" 2>$null
}
terraform state rm "module.secrets.random_password.db_root_password" 2>$null
terraform state rm "module.secrets.google_secret_manager_secret.db_root_pass" 2>$null
terraform state rm "module.secrets.google_secret_manager_secret_version.db_root_pass_val" 2>$null

# JWT Secret
terraform state rm "random_password.jwt_secret" 2>$null
terraform state rm "google_secret_manager_secret.jwt_secret" 2>$null
terraform state rm "google_secret_manager_secret_version.jwt_secret_val" 2>$null

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "LIMPIEZA COMPLETADA" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ahora ejecuta:" -ForegroundColor Yellow
Write-Host "  1. terraform init" -ForegroundColor White
Write-Host "  2. terraform plan" -ForegroundColor White
Write-Host "  3. terraform apply" -ForegroundColor White
Write-Host ""
