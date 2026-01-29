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
  description = "URL base del repositorio de imágenes"
  type        = string
}

# --- CAMBIO: Variables para Direct VPC Egress ---
variable "vpc_name" {
  description = "Nombre de la VPC"
  type        = string
}

variable "subnet_name" {
  description = "Nombre de la Subred para salida directa"
  type        = string
}
# (Se eliminó vpc_connector_id)
# -----------------------------------------------

variable "cloudsql_private_ip" {
  description = "IP privada de la instancia Cloud SQL"
  type        = string
}

variable "cloudsql_connection" {
  description = "Nombre de conexión de la instancia"
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
  description = "Email de la cuenta de servicio del API Gateway"
  type        = string
}

variable "bucket_name" {
  description = "Nombre del bucket de almacenamiento"
  type        = string
}