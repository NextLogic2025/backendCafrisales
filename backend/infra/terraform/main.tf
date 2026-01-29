terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# 0. RECURSOS GLOBALES
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "${var.app_name}-jwt-secret"
  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}

resource "google_secret_manager_secret_version" "jwt_secret_val" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = random_password.jwt_secret.result
}

# 0.5 IDENTIDAD DEL GATEWAY
resource "google_service_account" "gateway_sa" {
  account_id   = "api-gateway-sa"
  display_name = "Service Account para API Gateway Cafrilosa"
  project      = var.project_id
}

# 1. NETWORKING
module "networking" {
  source = "./modules/networking"

  project_id = var.project_id
  region     = var.region
  app_name   = var.app_name
}

# 2. ARTIFACT REGISTRY
module "artifact_registry" {
  source = "./modules/artifact_registry"
  
  project_id = var.project_id
  region     = var.region
  app_name   = var.app_name
}

# 2.5 STORAGE (Imágenes y Archivos)
module "storage" {
  source = "./modules/storage"

  project_id = var.project_id
  region     = var.region
  app_name   = var.app_name
}

# 3. SECRETOS
module "secrets" {
  source = "./modules/secrets"

  project_id = var.project_id
  services   = var.services
  region     = var.region
}

# 4. BASE DE DATOS
module "database" {
  source = "./modules/database"

  project_id        = var.project_id
  region            = var.region
  vpc_id            = module.networking.vpc_id
  services          = var.services
  
  database_version      = var.database_version
  machine_type          = var.db_tier
  deletion_protection   = var.deletion_protection
  backup_retention_days = var.backup_retention_days
  db_admin_user         = var.db_admin_user

  service_passwords = module.secrets.service_passwords
  root_password     = module.secrets.root_password
  
  depends_on = [module.networking]
}

# 5. CLOUD RUN
module "cloud_run" {
  source = "./modules/cloud_run"

  project_id            = var.project_id
  region                = var.region
  services              = var.services
  artifact_registry_url = module.artifact_registry.repository_url
  bucket_name           = module.storage.bucket_name
  
  # --- CAMBIO CRÍTICO: Direct VPC Egress ---
  # Ya no usamos vpc_connector_id. Pasamos los nombres de red y subred.
  vpc_name    = module.networking.vpc_name
  subnet_name = module.networking.app_subnet_name
  # -----------------------------------------
  
  # DB Info
  cloudsql_private_ip   = module.database.cloudsql_private_ip
  cloudsql_connection   = module.database.cloudsql_connection_name
  
  # Secretos
  db_password_secret_ids = module.secrets.service_secret_ids
  
  gateway_sa_email      = google_service_account.gateway_sa.email
  jwt_secret_id         = google_secret_manager_secret.jwt_secret.id

  depends_on = [module.database, module.artifact_registry]
}

# 6. API GATEWAY
module "api_gateway" {
  source = "./modules/api_gateway"

  project_id   = var.project_id
  region       = var.region
  services     = var.services
  backend_urls = module.cloud_run.service_urls
  
  gateway_sa_email = google_service_account.gateway_sa.email
  
  depends_on = [module.cloud_run]
}

# 7. CLOUD BUILD
module "cloud_build" {
  source = "./modules/cloud_build"

  project_id        = var.project_id
  region            = var.region
  services          = var.services
  github_repo_owner = var.github_owner
  github_repo_name  = var.backend_repo_name
  artifact_registry = module.artifact_registry.repository_name
}

# 8. FIREBASE
module "firebase" {
  source = "./modules/firebase"

  project_id   = var.project_id
  region       = var.region
  app_name     = var.app_name
  github_owner       = var.github_owner
  frontend_repo_name = var.frontend_repo_name
  api_gateway_url    = module.api_gateway.api_gateway_url
  
  depends_on = [module.api_gateway]
}