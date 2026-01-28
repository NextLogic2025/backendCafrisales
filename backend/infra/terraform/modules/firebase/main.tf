# ============================================================
# 1. HABILITAR SERVICIOS NECESARIOS
# ============================================================
resource "google_project_service" "firebase_services" {
  for_each = toset([
    "firebase.googleapis.com",
    "firebasehosting.googleapis.com",
    "serviceusage.googleapis.com"
  ])
  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}

# ============================================================
# 2. CONFIGURACIÓN DEL PROYECTO FIREBASE
# ============================================================
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id
  
  depends_on = [google_project_service.firebase_services]
}

# Registra la App Web (Esto genera el appId necesario para analytics, etc)
resource "google_firebase_web_app" "default" {
  provider     = google-beta
  project      = var.project_id
  display_name = "${var.app_name}-web"

  depends_on   = [google_firebase_project.default]
}

# ============================================================
# 3. TRIGGER DE CI/CD (FRONTEND)
# ============================================================
resource "google_cloudbuild_trigger" "frontend_trigger" {
  name        = "frontend-deploy-trigger"
  description = "Despliegue automático del Frontend a Firebase Hosting"
  location    = var.region
  project     = var.project_id

  github {
    owner = var.github_owner
    name  = var.frontend_repo_name
    
    # Se dispara al hacer push a la rama main
    push {
      branch = "^main$"
    }
  }

  # Terraform buscará este archivo en la raíz del repo frontendCafrisales
  filename = "cloudbuild.yaml"

  # --- LA MAGIA: Inyección de Variables ---
  # Aquí pasamos la URL del Gateway creada por Terraform al proceso de Build de React
  substitutions = {
    _VITE_API_URL = "https://${var.api_gateway_url}" 
  }
}

# ============================================================
# 4. PERMISOS (Cloud Build -> Firebase)
# ============================================================
# Le damos permiso al Cloud Build por defecto para desplegar en Firebase Hosting
data "google_project" "project" {}

resource "google_project_iam_member" "cloudbuild_firebase_admin" {
  project = var.project_id
  role    = "roles/firebasehosting.admin"
  member  = "serviceAccount:${data.google_project.project.number}@cloudbuild.gserviceaccount.com"
}

resource "google_project_iam_member" "cloudbuild_service_agent" {
  project = var.project_id
  role    = "roles/firebase.admin" # Necesario para configuraciones avanzadas
  member  = "serviceAccount:${data.google_project.project.number}@cloudbuild.gserviceaccount.com"
}