# modules/artifact_registry/main.tf

resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "${var.app_name}-repo" # Ej: cafrisales-repo
  description   = "Repositorio Docker para microservicios ${var.app_name}"
  format        = "DOCKER"
  project       = var.project_id

  # --- AHORRO DE COSTOS ---
  # Política de limpieza: Mantiene solo las últimas 5 versiones de cada imagen.
  cleanup_policies {
    id     = "keep-minimum-versions"
    action = "KEEP"
    most_recent_versions {
      keep_count = 5
    }
  }
}

# --- OUTPUTS ---
# Estos valores los necesitará el módulo Cloud Build y Cloud Run

output "repository_url" {
  description = "URL base del repositorio (ej: us-east1-docker.pkg.dev/...)"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}"
}

output "repository_name" {
  description = "Nombre del recurso (ID) del repositorio"
  value       = google_artifact_registry_repository.repo.repository_id
}