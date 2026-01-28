variable "project_id" {
  description = "ID del proyecto en GCP"
  type        = string
}

variable "region" {
  description = "Región de GCP"
  type        = string
}

variable "app_name" {
  description = "Nombre de la aplicación para el ID del repo"
  type        = string
  default     = "cafrisales"
}