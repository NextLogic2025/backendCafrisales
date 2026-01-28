# modules/api_gateway/main.tf

# 1. Definimos el contenido de OpenAPI en una variable local (en memoria)
# Esto evita errores de lectura de archivos que aún no existen
locals {
  openapi_content = templatefile("${path.module}/openapi.tpl", {
    auth_url     = var.backend_urls["auth-service"]
    user_url     = var.backend_urls["user-service"]
    catalog_url  = var.backend_urls["catalog-service"]
    order_url    = var.backend_urls["order-service"]
    zone_url     = var.backend_urls["zone-service"]
    credit_url   = var.backend_urls["credit-service"]
    route_url    = var.backend_urls["route-service"]
    delivery_url = var.backend_urls["delivery-service"]
  })
}

# 2. (Opcional) Guardamos el archivo solo para que tú lo puedas ver y debuggear
resource "local_file" "openapi_debug" {
  filename = "${path.module}/openapi_render.yaml"
  content  = local.openapi_content
}

# 3. Recurso API
resource "google_api_gateway_api" "api" {
  provider     = google-beta
  api_id       = var.api_id
  display_name = "Cafrisales API"
  project      = var.project_id
}

# 4. Configuración del API
resource "google_api_gateway_api_config" "config" {
  provider      = google-beta
  api           = google_api_gateway_api.api.api_id
  
  # Usamos el hash del contenido para forzar actualización si cambia la plantilla
  api_config_id = "cfg-${md5(local.openapi_content)}"
  display_name  = "Configuración Cafrisales ${substr(md5(local.openapi_content), 0, 7)}"

  gateway_config {
    backend_config {
      google_service_account = var.gateway_sa_email 
    }
  }

  openapi_documents {
    document {
      path     = "openapi.yaml"
      # CORRECCIÓN: Codificamos directamente la variable local, sin leer del disco
      contents = base64encode(local.openapi_content)
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# 5. El Gateway
resource "google_api_gateway_gateway" "gw" {
  provider     = google-beta
  api_config   = google_api_gateway_api_config.config.id
  gateway_id   = "${var.api_id}-gw"
  display_name = "Cafrisales Gateway"
  region       = var.region
  project      = var.project_id
}

# 6. Outputs
output "api_gateway_url" {
  value = google_api_gateway_gateway.gw.default_hostname
}