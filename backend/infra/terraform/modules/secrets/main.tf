# backend/infra/terraform/modules/secrets/main.tf
# (NOTA: Sin bloques "variable" al inicio)

# 1. Generar contraseña para el usuario root (admin)
resource "random_password" "db_root_password" {
  length  = 16
  special = false
}

resource "google_secret_manager_secret" "db_root_pass" {
  secret_id = "db-root-password"
  project   = var.project_id
  
  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}

resource "google_secret_manager_secret_version" "db_root_pass_val" {
  secret      = google_secret_manager_secret.db_root_pass.id
  secret_data = random_password.db_root_password.result
}

# 2. Generar contraseñas para cada microservicio
resource "random_password" "service_db_passwords" {
  for_each = toset(var.services)
  length   = 16
  special  = false
}

# 3. Guardar las contraseñas en Secret Manager
resource "google_secret_manager_secret" "service_db_secrets" {
  for_each  = toset(var.services)
  secret_id = "${each.key}-db-password"
  project   = var.project_id
  
  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}

resource "google_secret_manager_secret_version" "service_db_secrets_val" {
  for_each    = toset(var.services)
  secret      = google_secret_manager_secret.service_db_secrets[each.key].id
  secret_data = random_password.service_db_passwords[each.key].result
}

# --- OUTPUTS ---

output "service_passwords" {
  value     = { for s in var.services : s => random_password.service_db_passwords[s].result }
  sensitive = true
}

output "root_password" {
  value     = random_password.db_root_password.result
  sensitive = true
}

output "service_secret_ids" {
  description = "Mapa de IDs de los secretos en Google Cloud"
  value       = { for k, v in google_secret_manager_secret.service_db_secrets : k => v.secret_id }
}