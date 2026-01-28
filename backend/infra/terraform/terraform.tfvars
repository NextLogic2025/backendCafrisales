# backend/infra/terraform/terraform.tfvars

project_id        = "gen-lang-client-0059045498"
region            = "us-east1"
zone              = "us-east1-b"

github_owner      = "NextLogic2025"
backend_repo_name = "backendCafrisales"

# Esta lista debe coincidir EXACTAMENTE con los nombres de carpetas en tu repo
services = [
  "auth-service",
  "user-service",
  "catalog-service",
  "order-service",
  "zone-service",
  "credit-service",
  "route-service",
  "delivery-service"
]

# --- CONFIGURACIÓN DE BASE DE DATOS ---
database_version      = "POSTGRES_17"  # <--- Definición explícita de la versión
db_tier               = "db-f1-micro"  # Ojo: Postgres 17 a veces pide instancias más grandes, si falla probamos con custom
deletion_protection   = false          # false para desarrollo, true para prod
backup_retention_days = 30
db_admin_user         = "postgres"