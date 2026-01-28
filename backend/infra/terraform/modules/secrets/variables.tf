variable "project_id" {
  description = "ID del proyecto en GCP"
  type        = string
}

variable "region" {
  description = "Región donde se replicarán los secretos"
  type        = string
}

variable "services" {
  description = "Lista de servicios para generar contraseñas de BD"
  type        = list(string)
}

variable "app_name" {
  description = "Prefijo para los nombres de los secretos"
  type        = string
  default     = "cafrisales"
}