variable "project_id" {
  description = "ID del proyecto en GCP"
  type        = string
}

variable "region" {
  description = "Región de GCP"
  type        = string
}

variable "vpc_id" {
  description = "ID de la VPC (Red Privada) donde vivirá la BD"
  type        = string
}

variable "services" {
  description = "Lista de nombres de microservicios"
  type        = list(string)
}

# --- Credenciales (Vienen del módulo secrets) ---
variable "service_passwords" {
  description = "Mapa de contraseñas para los usuarios de cada servicio"
  type        = map(string)
  sensitive   = true
}

variable "root_password" {
  description = "Contraseña para el usuario administrador"
  type        = string
  sensitive   = true
}

# --- Configuración Avanzada (Vienen del terraform.tfvars global) ---
variable "database_version" {
  description = "Versión de PostgreSQL (ej. POSTGRES_17)"
  type        = string
}

variable "machine_type" {
  description = "Tipo de instancia (ej. db-f1-micro)"
  type        = string
}

variable "deletion_protection" {
  description = "Protección contra borrado accidental"
  type        = bool
}

variable "backup_retention_days" {
  description = "Días de retención de backups"
  type        = number
}

variable "db_admin_user" {
  description = "Nombre del usuario administrador (ej. postgres)"
  type        = string
}

variable "app_name" {
  description = "Nombre de la aplicación para etiquetas"
  type        = string
  default     = "cafrisales"
}