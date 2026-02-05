# backend/infra/terraform/modules/cloud_run/main.tf

# MAPEO DE NOMBRES DE BASE DE DATOS (inglés -> español)
locals {
  db_name_map = {
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

  # Map de variables de comunicacion entre servicios (env -> servicio destino)
  # Nota: para evitar dependencias ciclicas, las variables se actualizan via null_resource
  # excepto la requerida por auth-service.
  service_url_envs = {
    "auth-service" = {
      "USUARIOS_SERVICE_URL" = "user-service"
    }
    "user-service" = {
      "AUTH_SERVICE_URL" = "auth-service"
    }
    "catalog-service" = {
      "AUTH_URL"     = "auth-service"
      "USUARIOS_URL" = "user-service"
    }
    "order-service" = {
      "CATALOG_SERVICE_URL" = "catalog-service"
      "USER_SERVICE_URL"    = "user-service"
      "ZONE_SERVICE_URL"    = "zone-service"
    }
    "credit-service" = {
      "ORDER_SERVICE_URL" = "order-service"
      "USER_SERVICE_URL"  = "user-service"
    }
    "route-service" = {
      "ORDER_SERVICE_URL"   = "order-service"
      "USER_SERVICE_URL"    = "user-service"
      "ZONE_SERVICE_URL"    = "zone-service"
      "DELIVERY_SERVICE_URL" = "delivery-service"
    }
    "delivery-service" = {
      "ORDER_SERVICE_URL" = "order-service"
      "ROUTE_SERVICE_URL" = "route-service"
      "USER_SERVICE_URL"  = "user-service"
    }
    "notification-service" = {
      "USER_SERVICE_URL" = "user-service"
    }
  }
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

# Permitir que notification-service lea el password de order-service
resource "google_secret_manager_secret_iam_member" "order_db_pass_access_for_notifications" {
  count = contains(var.services, "notification-service") && contains(var.services, "order-service") ? 1 : 0
  secret_id = var.db_password_secret_ids["order-service"]
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.sa["notification-service"].email}"
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
    google_secret_manager_secret_iam_member.jwt_secret_access,
    google_secret_manager_secret_iam_member.order_db_pass_access_for_notifications
  ]

  template {
    service_account = google_service_account.sa[each.key].email

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    # --- CAMBIO CRÍTICO: Direct VPC Egress ---
    vpc_access {
      network_interfaces {
        network    = var.vpc_name
        subnetwork = var.subnet_name
      }
      egress = "PRIVATE_RANGES_ONLY"
    }

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

      # USUARIOS_SERVICE_URL es requerido por auth-service al arrancar.
      # Usamos un placeholder valido para evitar ciclos y luego lo actualizamos via null_resource.
      dynamic "env" {
        for_each = each.key == "auth-service" ? {
          "USUARIOS_SERVICE_URL" = "http://placeholder.local"
        } : {}
        content {
          name  = env.key
          value = env.value
        }
      }
      
      # Nombre de BD usando el mapeo español
      env {
        name  = "DB_NAME"
        value = local.db_name_map[each.key]
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
      env {
        name = "SERVICE_TOKEN"
        value_source {
          secret_key_ref {
            secret  = var.jwt_secret_id
            version = "latest"
          }
        }
      }

      # ORDER_DB_* solo para notification-service (consume outbox de order-service)
      dynamic "env" {
        for_each = each.key == "notification-service" ? {
          "ORDER_DB_HOST" = var.cloudsql_private_ip
          "ORDER_DB_PORT" = "5432"
          "ORDER_DB_NAME" = "cafrilosa_pedidos"
          "ORDER_DB_USER" = "order_user"
        } : {}
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = each.key == "notification-service" ? {
          "ORDER_DB_PASSWORD" = "secret"
        } : {}
        content {
          name = "ORDER_DB_PASSWORD"
          value_source {
            secret_key_ref {
              secret  = var.db_password_secret_ids["order-service"]
              version = "latest"
            }
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

# 3.1 ACTUALIZAR VARIABLES DE COMUNICACION ENTRE SERVICIOS (POST-CREACION)
resource "null_resource" "service_url_env_update" {
  for_each = {
    for svc, envs in local.service_url_envs : svc => envs
    if contains(var.services, svc)
  }

  triggers = merge(
    {
      service_id = google_cloud_run_v2_service.default[each.key].id
    },
    {
      for env_name, target_svc in each.value :
      env_name => target_svc
    }
  )

  provisioner "local-exec" {
    interpreter = ["PowerShell", "-NoProfile", "-Command"]
    command = <<-EOT
      $envs = @()
      ${join("\n", [
        for env_name, target_svc in each.value :
        "$url = (gcloud run services describe ${target_svc} --region=${var.region} --project=${var.project_id} --format='value(status.url)'); $envs += '${env_name}=' + $url"
      ])}
      gcloud run services update ${each.key} --region=${var.region} --project=${var.project_id} --update-env-vars ($envs -join ",")
    EOT
  }

  depends_on = [
    google_cloud_run_v2_service.default
  ]
}

# 4. SEGURIDAD INVOKER (Gateway)
resource "google_cloud_run_service_iam_member" "invoker" {
  for_each = toset(var.services)
  service  = google_cloud_run_v2_service.default[each.key].name
  location = google_cloud_run_v2_service.default[each.key].location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${var.gateway_sa_email}"
}

# 4.1 PERMITIR INVOCACIONES PÚBLICAS (necesario para S2S sin IAM token)
resource "google_cloud_run_service_iam_member" "public_invoker" {
  for_each = toset(var.services)
  service  = google_cloud_run_v2_service.default[each.key].name
  location = google_cloud_run_v2_service.default[each.key].location
  role     = "roles/run.invoker"
  member   = "allUsers"
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
