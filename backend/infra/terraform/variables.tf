# backend/infra/terraform/variables.tf

variable "project_id" {
  description = "ID del proyecto en Google Cloud (ej: cafrilosa-prod)"
  type        = string
}

variable "region" {
  description = "Región principal para los recursos (ej: us-east1)"
  type        = string
  default     = "us-east1"
}

variable "github_owner" {
  description = "Nombre del usuario u organización en GitHub (ej: NextLogic2025)"
  type        = string
}


# Lista maestra de tus 8 microservicios
variable "services" {
  description = "Lista de carpetas de microservicios en backend/services/"
  type        = list(string)
  default     = [
    "auth-service",
    "user-service",
    "catalog-service",
    "order-service",
    "zone-service",
    "credit-service",
    "route-service",
    "delivery-service"
  ]
}

variable "app_name" {
  description = "Nombre base para etiquetar recursos (ej: cafrisales)"
  type        = string
  default     = "cafrisales"
}

variable "database_version" {
  description = "Versión del motor de base de datos (ej: POSTGRES_15, POSTGRES_17)"
  type        = string
  default     = "POSTGRES_17" # <--- Aquí definimos el default a 17
}

variable "db_tier" {
  description = "Tipo de instancia (ej: db-f1-micro, db-custom-1-3840)"
  type        = string
  default     = "db-f1-micro"
}

variable "deletion_protection" {
  description = "Evita que la base de datos se borre por accidente (True para Prod)"
  type        = bool
  default     = false
}

variable "backup_retention_days" {
  description = "Cuántos días guardar los backups automáticos"
  type        = number
  default     = 7
}

variable "db_admin_user" {
  description = "Nombre del usuario administrador de la BD"
  type        = string
  default     = "postgres"
}

variable "zone" {
  description = "Zona específica dentro de la región (ej: us-east1-b)"
  type        = string
  default     = "us-east1-b"
}

variable "frontend_repo_name" {
  description = "Nombre del repositorio del Frontend en GitHub"
  type        = string
  default     = "frontendCafrisales"
}

# Aprovecho para verificar que también tengas esta, ya que la usas en el módulo cloud_build:
variable "backend_repo_name" {
  description = "Nombre del repositorio del Backend en GitHub"
  type        = string
  default     = "backendCafrisales" # Asegúrate que coincida con tu repo real
}