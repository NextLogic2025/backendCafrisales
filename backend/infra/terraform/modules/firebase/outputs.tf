output "hosting_url" {
  description = "URL pública del sitio web (Firebase Hosting)"
  value       = "https://${var.project_id}.web.app"
}

output "web_app_id" {
  description = "ID de la aplicación web en Firebase"
  value       = google_firebase_web_app.default.app_id
}