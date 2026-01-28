variable "project_id" {
  description = "ID del proyecto en GCP"
  type        = string
}

variable "region" {
  description = "Región de GCP"
  type        = string
}

variable "services" {
  description = "Lista de nombres de microservicios"
  type        = list(string)
}

variable "backend_urls" {
  description = "Mapa de URLs de los servicios Cloud Run (Input clave)"
  type        = map(string)
}

variable "api_id" {
  description = "ID del API Gateway"
  type        = string
  default     = "cafrisales-gateway"
}

variable "gateway_sa_email" {
  description = "Email del Service Account que usará el Gateway (creado en root)"
  type        = string
}