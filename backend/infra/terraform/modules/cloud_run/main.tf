# backend/infra/terraform/modules/cloud_run/main.tf

# Data source para obtener información del proyecto
data "google_project" "project" {
  project_id = var.project_id
}

# 1. SERVICE ACCOUNTS
resource "google_service_account" "sa" {
  for_each = toset(var.services)
  account_id   = "${each.key}-sa"
  display_name = "Service Account para ${each.key}"
}

# 2. PERMISOS DE SECRETOS
resource "google_secret_manager_secret_iam_member" "db_pass_access" {
  for_each = toset(var.services)
  secret_id = var.db_password_secret_ids[each.key]
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.sa[each.key].email}"
}

resource "google_secret_manager_secret_iam_member" "jwt_secret_access" {
  for_each = toset(var.services)
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

  # DEPENDENCIA CRÍTICA: Esperar a que los permisos IAM estén listos
  depends_on = [
    google_secret_manager_secret_iam_member.db_pass_access,
    google_secret_manager_secret_iam_member.jwt_secret_access
  ]

  template {
    service_account = google_service_account.sa[each.key].email

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    # --- CAMBIO CRÍTICO: Direct VPC Egress ---
    # Esto reemplaza al conector y evita el Error 13
    vpc_access {
      network_interfaces {
        network    = var.vpc_name
        subnetwork = var.subnet_name
      }
      egress = "PRIVATE_RANGES_ONLY"
    }
    # -----------------------------------------

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

      # Healthcheck permisivo para NestJS (da tiempo para conectar a BD)
      startup_probe {
        tcp_socket {
          port = 3000
        }
        initial_delay_seconds = 30
        period_seconds        = 10
        failure_threshold     = 10
        timeout_seconds       = 5
      }

      # VARIABLES DE ENTORNO
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
      
      # Mapeo de bases de datos
      env {
        name  = "DB_NAME" 
        value = lookup({
          "auth-service"         = "cafrilosa_auth"
          "user-service"         = "cafrilosa_usuarios"
          "catalog-service"      = "cafrilosa_catalogo"
          "order-service"        = "cafrilosa_pedidos"
          "zone-service"         = "cafrilosa_zonas"
          "credit-service"       = "cafrilosa_creditos"
          "route-service"        = "cafrilosa_rutas"
          "delivery-service"     = "cafrilosa_entregas"
          "notification-service" = "cafrilosa_notificaciones"
        }, each.key, "cafrilosa_${replace(each.key, "-service", "")}")
      }
      
      env {
        name  = "DB_USER"
        value = "${replace(each.key, "-service", "")}_user"
      }
      env {
        name  = "GCS_BUCKET_NAME"
        value = var.bucket_name
      }
      env {
        name  = "CORS_ORIGIN"
        value = var.cors_origin
      }

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

      # SERVICE_TOKEN para autenticación entre servicios (S2S)
      # Esto asegura que use el Secreto guardado y no falle por string literal
      env {
        name = "SERVICE_TOKEN"
        value_source {
          secret_key_ref {
            secret  = var.jwt_secret_id
            version = "latest"
          }
        }
      }

      # --- CORRECCIÓN DE URLs PARA CLOUD RUN ---
      # Usamos el hash real '6i2z4tjbba' y la región 'ue' (us-east1) detectados en tus logs.
      # Esto conecta los servicios correctamente.

      env {
        name  = "USER_SERVICE_URL"
        value = "https://user-service-6i2z4tjbba-ue.a.run.app"
      }
      env {
        name  = "USUARIOS_SERVICE_URL"
        value = "https://user-service-6i2z4tjbba-ue.a.run.app"
      }
      env {
        name  = "USUARIOS_URL"
        value = "https://user-service-6i2z4tjbba-ue.a.run.app"
      }
      env {
        name  = "AUTH_SERVICE_URL"
        value = "https://auth-service-6i2z4tjbba-ue.a.run.app"
      }
      env {
        name  = "AUTH_URL"
        value = "https://auth-service-6i2z4tjbba-ue.a.run.app"
      }
      env {
        name  = "ORDER_SERVICE_URL"
        value = "https://order-service-6i2z4tjbba-ue.a.run.app"
      }
      env {
        name  = "CATALOG_SERVICE_URL"
        value = "https://catalog-service-6i2z4tjbba-ue.a.run.app"
      }
      env {
        name  = "ZONE_SERVICE_URL"
        value = "https://zone-service-6i2z4tjbba-ue.a.run.app"
      }
      env {
        name  = "ZONAS_URL"
        value = "https://zone-service-6i2z4tjbba-ue.a.run.app"
      }
      env {
        name  = "CREDIT_SERVICE_URL"
        value = "https://credit-service-6i2z4tjbba-ue.a.run.app"
      }
      env {
        name  = "DELIVERY_SERVICE_URL"
        value = "https://delivery-service-6i2z4tjbba-ue.a.run.app"
      }
      env {
        name  = "ROUTE_SERVICE_URL"
        value = "https://route-service-6i2z4tjbba-ue.a.run.app"
      }
      env {
        name  = "NOTIFICATION_SERVICE_URL"
        value = "https://notification-service-6i2z4tjbba-ue.a.run.app"
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
  bucket = var.bucket_name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.sa[each.key].email}"
}

output "service_urls" {
  value = {
    for k, v in google_cloud_run_v2_service.default : k => v.uri
  }
}