# backend/infra/terraform/modules/firebase/main.tf

# 1. SERVICIOS (DEJAR ESTO)
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

# 2. PROYECTO FIREBASE (DEJAR ESTO)
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id
  depends_on = [google_project_service.firebase_services]
}

resource "google_firebase_web_app" "default" {
  provider       = google-beta
  project        = var.project_id
  display_name   = "${var.app_name}-web"
  depends_on     = [google_firebase_project.default]
}

# 3. TRIGGER (!!! COMENTADO O BORRADO !!!)
# resource "google_cloudbuild_trigger" "frontend_trigger" { ... }

# 4. PERMISOS (DEJAR ESTO - IMPORTANTE)
data "google_project" "project" {}

resource "google_project_iam_member" "cloudbuild_firebase_admin" {
  project = var.project_id
  role    = "roles/firebasehosting.admin"
  member  = "serviceAccount:${data.google_project.project.number}@cloudbuild.gserviceaccount.com"
}

resource "google_project_iam_member" "cloudbuild_service_agent" {
  project = var.project_id
  role    = "roles/firebase.admin"
  member  = "serviceAccount:${data.google_project.project.number}@cloudbuild.gserviceaccount.com"
}