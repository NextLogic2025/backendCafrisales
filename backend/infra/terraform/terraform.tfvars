# backend/infra/terraform/terraform.tfvars

project_id        = "gen-lang-client-0059045498"
region            = "us-east1"
zone              = "us-east1-b"

github_owner      = "NextLogic2025"
backend_repo_name = "backendCafrisales"

# AGREGADO: notification-service al final de la lista
services = [
  "auth-service",
  "user-service",
  "catalog-service",
  "order-service",
  "zone-service",
  "credit-service",
  "route-service",
  "delivery-service",
  "notification-service" 
]

# --- CONFIGURACIÓN DE BASE DE DATOS ---
database_version      = "POSTGRES_17"
db_tier               = "db-f1-micro"
deletion_protection   = false
backup_retention_days = 7
db_admin_user         = "postgres"