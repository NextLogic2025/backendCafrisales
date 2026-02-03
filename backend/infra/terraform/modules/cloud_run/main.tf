# backend/infra/terraform/modules/cloud_run/main.tf

locals {
  db_names = {
    "auth-service"         = "cafrilosa_auth"
    "user-service"         = "cafrilosa_usuarios"
    "catalog-service"      = "cafrilosa_catalogo"
    "order-service"        = "cafrilosa_pedidos"
    "zone-service"         = "cafrilosa_zonas"
    "credit-service"       = "cafrilosa_creditos"
    "route-service"        = "cafrilosa_rutas"
    "delivery-service"     = "cafrilosa_entregas"
    "notification-service" = "cafrilosa_notificaciones"
  }
}

resource "google_service_account" "sa" {
  for_each     = toset(var.services)
  account_id   = "${each.key}-sa"
  display_name = "Service Account para ${each.key}"
}

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

resource "google_cloud_run_v2_service" "default" {
  for_each = setsubtract(toset(var.services), ["notification-service"])

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
    
    # Aumentamos el timeout de ejecución global por si acaso
    timeout = "300s"

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    vpc_access {
      network_interfaces {
        network    = var.vpc_name
        subnetwork = var.subnet_name
      }
      egress = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = "${var.artifact_registry_url}/${each.key}:latest"

      # Cloud Run inyectará la variable PORT=3000 automáticamente gracias a esto
      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      
      # NO definimos PORT manualmente aquí para evitar el error de "reserved env name".
      # Cloud Run lo pone solo.

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
        value = lookup(local.db_names, each.key, "cafrilosa_${replace(replace(each.key, "-service", ""), "-", "_")}")
      }
      
      env {
        name  = "DB_USERNAME"
        value = "${replace(each.key, "-service", "")}_user"
      }
      
      env {
        name  = "DB_Schema" 
        value = "app" 
      }

      env {
        name  = "GCP_BUCKET_NAME"
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
      
      # CORRECCIÓN VITAL: Healthcheck más permisivo
      # Le damos 60 segundos iniciales para arrancar (conectar a BD, migraciones, etc.)
      startup_probe {
        tcp_socket {
          port = 3000
        }
        initial_delay_seconds = 60  
        period_seconds        = 10
        failure_threshold     = 10
        timeout_seconds       = 5
      }
    }
  }
}

resource "google_cloud_run_service_iam_member" "invoker" {
  for_each = setsubtract(toset(var.services), ["notification-service"])
  
  service  = google_cloud_run_v2_service.default[each.key].name
  location = google_cloud_run_v2_service.default[each.key].location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${var.gateway_sa_email}"
}

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