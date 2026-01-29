# backend/infra/terraform/modules/networking/outputs.tf

# Este lo usa el módulo de base de datos
output "vpc_id" {
  value = google_compute_network.vpc.id
}

# --- NUEVOS (Necesarios para Cloud Run Direct VPC) ---
output "vpc_name" {
  value = google_compute_network.vpc.name
}

output "app_subnet_name" {
  value = google_compute_subnetwork.app_subnet.name
}
# -----------------------------------------------------

output "vpc_self_link" {
  value = google_compute_network.vpc.self_link
}

output "subnet_id" {
  value = google_compute_subnetwork.app_subnet.id
}

output "cloudsql_private_ip_address" {
   # Si lo necesitas para debug, la IP reservada
   value = google_compute_global_address.private_ip_alloc.address
}