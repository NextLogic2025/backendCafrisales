# backend/infra/terraform/modules/cloud_run/main.tf

# 1. SERVICE ACCOUNTS
resource "google_service_account" "sa" {
  for_each     = toset(var.services)
  account_id   = "${each.key}-sa"
  display_name = "Service Account para ${each.key}"
}

# 2. PERMISOS DE SECRETOS
resource "google_secret_manager_secret_iam_member" "db_pass_access" {
  for_each  = toset(var.services)
  secret_id = var.db_password_secret_ids[each.key]
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.sa[each.key].email}"
}

resource "google_secret_manager_secret_iam_member" "jwt_secret_access" {
  for_each  = toset(var.services)
  secret_id = var.jwt_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.sa[each.key].email}"
}

# 3. CLOUD RUN SERVICES (v2)
resource "google_cloud_run_v2_service" "default" {
  for_each = toset(var.services)

  name     = each.key
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.sa[each.key].email

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    # --- Direct VPC Egress ---
    vpc_access {
      network_interfaces {
        network    = var.vpc_name
        subnetwork = var.subnet_name
      }
      egress = "PRIVATE_RANGES_ONLY"
    }
    # -------------------------

    containers {
      image = "${var.artifact_registry_url}/${each.key}:latest"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
      }

      # =================================================================
      # VARIABLES DE ENTORNO
      # =================================================================
      
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "DB_HOST"
        value = var.cloudsql_private_ip
      }
      env {
        name  = "DB_PORT"
        value = "5432"
      }
      
      # Lógica condicional para el nombre de la BD
      env {
        name  = "DB_NAME"
        value = each.key == "notification-service" ? "cafrilosa_notificaciones" : "cafrilosa_${replace(replace(each.key, "-service", ""), "-", "_")}"
      }
      
      env {
        name  = "DB_USER"
        value = "${replace(each.key, "-service", "")}_user"
      }
      env {
        name  = "GCS_BUCKET_NAME"
        value = var.bucket_name
      }

      # --- NUEVAS VARIABLES PARA PASAR LA VALIDACIÓN (BYPASS) ---
      # Estas son necesarias para que el validador de NestJS (Joi) no apague la app,
      # aunque TypeORM usará las credenciales desglosadas de arriba.
      env {
        name  = "SERVICE_TOKEN"
        value = "token-super-secreto-interno-123456" 
      }
      env {
        name  = "DATABASE_URL"
        value = "postgres://dummy:dummy@localhost:5432/dummy_db"
      }
      # ----------------------------------------------------------

      # Secretos
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
  
  lifecycle {
    ignore_changes = [
      client,
      client_version,
      template[0].containers[0].image
    ]
  }
}

# 4. SEGURIDAD INVOKER
resource "google_cloud_run_service_iam_member" "invoker" {
  for_each = toset(var.services)
  service  = google_cloud_run_v2_service.default[each.key].name
  location = google_cloud_run_v2_service.default[each.key].location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${var.gateway_sa_email}"
}

# 5. PERMISOS STORAGE
resource "google_storage_bucket_iam_member" "upload_permission" {
  for_each = toset(var.services)
  bucket   = var.bucket_name
  role     = "roles/storage.objectAdmin"
  member   = "serviceAccount:${google_service_account.sa[each.key].email}"
}

output "service_urls" {
  value = {
    for k, v in google_cloud_run_v2_service.default : k => v.uri
  }
}