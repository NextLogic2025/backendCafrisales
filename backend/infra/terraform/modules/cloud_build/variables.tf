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

variable "github_repo_owner" {
  description = "Owner del repositorio GitHub (Usuario u Organización)"
  type        = string
}

variable "github_repo_name" {
  description = "Nombre del repositorio GitHub"
  type        = string
}

variable "artifact_registry" {
  description = "Nombre (ID) del repositorio de Artifact Registry donde se guardarán las imágenes"
  type        = string
}