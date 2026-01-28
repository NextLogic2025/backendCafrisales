# ============================================================
# SERVICE ACCOUNT: Identidad para que Cloud Build tenga permisos
# ============================================================
resource "google_service_account" "cloud_build_sa" {
  account_id   = "cloud-build-sa"
  display_name = "Cloud Build Service Account"
  description  = "Cuenta de servicio para ejecutar los builds de CI/CD"
  project      = var.project_id
}

# ============================================================
# PERMISOS (IAM): Qué puede hacer el Builder
# ============================================================

# 1. Escribir logs en Cloud Logging
resource "google_project_iam_member" "logging_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cloud_build_sa.email}"
}

# 2. Subir imágenes a Artifact Registry (Writer)
resource "google_project_iam_member" "artifact_registry_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.cloud_build_sa.email}"
}

# 3. Desplegar en Cloud Run (Admin/Developer)
resource "google_project_iam_member" "run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.cloud_build_sa.email}"
}

# 4. Actuar como Service Account (Necesario para asignar identidad a Cloud Run)
resource "google_project_iam_member" "sa_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.cloud_build_sa.email}"
}

# ============================================================
# TRIGGERS: Un disparador por cada microservicio
# ============================================================

resource "google_cloudbuild_trigger" "service_triggers" {
  for_each = toset(var.services)

  name        = "${each.key}-trigger"
  description = "CI/CD Trigger para el servicio ${each.key}"
  location    = var.region
  
  # Usamos la cuenta de servicio segura creada arriba
  service_account = google_service_account.cloud_build_sa.id

  # Conexión con GitHub
  github {
    owner = var.github_repo_owner
    name  = var.github_repo_name
    
    # Se dispara al hacer push a la rama main
    push {
      branch = "^main$"
    }
  }

  # Configuración del archivo de construcción
  # Terraform buscará: backend/services/auth-service/cloudbuild.yaml
  filename = "backend/services/${each.key}/cloudbuild.yaml"

  # FILTROS: Solo disparar si cambia ESTE servicio
  included_files = [
    "backend/services/${each.key}/**",
    "backend/common/**" # Si cambias código compartido, redespliega todo
  ]

  # VARIABLES DE SUSTITUCIÓN (Se pasan al cloudbuild.yaml)
  substitutions = {
    _SERVICE_NAME      = each.key
    _REGION            = var.region
    _ARTIFACT_REGISTRY = var.artifact_registry
  }
  
  depends_on = [
    google_project_iam_member.artifact_registry_writer
  ]
}