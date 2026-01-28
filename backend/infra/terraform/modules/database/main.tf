# backend/infra/terraform/modules/database/main.tf
# (NOTA: Ya no hay bloques "variable" aquí, están en variables.tf)

# 1. La Instancia Física (El servidor)
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

# 3. Bases de Datos Lógicas
resource "google_sql_database" "databases" {
  for_each = toset(var.services)
  name     = "cafrilosa_${replace(replace(each.key, "-service", ""), "-", "_")}"
  instance = google_sql_database_instance.master.name
}

# 4. Usuarios por Servicio
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
  # Este output era necesario para el error anterior, pero como
  # ahora los secretos los maneja el módulo 'secrets', esto podría quedar vacío 
  # o eliminarse si no lo usas dentro de este módulo específico.
  # Para evitar errores, lo dejamos comentado o devolvemos un mapa vacío por ahora.
  value = {} 
}