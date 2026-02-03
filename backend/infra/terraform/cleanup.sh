#!/bin/bash
# =============================================================================
# SCRIPT DE LIMPIEZA COMPLETA DE INFRAESTRUCTURA
# Ejecutar desde: backend/infra/terraform
# =============================================================================

set -e

echo "=========================================="
echo "🧹 LIMPIEZA DE INFRAESTRUCTURA CAFRILOSA"
echo "=========================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "main.tf" ]; then
    echo "❌ Error: Ejecuta este script desde backend/infra/terraform"
    exit 1
fi

PROJECT_ID="${TF_VAR_project_id:-gen-lang-client-0059045498}"
REGION="${TF_VAR_region:-us-east1}"

echo ""
echo "📋 Proyecto: $PROJECT_ID"
echo "📍 Región: $REGION"
echo ""

# =============================================================================
# PASO 1: Limpiar recursos huérfanos en Google Cloud
# =============================================================================
echo "🔄 PASO 1: Limpiando recursos huérfanos en GCP..."

# 1.1 Eliminar servicios Cloud Run manualmente
echo "  → Eliminando servicios Cloud Run..."
SERVICES="auth-service user-service catalog-service order-service zone-service credit-service route-service delivery-service notification-service"

for svc in $SERVICES; do
    echo "    - Eliminando $svc..."
    gcloud run services delete $svc --region=$REGION --project=$PROJECT_ID --quiet 2>/dev/null || echo "      (no existía o ya eliminado)"
done

# 1.2 Eliminar usuarios SQL
echo "  → Eliminando usuarios SQL..."
INSTANCE_NAME="cafrilosa-db-master"

for svc in $SERVICES; do
    user_name="${svc%-service}_user"
    echo "    - Eliminando usuario $user_name..."
    gcloud sql users delete $user_name --instance=$INSTANCE_NAME --project=$PROJECT_ID --quiet 2>/dev/null || echo "      (no existía o ya eliminado)"
done

# Eliminar usuario root si existe
gcloud sql users delete cafrilosa_admin --instance=$INSTANCE_NAME --project=$PROJECT_ID --quiet 2>/dev/null || echo "      (usuario root no existía)"

# 1.3 Eliminar bases de datos
echo "  → Eliminando bases de datos..."
DATABASES="cafrilosa_auth cafrilosa_user cafrilosa_catalog cafrilosa_order cafrilosa_zone cafrilosa_credit cafrilosa_route cafrilosa_delivery cafrilosa_notificaciones"

for db in $DATABASES; do
    echo "    - Eliminando $db..."
    gcloud sql databases delete $db --instance=$INSTANCE_NAME --project=$PROJECT_ID --quiet 2>/dev/null || echo "      (no existía o ya eliminada)"
done

# 1.4 Eliminar secretos
echo "  → Eliminando secretos de Secret Manager..."
for svc in $SERVICES; do
    secret_name="${svc}-db-password"
    echo "    - Eliminando secreto $secret_name..."
    gcloud secrets delete $secret_name --project=$PROJECT_ID --quiet 2>/dev/null || echo "      (no existía o ya eliminado)"
done

gcloud secrets delete db-root-password --project=$PROJECT_ID --quiet 2>/dev/null || echo "      (secreto root no existía)"
gcloud secrets delete cafrilosa-jwt-secret --project=$PROJECT_ID --quiet 2>/dev/null || echo "      (secreto JWT no existía)"

# 1.5 Eliminar Service Accounts de Cloud Run
echo "  → Eliminando Service Accounts..."
for svc in $SERVICES; do
    sa_email="${svc}-sa@${PROJECT_ID}.iam.gserviceaccount.com"
    echo "    - Eliminando $sa_email..."
    gcloud iam service-accounts delete $sa_email --project=$PROJECT_ID --quiet 2>/dev/null || echo "      (no existía o ya eliminado)"
done

# =============================================================================
# PASO 2: Limpiar estado de Terraform
# =============================================================================
echo ""
echo "🔄 PASO 2: Limpiando estado de Terraform..."

# 2.1 Eliminar recursos del state que ya no existen
echo "  → Removiendo recursos huérfanos del state..."

# Cloud Run services
for svc in $SERVICES; do
    terraform state rm "module.cloud_run.google_cloud_run_v2_service.default[\"$svc\"]" 2>/dev/null || true
    terraform state rm "module.cloud_run.google_service_account.sa[\"$svc\"]" 2>/dev/null || true
    terraform state rm "module.cloud_run.google_secret_manager_secret_iam_member.db_pass_access[\"$svc\"]" 2>/dev/null || true
    terraform state rm "module.cloud_run.google_secret_manager_secret_iam_member.jwt_secret_access[\"$svc\"]" 2>/dev/null || true
    terraform state rm "module.cloud_run.google_cloud_run_service_iam_member.invoker[\"$svc\"]" 2>/dev/null || true
    terraform state rm "module.cloud_run.google_storage_bucket_iam_member.upload_permission[\"$svc\"]" 2>/dev/null || true
done

# Database users
for svc in $SERVICES; do
    terraform state rm "module.database.google_sql_user.users[\"$svc\"]" 2>/dev/null || true
    terraform state rm "module.database.google_sql_database.databases[\"$svc\"]" 2>/dev/null || true
done
terraform state rm "module.database.google_sql_user.root" 2>/dev/null || true

# Secrets
for svc in $SERVICES; do
    terraform state rm "module.secrets.random_password.service_db_passwords[\"$svc\"]" 2>/dev/null || true
    terraform state rm "module.secrets.google_secret_manager_secret.service_db_secrets[\"$svc\"]" 2>/dev/null || true
    terraform state rm "module.secrets.google_secret_manager_secret_version.service_db_secrets_val[\"$svc\"]" 2>/dev/null || true
done
terraform state rm "module.secrets.random_password.db_root_password" 2>/dev/null || true
terraform state rm "module.secrets.google_secret_manager_secret.db_root_pass" 2>/dev/null || true
terraform state rm "module.secrets.google_secret_manager_secret_version.db_root_pass_val" 2>/dev/null || true

# JWT Secret
terraform state rm "random_password.jwt_secret" 2>/dev/null || true
terraform state rm "google_secret_manager_secret.jwt_secret" 2>/dev/null || true
terraform state rm "google_secret_manager_secret_version.jwt_secret_val" 2>/dev/null || true

echo ""
echo "=========================================="
echo "✅ LIMPIEZA COMPLETADA"
echo "=========================================="
echo ""
echo "Ahora ejecuta:"
echo "  1. terraform init"
echo "  2. terraform plan"
echo "  3. terraform apply"
echo ""
