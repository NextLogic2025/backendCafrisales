# backend/infra/terraform/outputs.tf

output "api_gateway_url" {
  description = "URL pública del API Gateway (Para poner en el .env del Frontend y Móvil)"
  value       = module.api_gateway.api_gateway_url
}

output "artifact_registry_repo" {
  description = "URL del repositorio de imágenes Docker"
  value       = module.artifact_registry.repository_url
}

output "vpc_connector_id" {
  description = "ID del conector VPC (Útil para depuración)"
  value       = module.networking.vpc_connector_id
}

output "cloud_sql_private_ip" {
  description = "IP Privada de la base de datos (Accesible solo desde la VPC)"
  value       = module.database.cloudsql_private_ip
}