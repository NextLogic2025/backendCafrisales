variable "project_id" {
  description = "ID del proyecto en GCP"
  type        = string
}

variable "region" {
  description = "Región de GCP"
  type        = string
}

variable "services" {
  description = "Lista de nombres de los microservicios"
  type        = list(string)
}

variable "artifact_registry_url" {
  description = "URL base del repositorio de imágenes (sin el nombre de la imagen)"
  type        = string
}

variable "vpc_connector_id" {
  description = "ID del conector VPC para acceso a BD privada"
  type        = string
}

variable "cloudsql_private_ip" {
  description = "IP privada de la instancia Cloud SQL"
  type        = string
}

variable "cloudsql_connection" {
  description = "Nombre de conexión de la instancia (para referencia)"
  type        = string
}

# --- SECRETOS ---
variable "db_password_secret_ids" {
  description = "Mapa que vincula cada servicio con el ID de su secreto de BD"
  type        = map(string)
}

variable "jwt_secret_id" {
  description = "ID del recurso Secret Manager para el JWT Secret compartido"
  type        = string
}

variable "gateway_sa_email" {
  description = "Email de la cuenta de servicio del API Gateway (quien tiene permiso de invocar)"
  type        = string
}