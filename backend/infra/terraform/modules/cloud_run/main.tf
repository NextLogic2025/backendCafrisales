# backend/infra/terraform/modules/cloud_run/main.tf

# ============================================================
# 1. SERVICE ACCOUNTS: Identidad propia para cada microservicio
# ============================================================
resource "google_service_account" "sa" {
  for_each = toset(var.services)

  account_id   = "${each.key}-sa"
  display_name = "Service Account para ${each.key}"
  description  = "Identidad de ejecución para el microservicio ${each.key}"
}

# ============================================================
# 2. PERMISOS DE SECRETOS (IAM)
# ============================================================

# A. Permiso para leer SU propia contraseña de base de datos
resource "google_secret_manager_secret_iam_member" "db_pass_access" {
  for_each = toset(var.services)

  secret_id = var.db_password_secret_ids[each.key]
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.sa[each.key].email}"
}

# B. Permiso para leer el JWT Secret (Compartido por todos)
resource "google_secret_manager_secret_iam_member" "jwt_secret_access" {
  for_each = toset(var.services)

  secret_id = var.jwt_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.sa[each.key].email}"
}

# ============================================================
# 3. CLOUD RUN SERVICES (v2)
# ============================================================
resource "google_cloud_run_v2_service" "default" {
  for_each = toset(var.services)

  name     = each.key
  location = var.region
  
  # CORRECCIÓN: Para Cloud Run v2 + API Gateway, usamos ALL.
  # La seguridad real la da el bloque IAM de abajo (solo permite al Gateway).
  ingress  = "INGRESS_TRAFFIC_ALL" 

  template {
    service_account = google_service_account.sa[each.key].email

    scaling {
      min_instance_count = 0 # Ahorro: Se apaga si no se usa
      max_instance_count = 3 # Límite: Evita facturas gigantes por tráfico loco
    }

    vpc_access {
      connector = var.vpc_connector_id
      egress    = "PRIVATE_RANGES_ONLY" # Sale a la VPC para la BD, a internet directo para el resto
    }

    containers {
      # Apunta a la imagen "latest". La primera vez fallará si no existe la imagen,
      # pero Cloud Build la creará después.
      image = "${var.artifact_registry_url}/${each.key}:latest"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1000m" # 1 vCPU
          memory = "512Mi" # 512 MB RAM (Suficiente para NestJS básico)
        }
      }

      # --- VARIABLES DE ENTORNO ---
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "PORT"
        value = "3000"
      }
      
      # Datos de Conexión a BD (Coinciden con modules/database/main.tf)
      env {
        name  = "DB_HOST"
        value = var.cloudsql_private_ip
      }
      env {
        name  = "DB_PORT"
        value = "5432"
      }
      env {
        name  = "DB_NAME" 
        # Lógica: user-service -> cafrilosa_user
        value = "cafrilosa_${replace(replace(each.key, "-service", ""), "-", "_")}"
      }
      env {
        name  = "DB_USER"
        # Lógica: user-service -> user_user
        value = "${replace(each.key, "-service", "")}_user"
      }
      
      # Secretos (Inyectados como variables de entorno)
      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = var.db_password_secret_ids[each.key]
            version = "latest"
          }
        }
      }
      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = var.jwt_secret_id
            version = "latest"
          }
        }
      }
    }
  }
  
  # Ignoramos cambios en anotaciones para que no se reinicie por metadatos de Google
  lifecycle {
    ignore_changes = [
      client,
      client_version,
      template[0].containers[0].image # Importante: Para que Terraform no revierta despliegues de Cloud Build
    ]
  }
}

# ============================================================
# 4. SEGURIDAD: Solo el Gateway puede invocar
# ============================================================
resource "google_cloud_run_service_iam_member" "invoker" {
  for_each = google_cloud_run_v2_service.default

  service  = each.value.name
  location = each.value.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${var.gateway_sa_email}"
}

# ============================================================
# OUTPUTS
# ============================================================
output "service_urls" {
  description = "Mapa de URLs de los servicios desplegados (para el Gateway)"
  value = {
    for k, v in google_cloud_run_v2_service.default : k => v.uri
  }
}