variable "project_id" {}
variable "region" {}
variable "app_name" {}

# 1. El Bucket (La cubeta)
resource "google_storage_bucket" "assets" {
  name          = "${var.project_id}-${var.app_name}-assets" # Nombre único global
  location      = var.region
  storage_class = "STANDARD"

  # Forzar acceso uniforme (mejor seguridad)
  uniform_bucket_level_access = true

  # Configuración de CORS (Vital para que tu Web pueda subir/ver fotos directamente si fuera necesario)
  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# 2. Hacerlo PÚBLICO (Para que se vean las fotos en la App)
# OJO: Esto hace que TODO lo que subas aquí sea visible por cualquiera que tenga el link.
resource "google_storage_bucket_iam_member" "public_rule" {
  bucket = google_storage_bucket.assets.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# --- OUTPUTS ---
output "bucket_name" {
  value = google_storage_bucket.assets.name
}