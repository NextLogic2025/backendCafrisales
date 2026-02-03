# backend/infra/terraform/modules/database/main.tf

# --- DICCIONARIO DE NOMBRES DE BASES DE DATOS (Inglés -> Español) ---
# Esto asegura que Terraform cree las bases con el nombre exacto que usan tus SQLs.
locals {
  db_names = {
    "auth-service"         = "cafrilosa_auth"
    "user-service"         = "cafrilosa_usuarios"
    "catalog-service"      = "cafrilosa_catalogo"
    "order-service"        = "cafrilosa_pedidos"
    "zone-service"         = "cafrilosa_zonas"
    "credit-service"       = "cafrilosa_creditos"
    "route-service"        = "cafrilosa_rutas"
    "delivery-service"     = "cafrilosa_entregas"
    "notification-service" = "cafrilosa_notificaciones"
  }
}

# 1. La Instancia Física
resource "google_sql_database_instance" "master" {
  name             = "cafrilosa-db-master"
  region           = var.region
  database_version = var.database_version
  deletion_protection = var.deletion_protection

  settings {
    tier = var.machine_type
    
    ip_configuration {
      ipv4_enabled    = false
      private_network = var.vpc_id
    }

    backup_configuration {
      enabled                        = true
      transaction_log_retention_days = var.backup_retention_days
    }
  }
}

# 2. Usuario Root
resource "google_sql_user" "root" {
  name     = var.db_admin_user
  instance = google_sql_database_instance.master.name
  password = var.root_password
}

# 3. Bases de Datos Lógicas (CORREGIDO CON MAPA)
resource "google_sql_database" "databases" {
  for_each = toset(var.services)

  # Usa el nombre del mapa si existe, si no, usa un fallback genérico
  name     = lookup(local.db_names, each.key, "cafrilosa_${replace(each.key, "-service", "")}")
  instance = google_sql_database_instance.master.name
}

# 4. Usuarios por Servicio
# NOTA: Los usuarios de servicio (ej. order_user) pueden seguir en inglés o español.
# Normalmente el usuario de la DB no afecta tanto, pero si quieres alinearlo, avísame.
# Por ahora lo dejamos estándar para no romper la conexión desde los microservicios
# (a menos que tus microservicios también esperen usuarios en español).
resource "google_sql_user" "users" {
  for_each = toset(var.services)
  name     = "${replace(each.key, "-service", "")}_user"
  instance = google_sql_database_instance.master.name
  password = var.service_passwords[each.key]
}

# --- OUTPUTS ---

output "cloudsql_connection_name" {
  value = google_sql_database_instance.master.connection_name
}

output "cloudsql_private_ip" {
  value = google_sql_database_instance.master.private_ip_address
}

output "service_password_secrets" {
  value = {} 
}