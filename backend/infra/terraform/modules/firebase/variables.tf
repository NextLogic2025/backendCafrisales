variable "project_id" {
  description = "ID del proyecto en GCP"
  type        = string
}

variable "region" {
  description = "Región para los recursos (Cloud Build)"
  type        = string
}

variable "app_name" {
  description = "Nombre de la aplicación"
  type        = string
  default     = "cafrisales"
}

# --- DATOS DEL REPOSITORIO FRONTEND ---
variable "github_owner" {
  description = "Usuario de GitHub (ej: NextLogic2025)"
  type        = string
}

variable "frontend_repo_name" {
  description = "Nombre del repositorio Frontend en GitHub"
  type        = string
  default     = "frontendCafrisales"
}

# --- CONEXIÓN CON EL BACKEND ---
variable "api_gateway_url" {
  description = "URL pública del API Gateway (se inyectará al build del frontend)"
  type        = string
}