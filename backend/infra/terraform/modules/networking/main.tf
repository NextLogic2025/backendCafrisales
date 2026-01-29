# backend/infra/terraform/modules/networking/main.tf

# ============================================================
# VPC
# ============================================================
resource "google_compute_network" "vpc" {
  name                    = "${var.app_name}-vpc"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
  description             = "VPC privada para ${var.app_name}"
}

# ============================================================
# SUBNET 1: APP (Cloud Run lógica de negocio)
# ============================================================
resource "google_compute_subnetwork" "app_subnet" {
  name          = "${var.app_name}-app-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
  description   = "Subred para servicios de aplicación"

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5   
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# ============================================================
# SUBNET 2: CONECTOR (La Solución Híbrida)
# ============================================================
# Usamos Subnet explícita + Rango 192.168 para evitar conflictos previos
resource "google_compute_subnetwork" "connector_subnet" {
  name          = "${var.app_name}-connector-subnet"
  
  # CAMBIO CRÍTICO: Usamos 192.168.40.0 para salir de la zona de error 10.8.x.x
  ip_cidr_range = "192.168.40.0/28" 
  
  region        = var.region
  network       = google_compute_network.vpc.id
  description   = "Subred dedicada para Serverless VPC Access (Rango Limpio)"
}

# ============================================================
# VPC ACCESS CONNECTOR
# ============================================================
resource "google_vpc_access_connector" "cloud_run_connector" {
  name          = "cafrisales-vpc-conn-final"
  region        = var.region
  
  # Referenciamos la subnet que acabamos de definir con la IP limpia
  subnet {
    name = google_compute_subnetwork.connector_subnet.name
  }

  min_instances = 2
  max_instances = 10
  machine_type  = "e2-micro"

  depends_on = [google_compute_subnetwork.connector_subnet]
}

# ============================================================
# CLOUD NAT & ROUTER
# ============================================================
resource "google_compute_router" "router" {
  name    = "${var.app_name}-router"
  network = google_compute_network.vpc.id
  region  = var.region
  bgp {
    asn = 64514
  }
}

resource "google_compute_router_nat" "nat" {
  name                               = "${var.app_name}-nat"
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
  
  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
  depends_on = [google_compute_router.router]
}

# ============================================================
# PRIVATE SERVICE CONNECTION (Para Cloud SQL)
# ============================================================
resource "google_compute_global_address" "private_ip_alloc" {
  name          = "${var.app_name}-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_alloc.name]
  depends_on              = [google_compute_global_address.private_ip_alloc]
}

# ============================================================
# FIREWALL
# ============================================================
resource "google_compute_firewall" "allow_internal" {
  name    = "${var.app_name}-allow-internal"
  network = google_compute_network.vpc.name
  allow {
    protocol = "tcp"
  }
  source_ranges = ["10.0.0.0/8", "192.168.0.0/16"] # Permitimos ambos rangos internos
  target_tags   = ["${var.app_name}-internal"]
}

resource "google_compute_firewall" "deny_all" {
  name    = "${var.app_name}-deny-all"
  network = google_compute_network.vpc.name
  deny {
    protocol = "all"
  }
  priority      = 65534
  source_ranges = ["0.0.0.0/0"]
}

# ============================================================
# OUTPUTS
# ============================================================
output "vpc_id" { value = google_compute_network.vpc.id }
output "vpc_self_link" { value = google_compute_network.vpc.self_link }
output "subnet_id" { value = google_compute_subnetwork.app_subnet.id }
output "vpc_connector_id" { value = google_vpc_access_connector.cloud_run_connector.id }
output "vpc_connector_name" { value = google_vpc_access_connector.cloud_run_connector.name }