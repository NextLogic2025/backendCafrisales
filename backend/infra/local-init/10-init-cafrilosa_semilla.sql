-- =====================================================
-- SEED DATA - CAFRISALES
-- Script de datos de prueba coherentes para todos los microservicios
-- Simula flujos completos del negocio
-- =====================================================

-- =====================================================
-- 1) USUARIOS (cafrilosa_usuarios)
-- =====================================================
\c cafrilosa_usuarios

-- Obtener IDs de canales comerciales existentes
DO $$
DECLARE
  v_canal_mayorista_id uuid;
  v_canal_minorista_id uuid;
  v_canal_horeca_id uuid;
  
  -- IDs fijos para usuarios (referenciados en otros servicios)
  v_admin_id uuid := 'a1000000-0000-0000-0000-000000000001';
  v_supervisor_denis uuid := '0df6a2ea-248c-4138-bb37-2aeef0432df5'; -- Ya existe
  v_supervisor_maria uuid := 'a2000000-0000-0000-0000-000000000002';
  
  v_vendedor_carlos_id uuid := 'b1000000-0000-0000-0000-000000000001';
  v_vendedor_ana_id uuid := 'b2000000-0000-0000-0000-000000000002';
  v_vendedor_luis_id uuid := 'b3000000-0000-0000-0000-000000000003';
  
  v_bodeguero_juan_id uuid := 'c1000000-0000-0000-0000-000000000001';
  v_bodeguero_pedro_id uuid := 'c2000000-0000-0000-0000-000000000002';
  
  v_transportista_mario_id uuid := 'd1000000-0000-0000-0000-000000000001';
  v_transportista_jose_id uuid := 'd2000000-0000-0000-0000-000000000002';
  
  v_cliente_distribuidora_id uuid := 'e1000000-0000-0000-0000-000000000001';
  v_cliente_restaurante_id uuid := 'e2000000-0000-0000-0000-000000000002';
  v_cliente_supermercado_id uuid := 'e3000000-0000-0000-0000-000000000003';
  v_cliente_hotel_id uuid := 'e4000000-0000-0000-0000-000000000004';
  v_cliente_tienda_id uuid := 'e5000000-0000-0000-0000-000000000005';
  
  -- IDs de zonas (referenciados)
  v_zona_norte_id uuid := 'f1000000-0000-0000-0000-000000000001';
  v_zona_sur_id uuid := 'f2000000-0000-0000-0000-000000000002';
  v_zona_centro_id uuid := 'f3000000-0000-0000-0000-000000000003';
BEGIN
  -- Obtener canales
  SELECT id INTO v_canal_mayorista_id FROM app.canales_comerciales WHERE codigo = 'mayorista';
  SELECT id INTO v_canal_minorista_id FROM app.canales_comerciales WHERE codigo = 'minorista';
  SELECT id INTO v_canal_horeca_id FROM app.canales_comerciales WHERE codigo = 'horeca';

  -- ==========================================
  -- ADMIN
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.usuarios WHERE id = v_admin_id) THEN
    INSERT INTO app.usuarios (id, email, rol, estado) VALUES 
      (v_admin_id, 'admin@cafrilosa.com', 'admin', 'activo');
    INSERT INTO app.perfiles_usuario (usuario_id, nombres, apellidos, telefono) VALUES 
      (v_admin_id, 'Administrador', 'Sistema', '0991000001');
  END IF;

  -- ==========================================
  -- SUPERVISORA ADICIONAL
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.usuarios WHERE id = v_supervisor_maria) THEN
    INSERT INTO app.usuarios (id, email, rol, estado) VALUES 
      (v_supervisor_maria, 'maria.supervisora@cafrilosa.com', 'supervisor', 'activo');
    INSERT INTO app.perfiles_usuario (usuario_id, nombres, apellidos, telefono) VALUES 
      (v_supervisor_maria, 'María', 'Fernández', '0992000001');
    INSERT INTO app.supervisores (usuario_id, codigo_empleado) VALUES 
      (v_supervisor_maria, 'SUP-002');
  END IF;

  -- ==========================================
  -- VENDEDORES
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.usuarios WHERE id = v_vendedor_carlos_id) THEN
    INSERT INTO app.usuarios (id, email, rol, estado) VALUES 
      (v_vendedor_carlos_id, 'carlos.vendedor@cafrilosa.com', 'vendedor', 'activo');
    INSERT INTO app.perfiles_usuario (usuario_id, nombres, apellidos, telefono) VALUES 
      (v_vendedor_carlos_id, 'Carlos', 'Mendoza', '0993000001');
    INSERT INTO app.vendedores (usuario_id, codigo_empleado, supervisor_id, activo) VALUES 
      (v_vendedor_carlos_id, 'VEN-001', v_supervisor_denis, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM app.usuarios WHERE id = v_vendedor_ana_id) THEN
    INSERT INTO app.usuarios (id, email, rol, estado) VALUES 
      (v_vendedor_ana_id, 'ana.vendedora@cafrilosa.com', 'vendedor', 'activo');
    INSERT INTO app.perfiles_usuario (usuario_id, nombres, apellidos, telefono) VALUES 
      (v_vendedor_ana_id, 'Ana', 'López', '0993000002');
    INSERT INTO app.vendedores (usuario_id, codigo_empleado, supervisor_id, activo) VALUES 
      (v_vendedor_ana_id, 'VEN-002', v_supervisor_denis, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM app.usuarios WHERE id = v_vendedor_luis_id) THEN
    INSERT INTO app.usuarios (id, email, rol, estado) VALUES 
      (v_vendedor_luis_id, 'luis.vendedor@cafrilosa.com', 'vendedor', 'activo');
    INSERT INTO app.perfiles_usuario (usuario_id, nombres, apellidos, telefono) VALUES 
      (v_vendedor_luis_id, 'Luis', 'García', '0993000003');
    INSERT INTO app.vendedores (usuario_id, codigo_empleado, supervisor_id, activo) VALUES 
      (v_vendedor_luis_id, 'VEN-003', v_supervisor_maria, true);
  END IF;

  -- ==========================================
  -- BODEGUEROS
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.usuarios WHERE id = v_bodeguero_juan_id) THEN
    INSERT INTO app.usuarios (id, email, rol, estado) VALUES 
      (v_bodeguero_juan_id, 'juan.bodeguero@cafrilosa.com', 'bodeguero', 'activo');
    INSERT INTO app.perfiles_usuario (usuario_id, nombres, apellidos, telefono) VALUES 
      (v_bodeguero_juan_id, 'Juan', 'Pérez', '0994000001');
    INSERT INTO app.bodegueros (usuario_id, codigo_empleado) VALUES 
      (v_bodeguero_juan_id, 'BOD-001');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM app.usuarios WHERE id = v_bodeguero_pedro_id) THEN
    INSERT INTO app.usuarios (id, email, rol, estado) VALUES 
      (v_bodeguero_pedro_id, 'pedro.bodeguero@cafrilosa.com', 'bodeguero', 'activo');
    INSERT INTO app.perfiles_usuario (usuario_id, nombres, apellidos, telefono) VALUES 
      (v_bodeguero_pedro_id, 'Pedro', 'Ramírez', '0994000002');
    INSERT INTO app.bodegueros (usuario_id, codigo_empleado) VALUES 
      (v_bodeguero_pedro_id, 'BOD-002');
  END IF;

  -- ==========================================
  -- TRANSPORTISTAS
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.usuarios WHERE id = v_transportista_mario_id) THEN
    INSERT INTO app.usuarios (id, email, rol, estado) VALUES 
      (v_transportista_mario_id, 'mario.transportista@cafrilosa.com', 'transportista', 'activo');
    INSERT INTO app.perfiles_usuario (usuario_id, nombres, apellidos, telefono) VALUES 
      (v_transportista_mario_id, 'Mario', 'Castillo', '0995000001');
    INSERT INTO app.transportistas (usuario_id, codigo_empleado, numero_licencia, licencia_vence_en, activo) VALUES 
      (v_transportista_mario_id, 'TRA-001', 'LIC-2024-001', '2027-12-31', true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM app.usuarios WHERE id = v_transportista_jose_id) THEN
    INSERT INTO app.usuarios (id, email, rol, estado) VALUES 
      (v_transportista_jose_id, 'jose.transportista@cafrilosa.com', 'transportista', 'activo');
    INSERT INTO app.perfiles_usuario (usuario_id, nombres, apellidos, telefono) VALUES 
      (v_transportista_jose_id, 'José', 'Villanueva', '0995000002');
    INSERT INTO app.transportistas (usuario_id, codigo_empleado, numero_licencia, licencia_vence_en, activo) VALUES 
      (v_transportista_jose_id, 'TRA-002', 'LIC-2024-002', '2028-06-30', true);
  END IF;

  -- ==========================================
  -- CLIENTES
  -- ==========================================
  -- Cliente 1: Distribuidora Mayorista (Zona Norte)
  IF NOT EXISTS (SELECT 1 FROM app.usuarios WHERE id = v_cliente_distribuidora_id) THEN
    INSERT INTO app.usuarios (id, email, rol, estado) VALUES 
      (v_cliente_distribuidora_id, 'contacto@distribuidoranorte.com', 'cliente', 'activo');
    INSERT INTO app.perfiles_usuario (usuario_id, nombres, apellidos, telefono) VALUES 
      (v_cliente_distribuidora_id, 'Roberto', 'Distribuidora Norte', '0996000001');
    INSERT INTO app.clientes (usuario_id, canal_id, nombre_comercial, ruc, zona_id, direccion, latitud, longitud, vendedor_asignado_id) VALUES 
      (v_cliente_distribuidora_id, v_canal_mayorista_id, 'Distribuidora Norte S.A.', '1790001234001', v_zona_norte_id, 
       'Av. Principal 123, Sector Norte', -0.1807, -78.4678, v_vendedor_carlos_id);
    INSERT INTO app.condiciones_comerciales_cliente (cliente_id, permite_negociacion, porcentaje_descuento_max, requiere_aprobacion_supervisor) VALUES 
      (v_cliente_distribuidora_id, true, 15.00, false);
  END IF;

  -- Cliente 2: Restaurante HORECA (Zona Centro)
  IF NOT EXISTS (SELECT 1 FROM app.usuarios WHERE id = v_cliente_restaurante_id) THEN
    INSERT INTO app.usuarios (id, email, rol, estado) VALUES 
      (v_cliente_restaurante_id, 'pedidos@restaurantelacasa.com', 'cliente', 'activo');
    INSERT INTO app.perfiles_usuario (usuario_id, nombres, apellidos, telefono) VALUES 
      (v_cliente_restaurante_id, 'Carmen', 'Restaurante La Casa', '0996000002');
    INSERT INTO app.clientes (usuario_id, canal_id, nombre_comercial, ruc, zona_id, direccion, latitud, longitud, vendedor_asignado_id) VALUES 
      (v_cliente_restaurante_id, v_canal_horeca_id, 'Restaurante La Casa del Sabor', '1792345678001', v_zona_centro_id, 
       'Calle Gourmet 456, Centro Histórico', -0.2201, -78.5123, v_vendedor_ana_id);
    INSERT INTO app.condiciones_comerciales_cliente (cliente_id, permite_negociacion, porcentaje_descuento_max, requiere_aprobacion_supervisor) VALUES 
      (v_cliente_restaurante_id, true, 10.00, false);
  END IF;

  -- Cliente 3: Supermercado Minorista (Zona Sur)
  IF NOT EXISTS (SELECT 1 FROM app.usuarios WHERE id = v_cliente_supermercado_id) THEN
    INSERT INTO app.usuarios (id, email, rol, estado) VALUES 
      (v_cliente_supermercado_id, 'compras@supermercadosur.com', 'cliente', 'activo');
    INSERT INTO app.perfiles_usuario (usuario_id, nombres, apellidos, telefono) VALUES 
      (v_cliente_supermercado_id, 'Fernando', 'Supermercado Sur', '0996000003');
    INSERT INTO app.clientes (usuario_id, canal_id, nombre_comercial, ruc, zona_id, direccion, latitud, longitud, vendedor_asignado_id) VALUES 
      (v_cliente_supermercado_id, v_canal_minorista_id, 'Supermercado del Sur', '1798765432001', v_zona_sur_id, 
       'Av. del Sur 789, Sector Comercial', -0.2567, -78.5234, v_vendedor_luis_id);
    INSERT INTO app.condiciones_comerciales_cliente (cliente_id, permite_negociacion, porcentaje_descuento_max, requiere_aprobacion_supervisor) VALUES 
      (v_cliente_supermercado_id, false, 5.00, true);
  END IF;

  -- Cliente 4: Hotel HORECA (Zona Norte)
  IF NOT EXISTS (SELECT 1 FROM app.usuarios WHERE id = v_cliente_hotel_id) THEN
    INSERT INTO app.usuarios (id, email, rol, estado) VALUES 
      (v_cliente_hotel_id, 'cocina@hotelgranplaza.com', 'cliente', 'activo');
    INSERT INTO app.perfiles_usuario (usuario_id, nombres, apellidos, telefono) VALUES 
      (v_cliente_hotel_id, 'Patricia', 'Hotel Gran Plaza', '0996000004');
    INSERT INTO app.clientes (usuario_id, canal_id, nombre_comercial, ruc, zona_id, direccion, latitud, longitud, vendedor_asignado_id) VALUES 
      (v_cliente_hotel_id, v_canal_horeca_id, 'Hotel Gran Plaza', '1791122334001', v_zona_norte_id, 
       'Blvd. Hotelero 101, Zona Turística', -0.1756, -78.4812, v_vendedor_carlos_id);
    INSERT INTO app.condiciones_comerciales_cliente (cliente_id, permite_negociacion, porcentaje_descuento_max, requiere_aprobacion_supervisor) VALUES 
      (v_cliente_hotel_id, true, 12.00, false);
  END IF;

  -- Cliente 5: Tienda Minorista (Zona Centro)
  IF NOT EXISTS (SELECT 1 FROM app.usuarios WHERE id = v_cliente_tienda_id) THEN
    INSERT INTO app.usuarios (id, email, rol, estado) VALUES 
      (v_cliente_tienda_id, 'ventas@tiendadonpepe.com', 'cliente', 'activo');
    INSERT INTO app.perfiles_usuario (usuario_id, nombres, apellidos, telefono) VALUES 
      (v_cliente_tienda_id, 'José', 'Tienda Don Pepe', '0996000005');
    INSERT INTO app.clientes (usuario_id, canal_id, nombre_comercial, ruc, zona_id, direccion, latitud, longitud, vendedor_asignado_id) VALUES 
      (v_cliente_tienda_id, v_canal_minorista_id, 'Tienda Don Pepe', '1793344556001', v_zona_centro_id, 
       'Calle Comercio 222, Barrio Central', -0.2156, -78.5067, v_vendedor_ana_id);
    INSERT INTO app.condiciones_comerciales_cliente (cliente_id, permite_negociacion, porcentaje_descuento_max, requiere_aprobacion_supervisor) VALUES 
      (v_cliente_tienda_id, false, 5.00, false);
  END IF;

  RAISE NOTICE 'Usuarios seed completado';
END $$;


-- =====================================================
-- 2) CREDENCIALES AUTH (cafrilosa_auth)
-- =====================================================
\c cafrilosa_auth

DO $$
DECLARE
  v_admin_id uuid := 'a1000000-0000-0000-0000-000000000001';
  v_supervisor_maria uuid := 'a2000000-0000-0000-0000-000000000002';
  v_vendedor_carlos_id uuid := 'b1000000-0000-0000-0000-000000000001';
  v_vendedor_ana_id uuid := 'b2000000-0000-0000-0000-000000000002';
  v_vendedor_luis_id uuid := 'b3000000-0000-0000-0000-000000000003';
  v_bodeguero_juan_id uuid := 'c1000000-0000-0000-0000-000000000001';
  v_bodeguero_pedro_id uuid := 'c2000000-0000-0000-0000-000000000002';
  v_transportista_mario_id uuid := 'd1000000-0000-0000-0000-000000000001';
  v_transportista_jose_id uuid := 'd2000000-0000-0000-0000-000000000002';
  v_cliente_distribuidora_id uuid := 'e1000000-0000-0000-0000-000000000001';
  v_cliente_restaurante_id uuid := 'e2000000-0000-0000-0000-000000000002';
  v_cliente_supermercado_id uuid := 'e3000000-0000-0000-0000-000000000003';
  v_cliente_hotel_id uuid := 'e4000000-0000-0000-0000-000000000004';
  v_cliente_tienda_id uuid := 'e5000000-0000-0000-0000-000000000005';
BEGIN
  -- Contraseña por defecto para todos: Cafrisales2024*
  
  -- Admin
  IF NOT EXISTS (SELECT 1 FROM app.credenciales WHERE usuario_id = v_admin_id) THEN
    INSERT INTO app.credenciales (usuario_id, email, password_hash, password_alg, estado) VALUES 
      (v_admin_id, 'admin@cafrilosa.com', crypt('Cafrisales2024*', gen_salt('bf', 10)), 'bcrypt', 'activo');
  END IF;

  -- Supervisora María
  IF NOT EXISTS (SELECT 1 FROM app.credenciales WHERE usuario_id = v_supervisor_maria) THEN
    INSERT INTO app.credenciales (usuario_id, email, password_hash, password_alg, estado) VALUES 
      (v_supervisor_maria, 'maria.supervisora@cafrilosa.com', crypt('Cafrisales2024*', gen_salt('bf', 10)), 'bcrypt', 'activo');
  END IF;

  -- Vendedores
  IF NOT EXISTS (SELECT 1 FROM app.credenciales WHERE usuario_id = v_vendedor_carlos_id) THEN
    INSERT INTO app.credenciales (usuario_id, email, password_hash, password_alg, estado) VALUES 
      (v_vendedor_carlos_id, 'carlos.vendedor@cafrilosa.com', crypt('Cafrisales2024*', gen_salt('bf', 10)), 'bcrypt', 'activo');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM app.credenciales WHERE usuario_id = v_vendedor_ana_id) THEN
    INSERT INTO app.credenciales (usuario_id, email, password_hash, password_alg, estado) VALUES 
      (v_vendedor_ana_id, 'ana.vendedora@cafrilosa.com', crypt('Cafrisales2024*', gen_salt('bf', 10)), 'bcrypt', 'activo');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM app.credenciales WHERE usuario_id = v_vendedor_luis_id) THEN
    INSERT INTO app.credenciales (usuario_id, email, password_hash, password_alg, estado) VALUES 
      (v_vendedor_luis_id, 'luis.vendedor@cafrilosa.com', crypt('Cafrisales2024*', gen_salt('bf', 10)), 'bcrypt', 'activo');
  END IF;

  -- Bodegueros
  IF NOT EXISTS (SELECT 1 FROM app.credenciales WHERE usuario_id = v_bodeguero_juan_id) THEN
    INSERT INTO app.credenciales (usuario_id, email, password_hash, password_alg, estado) VALUES 
      (v_bodeguero_juan_id, 'juan.bodeguero@cafrilosa.com', crypt('Cafrisales2024*', gen_salt('bf', 10)), 'bcrypt', 'activo');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM app.credenciales WHERE usuario_id = v_bodeguero_pedro_id) THEN
    INSERT INTO app.credenciales (usuario_id, email, password_hash, password_alg, estado) VALUES 
      (v_bodeguero_pedro_id, 'pedro.bodeguero@cafrilosa.com', crypt('Cafrisales2024*', gen_salt('bf', 10)), 'bcrypt', 'activo');
  END IF;

  -- Transportistas
  IF NOT EXISTS (SELECT 1 FROM app.credenciales WHERE usuario_id = v_transportista_mario_id) THEN
    INSERT INTO app.credenciales (usuario_id, email, password_hash, password_alg, estado) VALUES 
      (v_transportista_mario_id, 'mario.transportista@cafrilosa.com', crypt('Cafrisales2024*', gen_salt('bf', 10)), 'bcrypt', 'activo');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM app.credenciales WHERE usuario_id = v_transportista_jose_id) THEN
    INSERT INTO app.credenciales (usuario_id, email, password_hash, password_alg, estado) VALUES 
      (v_transportista_jose_id, 'jose.transportista@cafrilosa.com', crypt('Cafrisales2024*', gen_salt('bf', 10)), 'bcrypt', 'activo');
  END IF;

  -- Clientes
  IF NOT EXISTS (SELECT 1 FROM app.credenciales WHERE usuario_id = v_cliente_distribuidora_id) THEN
    INSERT INTO app.credenciales (usuario_id, email, password_hash, password_alg, estado) VALUES 
      (v_cliente_distribuidora_id, 'contacto@distribuidoranorte.com', crypt('Cliente2024*', gen_salt('bf', 10)), 'bcrypt', 'activo');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM app.credenciales WHERE usuario_id = v_cliente_restaurante_id) THEN
    INSERT INTO app.credenciales (usuario_id, email, password_hash, password_alg, estado) VALUES 
      (v_cliente_restaurante_id, 'pedidos@restaurantelacasa.com', crypt('Cliente2024*', gen_salt('bf', 10)), 'bcrypt', 'activo');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM app.credenciales WHERE usuario_id = v_cliente_supermercado_id) THEN
    INSERT INTO app.credenciales (usuario_id, email, password_hash, password_alg, estado) VALUES 
      (v_cliente_supermercado_id, 'compras@supermercadosur.com', crypt('Cliente2024*', gen_salt('bf', 10)), 'bcrypt', 'activo');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM app.credenciales WHERE usuario_id = v_cliente_hotel_id) THEN
    INSERT INTO app.credenciales (usuario_id, email, password_hash, password_alg, estado) VALUES 
      (v_cliente_hotel_id, 'cocina@hotelgranplaza.com', crypt('Cliente2024*', gen_salt('bf', 10)), 'bcrypt', 'activo');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM app.credenciales WHERE usuario_id = v_cliente_tienda_id) THEN
    INSERT INTO app.credenciales (usuario_id, email, password_hash, password_alg, estado) VALUES 
      (v_cliente_tienda_id, 'ventas@tiendadonpepe.com', crypt('Cliente2024*', gen_salt('bf', 10)), 'bcrypt', 'activo');
  END IF;

  RAISE NOTICE 'Credenciales auth seed completado';
END $$;


-- =====================================================
-- 3) CATÁLOGO (cafrilosa_catalogo)
-- =====================================================
\c cafrilosa_catalogo

DO $$
DECLARE
  -- Categorías
  v_cat_cerdo_id uuid := '11000000-0000-0000-0000-000000000001';
  v_cat_res_id uuid := '11000000-0000-0000-0000-000000000002';
  v_cat_pollo_id uuid := '11000000-0000-0000-0000-000000000003';
  v_cat_embutidos_id uuid := '11000000-0000-0000-0000-000000000004';
  v_cat_mariscos_id uuid := '11000000-0000-0000-0000-000000000005';
  
  -- Productos
  v_prod_lomo_cerdo_id uuid := '12000000-0000-0000-0000-000000000001';
  v_prod_costilla_cerdo_id uuid := '12000000-0000-0000-0000-000000000002';
  v_prod_chuleta_cerdo_id uuid := '12000000-0000-0000-0000-000000000003';
  v_prod_lomo_res_id uuid := '12000000-0000-0000-0000-000000000004';
  v_prod_costilla_res_id uuid := '12000000-0000-0000-0000-000000000005';
  v_prod_pechuga_pollo_id uuid := '12000000-0000-0000-0000-000000000006';
  v_prod_muslo_pollo_id uuid := '12000000-0000-0000-0000-000000000007';
  v_prod_salchicha_id uuid := '12000000-0000-0000-0000-000000000008';
  v_prod_jamon_id uuid := '12000000-0000-0000-0000-000000000009';
  v_prod_camaron_id uuid := '12000000-0000-0000-0000-000000000010';
  
  -- SKUs
  v_sku_lomo_cerdo_1kg_id uuid := '13000000-0000-0000-0000-000000000001';
  v_sku_lomo_cerdo_5kg_id uuid := '13000000-0000-0000-0000-000000000002';
  v_sku_costilla_cerdo_2kg_id uuid := '13000000-0000-0000-0000-000000000003';
  v_sku_chuleta_cerdo_1kg_id uuid := '13000000-0000-0000-0000-000000000004';
  v_sku_lomo_res_1kg_id uuid := '13000000-0000-0000-0000-000000000005';
  v_sku_costilla_res_3kg_id uuid := '13000000-0000-0000-0000-000000000006';
  v_sku_pechuga_pollo_1kg_id uuid := '13000000-0000-0000-0000-000000000007';
  v_sku_muslo_pollo_2kg_id uuid := '13000000-0000-0000-0000-000000000008';
  v_sku_salchicha_500g_id uuid := '13000000-0000-0000-0000-000000000009';
  v_sku_jamon_1kg_id uuid := '13000000-0000-0000-0000-000000000010';
  v_sku_camaron_1kg_id uuid := '13000000-0000-0000-0000-000000000011';
  
BEGIN
  -- ==========================================
  -- CATEGORÍAS
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.categorias WHERE id = v_cat_cerdo_id) THEN
    INSERT INTO app.categorias (id, nombre, slug, descripcion, orden, activo) VALUES
      (v_cat_cerdo_id, 'Carne de Cerdo', 'carne-cerdo', 'Cortes frescos y procesados de cerdo', 1, true),
      (v_cat_res_id, 'Carne de Res', 'carne-res', 'Cortes premium de res', 2, true),
      (v_cat_pollo_id, 'Pollo', 'pollo', 'Pollo fresco en diferentes presentaciones', 3, true),
      (v_cat_embutidos_id, 'Embutidos', 'embutidos', 'Embutidos y productos procesados', 4, true),
      (v_cat_mariscos_id, 'Mariscos', 'mariscos', 'Mariscos y productos del mar', 5, true);
  END IF;

  -- ==========================================
  -- PRODUCTOS
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.productos WHERE id = v_prod_lomo_cerdo_id) THEN
    INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, activo) VALUES
      (v_prod_lomo_cerdo_id, v_cat_cerdo_id, 'Lomo de Cerdo', 'lomo-cerdo', 'Lomo de cerdo fresco, corte premium', true),
      (v_prod_costilla_cerdo_id, v_cat_cerdo_id, 'Costilla de Cerdo', 'costilla-cerdo', 'Costilla de cerdo para parrilla', true),
      (v_prod_chuleta_cerdo_id, v_cat_cerdo_id, 'Chuleta de Cerdo', 'chuleta-cerdo', 'Chuleta de cerdo con hueso', true),
      (v_prod_lomo_res_id, v_cat_res_id, 'Lomo de Res', 'lomo-res', 'Lomo fino de res, corte premium', true),
      (v_prod_costilla_res_id, v_cat_res_id, 'Costilla de Res', 'costilla-res', 'Costilla de res para BBQ', true),
      (v_prod_pechuga_pollo_id, v_cat_pollo_id, 'Pechuga de Pollo', 'pechuga-pollo', 'Pechuga de pollo sin hueso', true),
      (v_prod_muslo_pollo_id, v_cat_pollo_id, 'Muslo de Pollo', 'muslo-pollo', 'Muslo de pollo con piel', true),
      (v_prod_salchicha_id, v_cat_embutidos_id, 'Salchicha Alemana', 'salchicha-alemana', 'Salchicha tipo alemana', true),
      (v_prod_jamon_id, v_cat_embutidos_id, 'Jamón Ahumado', 'jamon-ahumado', 'Jamón de cerdo ahumado artesanal', true),
      (v_prod_camaron_id, v_cat_mariscos_id, 'Camarón Jumbo', 'camaron-jumbo', 'Camarón jumbo pelado y desvenado', true);
  END IF;

  -- ==========================================
  -- SKUs
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.skus WHERE id = v_sku_lomo_cerdo_1kg_id) THEN
    INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo) VALUES
      (v_sku_lomo_cerdo_1kg_id, v_prod_lomo_cerdo_id, 'CER-LOM-001-1KG', 'Lomo de Cerdo 1kg', 1000, 'Vacío', true, 1, true),
      (v_sku_lomo_cerdo_5kg_id, v_prod_lomo_cerdo_id, 'CER-LOM-001-5KG', 'Lomo de Cerdo 5kg', 5000, 'Caja', true, 1, true),
      (v_sku_costilla_cerdo_2kg_id, v_prod_costilla_cerdo_id, 'CER-COS-001-2KG', 'Costilla de Cerdo 2kg', 2000, 'Vacío', true, 1, true),
      (v_sku_chuleta_cerdo_1kg_id, v_prod_chuleta_cerdo_id, 'CER-CHU-001-1KG', 'Chuleta de Cerdo 1kg', 1000, 'Bandeja', true, 4, true),
      (v_sku_lomo_res_1kg_id, v_prod_lomo_res_id, 'RES-LOM-001-1KG', 'Lomo de Res 1kg', 1000, 'Vacío', true, 1, true),
      (v_sku_costilla_res_3kg_id, v_prod_costilla_res_id, 'RES-COS-001-3KG', 'Costilla de Res 3kg', 3000, 'Caja', true, 1, true),
      (v_sku_pechuga_pollo_1kg_id, v_prod_pechuga_pollo_id, 'POL-PEC-001-1KG', 'Pechuga de Pollo 1kg', 1000, 'Bandeja', true, 2, true),
      (v_sku_muslo_pollo_2kg_id, v_prod_muslo_pollo_id, 'POL-MUS-001-2KG', 'Muslo de Pollo 2kg', 2000, 'Bolsa', true, 8, true),
      (v_sku_salchicha_500g_id, v_prod_salchicha_id, 'EMB-SAL-001-500G', 'Salchicha Alemana 500g', 500, 'Vacío', true, 6, true),
      (v_sku_jamon_1kg_id, v_prod_jamon_id, 'EMB-JAM-001-1KG', 'Jamón Ahumado 1kg', 1000, 'Vacío', true, 1, true),
      (v_sku_camaron_1kg_id, v_prod_camaron_id, 'MAR-CAM-001-1KG', 'Camarón Jumbo 1kg', 1000, 'Bolsa Congelado', true, 1, true);
  END IF;

  -- ==========================================
  -- PRECIOS (vigente_hasta NULL = precio actual)
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.precios_sku WHERE sku_id = v_sku_lomo_cerdo_1kg_id AND vigente_hasta IS NULL) THEN
    INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta) VALUES
      (v_sku_lomo_cerdo_1kg_id, 8.50, 'USD', NOW(), NULL),
      (v_sku_lomo_cerdo_5kg_id, 38.00, 'USD', NOW(), NULL),
      (v_sku_costilla_cerdo_2kg_id, 12.00, 'USD', NOW(), NULL),
      (v_sku_chuleta_cerdo_1kg_id, 7.50, 'USD', NOW(), NULL),
      (v_sku_lomo_res_1kg_id, 14.00, 'USD', NOW(), NULL),
      (v_sku_costilla_res_3kg_id, 28.00, 'USD', NOW(), NULL),
      (v_sku_pechuga_pollo_1kg_id, 5.50, 'USD', NOW(), NULL),
      (v_sku_muslo_pollo_2kg_id, 7.00, 'USD', NOW(), NULL),
      (v_sku_salchicha_500g_id, 4.50, 'USD', NOW(), NULL),
      (v_sku_jamon_1kg_id, 9.00, 'USD', NOW(), NULL),
      (v_sku_camaron_1kg_id, 18.00, 'USD', NOW(), NULL);
  END IF;

  RAISE NOTICE 'Catálogo seed completado';
END $$;


-- =====================================================
-- 4) ZONAS (cafrilosa_zonas)
-- =====================================================
\c cafrilosa_zonas

DO $$
DECLARE
  v_zona_norte_id uuid := 'f1000000-0000-0000-0000-000000000001';
  v_zona_sur_id uuid := 'f2000000-0000-0000-0000-000000000002';
  v_zona_centro_id uuid := 'f3000000-0000-0000-0000-000000000003';
BEGIN
  -- ==========================================
  -- ZONAS
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.zonas WHERE id = v_zona_norte_id) THEN
    INSERT INTO app.zonas (id, codigo, nombre, descripcion, activo) VALUES
      (v_zona_norte_id, 'ZN-NORTE', 'Zona Norte', 'Sector norte de la ciudad, incluye zonas industriales y turísticas', true),
      (v_zona_sur_id, 'ZN-SUR', 'Zona Sur', 'Sector sur de la ciudad, zona comercial y residencial', true),
      (v_zona_centro_id, 'ZN-CENTRO', 'Zona Centro', 'Centro histórico y comercial de la ciudad', true);
  END IF;

  -- ==========================================
  -- HORARIOS POR ZONA (0=domingo, 1=lunes, ..., 6=sábado)
  -- ==========================================
  -- Zona Norte: entregas L-V, visitas L-S
  IF NOT EXISTS (SELECT 1 FROM app.horarios_zona WHERE zona_id = v_zona_norte_id) THEN
    INSERT INTO app.horarios_zona (zona_id, dia_semana, entregas_habilitadas, visitas_habilitadas) VALUES
      (v_zona_norte_id, 1, true, true),   -- Lunes
      (v_zona_norte_id, 2, true, true),   -- Martes
      (v_zona_norte_id, 3, true, true),   -- Miércoles
      (v_zona_norte_id, 4, true, true),   -- Jueves
      (v_zona_norte_id, 5, true, true),   -- Viernes
      (v_zona_norte_id, 6, false, true);  -- Sábado (solo visitas)
  END IF;

  -- Zona Sur: entregas L-S, visitas L-S
  IF NOT EXISTS (SELECT 1 FROM app.horarios_zona WHERE zona_id = v_zona_sur_id) THEN
    INSERT INTO app.horarios_zona (zona_id, dia_semana, entregas_habilitadas, visitas_habilitadas) VALUES
      (v_zona_sur_id, 1, true, true),
      (v_zona_sur_id, 2, true, true),
      (v_zona_sur_id, 3, true, true),
      (v_zona_sur_id, 4, true, true),
      (v_zona_sur_id, 5, true, true),
      (v_zona_sur_id, 6, true, true);
  END IF;

  -- Zona Centro: entregas L-V, visitas L-V
  IF NOT EXISTS (SELECT 1 FROM app.horarios_zona WHERE zona_id = v_zona_centro_id) THEN
    INSERT INTO app.horarios_zona (zona_id, dia_semana, entregas_habilitadas, visitas_habilitadas) VALUES
      (v_zona_centro_id, 1, true, true),
      (v_zona_centro_id, 2, true, true),
      (v_zona_centro_id, 3, true, true),
      (v_zona_centro_id, 4, true, true),
      (v_zona_centro_id, 5, true, true);
  END IF;

  RAISE NOTICE 'Zonas seed completado';
END $$;


-- =====================================================
-- 5) PEDIDOS (cafrilosa_pedidos)
-- Flujos simulados:
-- - Pedido 1: Completado exitosamente (validado, aceptado, entregado)
-- - Pedido 2: Con ajuste de bodega pendiente de aceptación cliente
-- - Pedido 3: Nuevo, pendiente validación bodega
-- - Pedido 4: En ruta
-- - Pedido 5: Crédito (completado)
-- =====================================================
\c cafrilosa_pedidos

DO $$
DECLARE
  -- Referencias a usuarios
  v_vendedor_carlos_id uuid := 'b1000000-0000-0000-0000-000000000001';
  v_vendedor_ana_id uuid := 'b2000000-0000-0000-0000-000000000002';
  v_bodeguero_juan_id uuid := 'c1000000-0000-0000-0000-000000000001';
  
  v_cliente_distribuidora_id uuid := 'e1000000-0000-0000-0000-000000000001';
  v_cliente_restaurante_id uuid := 'e2000000-0000-0000-0000-000000000002';
  v_cliente_supermercado_id uuid := 'e3000000-0000-0000-0000-000000000003';
  v_cliente_hotel_id uuid := 'e4000000-0000-0000-0000-000000000004';
  v_cliente_tienda_id uuid := 'e5000000-0000-0000-0000-000000000005';
  
  -- Zonas
  v_zona_norte_id uuid := 'f1000000-0000-0000-0000-000000000001';
  v_zona_sur_id uuid := 'f2000000-0000-0000-0000-000000000002';
  v_zona_centro_id uuid := 'f3000000-0000-0000-0000-000000000003';
  
  -- SKUs (del catálogo)
  v_sku_lomo_cerdo_1kg_id uuid := '13000000-0000-0000-0000-000000000001';
  v_sku_costilla_cerdo_2kg_id uuid := '13000000-0000-0000-0000-000000000003';
  v_sku_pechuga_pollo_1kg_id uuid := '13000000-0000-0000-0000-000000000007';
  v_sku_salchicha_500g_id uuid := '13000000-0000-0000-0000-000000000009';
  v_sku_camaron_1kg_id uuid := '13000000-0000-0000-0000-000000000011';
  v_sku_lomo_res_1kg_id uuid := '13000000-0000-0000-0000-000000000005';
  v_sku_jamon_1kg_id uuid := '13000000-0000-0000-0000-000000000010';
  
  -- Pedidos
  v_pedido_1_id uuid := '20000000-0000-0000-0000-000000000001';
  v_pedido_2_id uuid := '20000000-0000-0000-0000-000000000002';
  v_pedido_3_id uuid := '20000000-0000-0000-0000-000000000003';
  v_pedido_4_id uuid := '20000000-0000-0000-0000-000000000004';
  v_pedido_5_id uuid := '20000000-0000-0000-0000-000000000005';
  
  -- Items
  v_item_1_1_id uuid := '21000000-0000-0000-0000-000000000001';
  v_item_1_2_id uuid := '21000000-0000-0000-0000-000000000002';
  v_item_2_1_id uuid := '21000000-0000-0000-0000-000000000003';
  v_item_2_2_id uuid := '21000000-0000-0000-0000-000000000004';
  v_item_3_1_id uuid := '21000000-0000-0000-0000-000000000005';
  v_item_3_2_id uuid := '21000000-0000-0000-0000-000000000006';
  v_item_4_1_id uuid := '21000000-0000-0000-0000-000000000007';
  v_item_5_1_id uuid := '21000000-0000-0000-0000-000000000008';
  v_item_5_2_id uuid := '21000000-0000-0000-0000-000000000009';
  
  -- Validaciones
  v_validacion_1_id uuid := '22000000-0000-0000-0000-000000000001';
  v_validacion_2_id uuid := '22000000-0000-0000-0000-000000000002';
  v_validacion_4_id uuid := '22000000-0000-0000-0000-000000000004';
  v_validacion_5_id uuid := '22000000-0000-0000-0000-000000000005';
  
BEGIN
  -- ==========================================
  -- PEDIDO 1: Distribuidora Norte - ENTREGADO (flujo completo exitoso)
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.pedidos WHERE id = v_pedido_1_id) THEN
    INSERT INTO app.pedidos (id, numero_pedido, cliente_id, zona_id, creado_por_id, origen, estado, metodo_pago, subtotal, impuesto, total, notas, fecha_entrega_sugerida, creado_en) VALUES
      (v_pedido_1_id, 'PED-2026-00001', v_cliente_distribuidora_id, v_zona_norte_id, v_vendedor_carlos_id, 
       'vendedor', 'entregado', 'contado', 51.00, 6.12, 57.12, 'Pedido urgente para reposición', 
       CURRENT_DATE - INTERVAL '3 days', NOW() - INTERVAL '5 days');
    
    -- Items del pedido 1
    INSERT INTO app.items_pedido (id, pedido_id, sku_id, cantidad_solicitada, sku_nombre_snapshot, sku_codigo_snapshot, sku_peso_gramos_snapshot, sku_tipo_empaque_snapshot, precio_unitario_base, precio_origen, precio_unitario_final, subtotal) VALUES
      (v_item_1_1_id, v_pedido_1_id, v_sku_lomo_cerdo_1kg_id, 5, 'Lomo de Cerdo 1kg', 'CER-LOM-001-1KG', 1000, 'Vacío', 8.50, 'catalogo', 8.50, 42.50),
      (v_item_1_2_id, v_pedido_1_id, v_sku_salchicha_500g_id, 2, 'Salchicha Alemana 500g', 'EMB-SAL-001-500G', 500, 'Vacío', 4.50, 'catalogo', 4.25, 8.50);
    
    -- Validación bodega (aprobado sin cambios)
    INSERT INTO app.validaciones_bodega (id, pedido_id, numero_version, validado_por_id, validado_en, requiere_aceptacion_cliente, motivo_general) VALUES
      (v_validacion_1_id, v_pedido_1_id, 1, v_bodeguero_juan_id, NOW() - INTERVAL '4 days', false, 'Todo disponible');
    
    INSERT INTO app.items_validacion_bodega (validacion_id, item_pedido_id, estado_resultado, cantidad_aprobada, motivo) VALUES
      (v_validacion_1_id, v_item_1_1_id, 'aprobado', 5, 'Disponible en stock'),
      (v_validacion_1_id, v_item_1_2_id, 'aprobado', 2, 'Disponible en stock');
    
    -- Historial de estados
    INSERT INTO app.historial_estado_pedido (pedido_id, estado, cambiado_por_id, motivo, creado_en) VALUES
      (v_pedido_1_id, 'pendiente_validacion', v_vendedor_carlos_id, 'Pedido creado', NOW() - INTERVAL '5 days'),
      (v_pedido_1_id, 'validado', v_bodeguero_juan_id, 'Validación sin cambios', NOW() - INTERVAL '4 days'),
      (v_pedido_1_id, 'asignado_ruta', v_bodeguero_juan_id, 'Asignado a ruta logística', NOW() - INTERVAL '3 days'),
      (v_pedido_1_id, 'en_ruta', v_bodeguero_juan_id, 'Salió a reparto', NOW() - INTERVAL '3 days'),
      (v_pedido_1_id, 'entregado', v_bodeguero_juan_id, 'Entrega exitosa', NOW() - INTERVAL '3 days');
  END IF;

  -- ==========================================
  -- PEDIDO 2: Restaurante La Casa - AJUSTADO BODEGA (pendiente aceptación cliente)
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.pedidos WHERE id = v_pedido_2_id) THEN
    INSERT INTO app.pedidos (id, numero_pedido, cliente_id, zona_id, creado_por_id, origen, estado, metodo_pago, subtotal, impuesto, total, notas, fecha_entrega_sugerida, creado_en) VALUES
      (v_pedido_2_id, 'PED-2026-00002', v_cliente_restaurante_id, v_zona_centro_id, v_vendedor_ana_id, 
       'cliente', 'ajustado_bodega', 'contado', 90.00, 10.80, 100.80, 'Para evento especial del fin de semana', 
       CURRENT_DATE + INTERVAL '2 days', NOW() - INTERVAL '1 day');
    
    -- Items del pedido 2
    INSERT INTO app.items_pedido (id, pedido_id, sku_id, cantidad_solicitada, sku_nombre_snapshot, sku_codigo_snapshot, sku_peso_gramos_snapshot, sku_tipo_empaque_snapshot, precio_unitario_base, precio_origen, precio_unitario_final, subtotal) VALUES
      (v_item_2_1_id, v_pedido_2_id, v_sku_camaron_1kg_id, 3, 'Camarón Jumbo 1kg', 'MAR-CAM-001-1KG', 1000, 'Bolsa Congelado', 18.00, 'catalogo', 18.00, 54.00),
      (v_item_2_2_id, v_pedido_2_id, v_sku_lomo_res_1kg_id, 3, 'Lomo de Res 1kg', 'RES-LOM-001-1KG', 1000, 'Vacío', 14.00, 'negociado', 12.00, 36.00);
    
    -- Validación bodega (con ajuste parcial en camarones)
    INSERT INTO app.validaciones_bodega (id, pedido_id, numero_version, validado_por_id, validado_en, requiere_aceptacion_cliente, motivo_general) VALUES
      (v_validacion_2_id, v_pedido_2_id, 1, v_bodeguero_juan_id, NOW() - INTERVAL '4 hours', true, 'Stock insuficiente de camarón, se aprueba cantidad parcial');
    
    INSERT INTO app.items_validacion_bodega (validacion_id, item_pedido_id, estado_resultado, cantidad_aprobada, motivo) VALUES
      (v_validacion_2_id, v_item_2_1_id, 'aprobado_parcial', 2, 'Solo disponibles 2kg de camarón en stock'),
      (v_validacion_2_id, v_item_2_2_id, 'aprobado', 3, 'Disponible en stock');
    
    -- Historial
    INSERT INTO app.historial_estado_pedido (pedido_id, estado, cambiado_por_id, motivo, creado_en) VALUES
      (v_pedido_2_id, 'pendiente_validacion', v_cliente_restaurante_id, 'Pedido creado por cliente', NOW() - INTERVAL '1 day'),
      (v_pedido_2_id, 'ajustado_bodega', v_bodeguero_juan_id, 'Requiere aceptación por ajuste en cantidad', NOW() - INTERVAL '4 hours');
  END IF;

  -- ==========================================
  -- PEDIDO 3: Supermercado Sur - PENDIENTE VALIDACIÓN (nuevo)
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.pedidos WHERE id = v_pedido_3_id) THEN
    INSERT INTO app.pedidos (id, numero_pedido, cliente_id, zona_id, creado_por_id, origen, estado, metodo_pago, subtotal, impuesto, total, notas, fecha_entrega_sugerida, creado_en) VALUES
      (v_pedido_3_id, 'PED-2026-00003', v_cliente_supermercado_id, v_zona_sur_id, v_cliente_supermercado_id, 
       'cliente', 'pendiente_validacion', 'credito', 67.50, 8.10, 75.60, 'Pedido semanal regular', 
       CURRENT_DATE + INTERVAL '1 day', NOW() - INTERVAL '2 hours');
    
    -- Items
    INSERT INTO app.items_pedido (id, pedido_id, sku_id, cantidad_solicitada, sku_nombre_snapshot, sku_codigo_snapshot, sku_peso_gramos_snapshot, sku_tipo_empaque_snapshot, precio_unitario_base, precio_origen, precio_unitario_final, subtotal) VALUES
      (v_item_3_1_id, v_pedido_3_id, v_sku_pechuga_pollo_1kg_id, 10, 'Pechuga de Pollo 1kg', 'POL-PEC-001-1KG', 1000, 'Bandeja', 5.50, 'catalogo', 5.50, 55.00),
      (v_item_3_2_id, v_pedido_3_id, v_sku_costilla_cerdo_2kg_id, 1, 'Costilla de Cerdo 2kg', 'CER-COS-001-2KG', 2000, 'Vacío', 12.00, 'catalogo', 12.50, 12.50);
    
    -- Historial
    INSERT INTO app.historial_estado_pedido (pedido_id, estado, cambiado_por_id, motivo, creado_en) VALUES
      (v_pedido_3_id, 'pendiente_validacion', v_cliente_supermercado_id, 'Pedido creado por cliente', NOW() - INTERVAL '2 hours');
  END IF;

  -- ==========================================
  -- PEDIDO 4: Hotel Gran Plaza - EN RUTA
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.pedidos WHERE id = v_pedido_4_id) THEN
    INSERT INTO app.pedidos (id, numero_pedido, cliente_id, zona_id, creado_por_id, origen, estado, metodo_pago, subtotal, impuesto, total, notas, fecha_entrega_sugerida, creado_en) VALUES
      (v_pedido_4_id, 'PED-2026-00004', v_cliente_hotel_id, v_zona_norte_id, v_vendedor_carlos_id, 
       'vendedor', 'en_ruta', 'contado', 42.50, 5.10, 47.60, 'Entrega antes del mediodía', 
       CURRENT_DATE, NOW() - INTERVAL '1 day');
    
    -- Items
    INSERT INTO app.items_pedido (id, pedido_id, sku_id, cantidad_solicitada, sku_nombre_snapshot, sku_codigo_snapshot, sku_peso_gramos_snapshot, sku_tipo_empaque_snapshot, precio_unitario_base, precio_origen, precio_unitario_final, subtotal) VALUES
      (v_item_4_1_id, v_pedido_4_id, v_sku_lomo_cerdo_1kg_id, 5, 'Lomo de Cerdo 1kg', 'CER-LOM-001-1KG', 1000, 'Vacío', 8.50, 'catalogo', 8.50, 42.50);
    
    -- Validación
    INSERT INTO app.validaciones_bodega (id, pedido_id, numero_version, validado_por_id, validado_en, requiere_aceptacion_cliente, motivo_general) VALUES
      (v_validacion_4_id, v_pedido_4_id, 1, v_bodeguero_juan_id, NOW() - INTERVAL '18 hours', false, 'Stock completo');
    
    INSERT INTO app.items_validacion_bodega (validacion_id, item_pedido_id, estado_resultado, cantidad_aprobada, motivo) VALUES
      (v_validacion_4_id, v_item_4_1_id, 'aprobado', 5, 'Disponible');
    
    -- Historial
    INSERT INTO app.historial_estado_pedido (pedido_id, estado, cambiado_por_id, motivo, creado_en) VALUES
      (v_pedido_4_id, 'pendiente_validacion', v_vendedor_carlos_id, 'Pedido creado', NOW() - INTERVAL '1 day'),
      (v_pedido_4_id, 'validado', v_bodeguero_juan_id, 'Validado', NOW() - INTERVAL '18 hours'),
      (v_pedido_4_id, 'asignado_ruta', v_bodeguero_juan_id, 'Asignado', NOW() - INTERVAL '6 hours'),
      (v_pedido_4_id, 'en_ruta', v_bodeguero_juan_id, 'En camino', NOW() - INTERVAL '2 hours');
  END IF;

  -- ==========================================
  -- PEDIDO 5: Tienda Don Pepe - ENTREGADO CON CRÉDITO
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.pedidos WHERE id = v_pedido_5_id) THEN
    INSERT INTO app.pedidos (id, numero_pedido, cliente_id, zona_id, creado_por_id, origen, estado, metodo_pago, subtotal, impuesto, total, notas, fecha_entrega_sugerida, creado_en) VALUES
      (v_pedido_5_id, 'PED-2026-00005', v_cliente_tienda_id, v_zona_centro_id, v_vendedor_ana_id, 
       'vendedor', 'entregado', 'credito', 27.00, 3.24, 30.24, 'Crédito 15 días', 
       CURRENT_DATE - INTERVAL '7 days', NOW() - INTERVAL '10 days');
    
    -- Items
    INSERT INTO app.items_pedido (id, pedido_id, sku_id, cantidad_solicitada, sku_nombre_snapshot, sku_codigo_snapshot, sku_peso_gramos_snapshot, sku_tipo_empaque_snapshot, precio_unitario_base, precio_origen, precio_unitario_final, subtotal) VALUES
      (v_item_5_1_id, v_pedido_5_id, v_sku_jamon_1kg_id, 2, 'Jamón Ahumado 1kg', 'EMB-JAM-001-1KG', 1000, 'Vacío', 9.00, 'catalogo', 9.00, 18.00),
      (v_item_5_2_id, v_pedido_5_id, v_sku_salchicha_500g_id, 2, 'Salchicha Alemana 500g', 'EMB-SAL-001-500G', 500, 'Vacío', 4.50, 'catalogo', 4.50, 9.00);
    
    -- Validación
    INSERT INTO app.validaciones_bodega (id, pedido_id, numero_version, validado_por_id, validado_en, requiere_aceptacion_cliente, motivo_general) VALUES
      (v_validacion_5_id, v_pedido_5_id, 1, v_bodeguero_juan_id, NOW() - INTERVAL '9 days', false, 'OK');
    
    INSERT INTO app.items_validacion_bodega (validacion_id, item_pedido_id, estado_resultado, cantidad_aprobada, motivo) VALUES
      (v_validacion_5_id, v_item_5_1_id, 'aprobado', 2, 'OK'),
      (v_validacion_5_id, v_item_5_2_id, 'aprobado', 2, 'OK');
    
    -- Historial
    INSERT INTO app.historial_estado_pedido (pedido_id, estado, cambiado_por_id, motivo, creado_en) VALUES
      (v_pedido_5_id, 'pendiente_validacion', v_vendedor_ana_id, 'Creado', NOW() - INTERVAL '10 days'),
      (v_pedido_5_id, 'validado', v_bodeguero_juan_id, 'OK', NOW() - INTERVAL '9 days'),
      (v_pedido_5_id, 'asignado_ruta', v_bodeguero_juan_id, 'Asignado', NOW() - INTERVAL '8 days'),
      (v_pedido_5_id, 'en_ruta', v_bodeguero_juan_id, 'En ruta', NOW() - INTERVAL '7 days'),
      (v_pedido_5_id, 'entregado', v_bodeguero_juan_id, 'Entregado', NOW() - INTERVAL '7 days');
  END IF;

  RAISE NOTICE 'Pedidos seed completado';
END $$;


-- =====================================================
-- 6) CRÉDITOS (cafrilosa_creditos)
-- =====================================================
\c cafrilosa_creditos

DO $$
DECLARE
  v_vendedor_ana_id uuid := 'b2000000-0000-0000-0000-000000000002';
  v_cliente_tienda_id uuid := 'e5000000-0000-0000-0000-000000000005';
  v_pedido_5_id uuid := '20000000-0000-0000-0000-000000000005';
  
  v_credito_1_id uuid := '30000000-0000-0000-0000-000000000001';
BEGIN
  -- Crédito para pedido 5 (Tienda Don Pepe)
  IF NOT EXISTS (SELECT 1 FROM app.aprobaciones_credito WHERE id = v_credito_1_id) THEN
    INSERT INTO app.aprobaciones_credito (id, pedido_id, cliente_id, aprobado_por_vendedor_id, origen, monto_aprobado, moneda, plazo_dias, fecha_aprobacion, fecha_vencimiento, estado, notas) VALUES
      (v_credito_1_id, v_pedido_5_id, v_cliente_tienda_id, v_vendedor_ana_id, 'vendedor', 
       30.24, 'USD', 15, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '8 days', 
       'activo', 'Crédito regular para cliente frecuente');
    
    -- Pago parcial registrado
    INSERT INTO app.pagos_credito (aprobacion_credito_id, monto_pago, moneda, fecha_pago, registrado_por_id, metodo_registro, referencia, notas) VALUES
      (v_credito_1_id, 15.00, 'USD', CURRENT_DATE - INTERVAL '2 days', v_vendedor_ana_id, 'manual', 'REC-001234', 'Abono parcial en efectivo');
    
    -- Historial de estados
    INSERT INTO app.historial_estado_credito (aprobacion_credito_id, estado, cambiado_por_id, motivo, creado_en) VALUES
      (v_credito_1_id, 'activo', v_vendedor_ana_id, 'Crédito aprobado', NOW() - INTERVAL '7 days');
  END IF;

  RAISE NOTICE 'Créditos seed completado';
END $$;


-- =====================================================
-- 7) RUTAS (cafrilosa_rutas)
-- =====================================================
\c cafrilosa_rutas

DO $$
DECLARE
  v_supervisor_denis uuid := '0df6a2ea-248c-4138-bb37-2aeef0432df5';
  v_vendedor_carlos_id uuid := 'b1000000-0000-0000-0000-000000000001';
  v_vendedor_ana_id uuid := 'b2000000-0000-0000-0000-000000000002';
  v_transportista_mario_id uuid := 'd1000000-0000-0000-0000-000000000001';
  v_transportista_jose_id uuid := 'd2000000-0000-0000-0000-000000000002';
  
  v_cliente_distribuidora_id uuid := 'e1000000-0000-0000-0000-000000000001';
  v_cliente_restaurante_id uuid := 'e2000000-0000-0000-0000-000000000002';
  v_cliente_hotel_id uuid := 'e4000000-0000-0000-0000-000000000004';
  v_cliente_tienda_id uuid := 'e5000000-0000-0000-0000-000000000005';
  
  v_zona_norte_id uuid := 'f1000000-0000-0000-0000-000000000001';
  v_zona_centro_id uuid := 'f3000000-0000-0000-0000-000000000003';
  
  v_pedido_1_id uuid := '20000000-0000-0000-0000-000000000001';
  v_pedido_4_id uuid := '20000000-0000-0000-0000-000000000004';
  v_pedido_5_id uuid := '20000000-0000-0000-0000-000000000005';
  
  -- Vehículos
  v_vehiculo_1_id uuid := '40000000-0000-0000-0000-000000000001';
  v_vehiculo_2_id uuid := '40000000-0000-0000-0000-000000000002';
  
  -- Ruteros comerciales
  v_rutero_com_1_id uuid := '41000000-0000-0000-0000-000000000001';
  v_rutero_com_2_id uuid := '41000000-0000-0000-0000-000000000002';
  
  -- Ruteros logísticos
  v_rutero_log_1_id uuid := '42000000-0000-0000-0000-000000000001';
  v_rutero_log_2_id uuid := '42000000-0000-0000-0000-000000000002';
  
BEGIN
  -- ==========================================
  -- VEHÍCULOS
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.vehiculos WHERE id = v_vehiculo_1_id) THEN
    INSERT INTO app.vehiculos (id, placa, modelo, capacidad_kg, estado) VALUES
      (v_vehiculo_1_id, 'ABC-1234', 'Hyundai HD65 Refrigerado', 3500, 'asignado'),
      (v_vehiculo_2_id, 'DEF-5678', 'Mitsubishi Canter Refrigerado', 2500, 'disponible');
  END IF;

  -- ==========================================
  -- RUTERO COMERCIAL HOY (vendedor Carlos - Zona Norte)
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.ruteros_comerciales WHERE id = v_rutero_com_1_id) THEN
    INSERT INTO app.ruteros_comerciales (id, fecha_rutero, zona_id, vendedor_id, creado_por_supervisor_id, estado, publicado_en, publicado_por, iniciado_en, iniciado_por) VALUES
      (v_rutero_com_1_id, CURRENT_DATE, v_zona_norte_id, v_vendedor_carlos_id, v_supervisor_denis, 
       'en_curso', NOW() - INTERVAL '6 hours', v_supervisor_denis, NOW() - INTERVAL '4 hours', v_vendedor_carlos_id);
    
    -- Paradas comerciales
    INSERT INTO app.paradas_rutero_comercial (rutero_id, cliente_id, orden_visita, objetivo, checkin_en, checkout_en, resultado, notas) VALUES
      (v_rutero_com_1_id, v_cliente_distribuidora_id, 1, 'Seguimiento pedido anterior', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours' - INTERVAL '30 minutes', 'pedido_tomado', 'Nuevo pedido levantado'),
      (v_rutero_com_1_id, v_cliente_hotel_id, 2, 'Visita programada', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 'seguimiento', 'Interesado en promoción de mariscos');
    
    -- Historial
    INSERT INTO app.historial_estado_rutero (tipo, rutero_id, estado, cambiado_por_id, motivo, creado_en) VALUES
      ('comercial', v_rutero_com_1_id, 'borrador', v_supervisor_denis, 'Creado', NOW() - INTERVAL '8 hours'),
      ('comercial', v_rutero_com_1_id, 'publicado', v_supervisor_denis, 'Publicado', NOW() - INTERVAL '6 hours'),
      ('comercial', v_rutero_com_1_id, 'en_curso', v_vendedor_carlos_id, 'Iniciado', NOW() - INTERVAL '4 hours');
  END IF;

  -- ==========================================
  -- RUTERO COMERCIAL MAÑANA (vendedora Ana - Zona Centro)
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.ruteros_comerciales WHERE id = v_rutero_com_2_id) THEN
    INSERT INTO app.ruteros_comerciales (id, fecha_rutero, zona_id, vendedor_id, creado_por_supervisor_id, estado, publicado_en, publicado_por) VALUES
      (v_rutero_com_2_id, CURRENT_DATE + INTERVAL '1 day', v_zona_centro_id, v_vendedor_ana_id, v_supervisor_denis, 
       'publicado', NOW(), v_supervisor_denis);
    
    -- Paradas comerciales (sin ejecutar aún)
    INSERT INTO app.paradas_rutero_comercial (rutero_id, cliente_id, orden_visita, objetivo) VALUES
      (v_rutero_com_2_id, v_cliente_restaurante_id, 1, 'Seguimiento pedido ajustado'),
      (v_rutero_com_2_id, v_cliente_tienda_id, 2, 'Cobranza crédito pendiente');
    
    -- Historial
    INSERT INTO app.historial_estado_rutero (tipo, rutero_id, estado, cambiado_por_id, motivo, creado_en) VALUES
      ('comercial', v_rutero_com_2_id, 'borrador', v_supervisor_denis, 'Creado', NOW() - INTERVAL '1 hour'),
      ('comercial', v_rutero_com_2_id, 'publicado', v_supervisor_denis, 'Publicado', NOW());
  END IF;

  -- ==========================================
  -- RUTERO LOGÍSTICO HOY (transportista Mario - Zona Norte)
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.ruteros_logisticos WHERE id = v_rutero_log_1_id) THEN
    INSERT INTO app.ruteros_logisticos (id, fecha_rutero, zona_id, vehiculo_id, transportista_id, creado_por_supervisor_id, estado, publicado_en, publicado_por, iniciado_en, iniciado_por) VALUES
      (v_rutero_log_1_id, CURRENT_DATE, v_zona_norte_id, v_vehiculo_1_id, v_transportista_mario_id, v_supervisor_denis, 
       'en_curso', NOW() - INTERVAL '5 hours', v_supervisor_denis, NOW() - INTERVAL '3 hours', v_transportista_mario_id);
    
    -- Paradas logísticas (pedido 4 está en ruta)
    INSERT INTO app.paradas_rutero_logistico (rutero_id, pedido_id, orden_entrega, preparado_en, preparado_por) VALUES
      (v_rutero_log_1_id, v_pedido_4_id, 1, NOW() - INTERVAL '4 hours', v_supervisor_denis);
    
    -- Historial
    INSERT INTO app.historial_estado_rutero (tipo, rutero_id, estado, cambiado_por_id, motivo, creado_en) VALUES
      ('logistico', v_rutero_log_1_id, 'borrador', v_supervisor_denis, 'Creado', NOW() - INTERVAL '6 hours'),
      ('logistico', v_rutero_log_1_id, 'publicado', v_supervisor_denis, 'Publicado', NOW() - INTERVAL '5 hours'),
      ('logistico', v_rutero_log_1_id, 'en_curso', v_transportista_mario_id, 'Iniciado', NOW() - INTERVAL '3 hours');
  END IF;

  -- ==========================================
  -- RUTERO LOGÍSTICO COMPLETADO (histórico)
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.ruteros_logisticos WHERE id = v_rutero_log_2_id) THEN
    INSERT INTO app.ruteros_logisticos (id, fecha_rutero, zona_id, vehiculo_id, transportista_id, creado_por_supervisor_id, estado, publicado_en, publicado_por, iniciado_en, iniciado_por, completado_en, completado_por) VALUES
      (v_rutero_log_2_id, CURRENT_DATE - INTERVAL '3 days', v_zona_norte_id, v_vehiculo_1_id, v_transportista_mario_id, v_supervisor_denis, 
       'completado', NOW() - INTERVAL '4 days', v_supervisor_denis, NOW() - INTERVAL '3 days', v_transportista_mario_id,
       NOW() - INTERVAL '3 days' + INTERVAL '8 hours', v_transportista_mario_id);
    
    -- Paradas logísticas (pedidos entregados)
    INSERT INTO app.paradas_rutero_logistico (rutero_id, pedido_id, orden_entrega, preparado_en, preparado_por) VALUES
      (v_rutero_log_2_id, v_pedido_1_id, 1, NOW() - INTERVAL '4 days', v_supervisor_denis);
  END IF;

  RAISE NOTICE 'Rutas seed completado';
END $$;


-- =====================================================
-- 8) ENTREGAS (cafrilosa_entregas)
-- =====================================================
\c cafrilosa_entregas

DO $$
DECLARE
  v_transportista_mario_id uuid := 'd1000000-0000-0000-0000-000000000001';
  
  v_pedido_1_id uuid := '20000000-0000-0000-0000-000000000001';
  v_pedido_4_id uuid := '20000000-0000-0000-0000-000000000004';
  v_pedido_5_id uuid := '20000000-0000-0000-0000-000000000005';
  
  v_rutero_log_1_id uuid := '42000000-0000-0000-0000-000000000001';
  v_rutero_log_2_id uuid := '42000000-0000-0000-0000-000000000002';
  
  v_entrega_1_id uuid := '50000000-0000-0000-0000-000000000001';
  v_entrega_4_id uuid := '50000000-0000-0000-0000-000000000004';
  v_entrega_5_id uuid := '50000000-0000-0000-0000-000000000005';
  
BEGIN
  -- ==========================================
  -- ENTREGA 1: Completada exitosamente
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.entregas WHERE id = v_entrega_1_id) THEN
    INSERT INTO app.entregas (id, pedido_id, rutero_logistico_id, transportista_id, estado, asignado_en, salida_ruta_en, entregado_en, observaciones, latitud, longitud) VALUES
      (v_entrega_1_id, v_pedido_1_id, v_rutero_log_2_id, v_transportista_mario_id, 
       'entregado_completo', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '2 hours',
       'Entrega sin novedades', -0.1807, -78.4678);
    
    -- Evidencias
    INSERT INTO app.evidencias_entrega (entrega_id, tipo, url, mime_type, descripcion, meta) VALUES
      (v_entrega_1_id, 'foto', 'https://storage.cafrilosa.com/entregas/entrega-1-foto1.jpg', 'image/jpeg', 'Foto del pedido entregado', '{"taken_at": "2026-01-25T10:30:00Z"}'::jsonb),
      (v_entrega_1_id, 'firma', 'https://storage.cafrilosa.com/entregas/entrega-1-firma.png', 'image/png', 'Firma del receptor', '{"signer_name": "Roberto Martínez"}'::jsonb);
    
    -- Historial
    INSERT INTO app.historial_estado_entrega (entrega_id, estado, cambiado_por_id, motivo, creado_en) VALUES
      (v_entrega_1_id, 'pendiente', v_transportista_mario_id, 'Asignado', NOW() - INTERVAL '4 days'),
      (v_entrega_1_id, 'en_ruta', v_transportista_mario_id, 'Salida a reparto', NOW() - INTERVAL '3 days'),
      (v_entrega_1_id, 'entregado_completo', v_transportista_mario_id, 'Entregado exitosamente', NOW() - INTERVAL '3 days' + INTERVAL '2 hours');
  END IF;

  -- ==========================================
  -- ENTREGA 4: En ruta actualmente
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.entregas WHERE id = v_entrega_4_id) THEN
    INSERT INTO app.entregas (id, pedido_id, rutero_logistico_id, transportista_id, estado, asignado_en, salida_ruta_en, observaciones) VALUES
      (v_entrega_4_id, v_pedido_4_id, v_rutero_log_1_id, v_transportista_mario_id, 
       'en_ruta', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '2 hours', 'Entrega prioritaria antes del mediodía');
    
    -- Historial
    INSERT INTO app.historial_estado_entrega (entrega_id, estado, cambiado_por_id, motivo, creado_en) VALUES
      (v_entrega_4_id, 'pendiente', v_transportista_mario_id, 'Asignado', NOW() - INTERVAL '4 hours'),
      (v_entrega_4_id, 'en_ruta', v_transportista_mario_id, 'En camino', NOW() - INTERVAL '2 hours');
  END IF;

  -- ==========================================
  -- ENTREGA 5: Completada (pedido con crédito)
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.entregas WHERE id = v_entrega_5_id) THEN
    INSERT INTO app.entregas (id, pedido_id, rutero_logistico_id, transportista_id, estado, asignado_en, salida_ruta_en, entregado_en, observaciones, latitud, longitud) VALUES
      (v_entrega_5_id, v_pedido_5_id, v_rutero_log_2_id, v_transportista_mario_id, 
       'entregado_completo', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '3 hours',
       'Cliente firmó pagaré de crédito', -0.2156, -78.5067);
    
    -- Evidencias
    INSERT INTO app.evidencias_entrega (entrega_id, tipo, url, mime_type, descripcion, meta) VALUES
      (v_entrega_5_id, 'documento', 'https://storage.cafrilosa.com/entregas/entrega-5-pagare.pdf', 'application/pdf', 'Pagaré firmado por el cliente', '{"document_type": "promissory_note"}'::jsonb);
    
    -- Historial
    INSERT INTO app.historial_estado_entrega (entrega_id, estado, cambiado_por_id, motivo, creado_en) VALUES
      (v_entrega_5_id, 'pendiente', v_transportista_mario_id, 'Asignado', NOW() - INTERVAL '8 days'),
      (v_entrega_5_id, 'en_ruta', v_transportista_mario_id, 'Salida', NOW() - INTERVAL '7 days'),
      (v_entrega_5_id, 'entregado_completo', v_transportista_mario_id, 'Entrega con documentación crédito', NOW() - INTERVAL '7 days' + INTERVAL '3 hours');
  END IF;

  RAISE NOTICE 'Entregas seed completado';
END $$;


-- =====================================================
-- 9) NOTIFICACIONES (cafrilosa_notificaciones)
-- =====================================================
\c cafrilosa_notificaciones

DO $$
DECLARE
  v_supervisor_denis uuid := '0df6a2ea-248c-4138-bb37-2aeef0432df5';
  v_vendedor_carlos_id uuid := 'b1000000-0000-0000-0000-000000000001';
  v_vendedor_ana_id uuid := 'b2000000-0000-0000-0000-000000000002';
  v_bodeguero_juan_id uuid := 'c1000000-0000-0000-0000-000000000001';
  v_transportista_mario_id uuid := 'd1000000-0000-0000-0000-000000000001';
  v_cliente_distribuidora_id uuid := 'e1000000-0000-0000-0000-000000000001';
  v_cliente_restaurante_id uuid := 'e2000000-0000-0000-0000-000000000002';
  v_cliente_supermercado_id uuid := 'e3000000-0000-0000-0000-000000000003';
  v_cliente_hotel_id uuid := 'e4000000-0000-0000-0000-000000000004';
  
  v_tipo_pedido_creado_id uuid := '60000000-0000-0000-0000-000000000001';
  v_tipo_pedido_validado_id uuid := '60000000-0000-0000-0000-000000000002';
  v_tipo_pedido_ajustado_id uuid := '60000000-0000-0000-0000-000000000003';
  v_tipo_pedido_en_ruta_id uuid := '60000000-0000-0000-0000-000000000004';
  v_tipo_pedido_entregado_id uuid := '60000000-0000-0000-0000-000000000005';
  v_tipo_credito_aprobado_id uuid := '60000000-0000-0000-0000-000000000006';
  v_tipo_credito_pago_id uuid := '60000000-0000-0000-0000-000000000007';
  v_tipo_rutero_asignado_id uuid := '60000000-0000-0000-0000-000000000008';
  
BEGIN
  -- ==========================================
  -- TIPOS DE NOTIFICACIÓN
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.tipos_notificacion WHERE id = v_tipo_pedido_creado_id) THEN
    INSERT INTO app.tipos_notificacion (id, codigo, nombre, descripcion, activo) VALUES
      (v_tipo_pedido_creado_id, 'pedido_creado', 'Pedido Creado', 'Notificación cuando se crea un nuevo pedido', true),
      (v_tipo_pedido_validado_id, 'pedido_validado', 'Pedido Validado', 'Notificación cuando bodega valida un pedido', true),
      (v_tipo_pedido_ajustado_id, 'pedido_ajustado', 'Pedido Ajustado', 'Notificación cuando hay ajustes de bodega', true),
      (v_tipo_pedido_en_ruta_id, 'pedido_en_ruta', 'Pedido en Ruta', 'Notificación cuando el pedido sale a entrega', true),
      (v_tipo_pedido_entregado_id, 'pedido_entregado', 'Pedido Entregado', 'Notificación de entrega exitosa', true),
      (v_tipo_credito_aprobado_id, 'credito_aprobado', 'Crédito Aprobado', 'Notificación de aprobación de crédito', true),
      (v_tipo_credito_pago_id, 'credito_pago', 'Pago Registrado', 'Notificación de pago en crédito', true),
      (v_tipo_rutero_asignado_id, 'rutero_asignado', 'Rutero Asignado', 'Notificación de asignación de ruta', true);
  END IF;

  -- ==========================================
  -- PREFERENCIAS DE USUARIOS
  -- ==========================================
  IF NOT EXISTS (SELECT 1 FROM app.preferencias_notificacion WHERE usuario_id = v_cliente_distribuidora_id) THEN
    INSERT INTO app.preferencias_notificacion (usuario_id, websocket_enabled, email_enabled, sms_enabled, no_molestar) VALUES
      (v_cliente_distribuidora_id, true, true, false, false),
      (v_cliente_restaurante_id, true, true, true, false),
      (v_cliente_supermercado_id, true, true, false, false),
      (v_cliente_hotel_id, true, true, true, false),
      (v_vendedor_carlos_id, true, true, false, false),
      (v_vendedor_ana_id, true, true, false, false),
      (v_bodeguero_juan_id, true, false, false, false),
      (v_transportista_mario_id, true, false, true, false);
  END IF;

  -- ==========================================
  -- NOTIFICACIONES DE EJEMPLO
  -- ==========================================
  -- Para cliente restaurante (pedido ajustado pendiente)
  IF NOT EXISTS (SELECT 1 FROM app.notificaciones WHERE usuario_id = v_cliente_restaurante_id AND origen_servicio = 'order') THEN
    INSERT INTO app.notificaciones (usuario_id, tipo_id, titulo, mensaje, origen_servicio, payload, prioridad, requiere_accion, url_accion, leida, creado_en) VALUES
      (v_cliente_restaurante_id, v_tipo_pedido_ajustado_id, 
       '⚠️ Tu pedido requiere confirmación',
       'El pedido PED-2026-00002 fue ajustado por bodega. El camarón fue reducido de 3kg a 2kg por disponibilidad. Por favor confirma o rechaza los cambios.',
       'order', 
       '{"pedido_id": "20000000-0000-0000-0000-000000000002", "numero_pedido": "PED-2026-00002", "ajuste": "cantidad_reducida"}'::jsonb,
       'alta', true, '/pedidos/20000000-0000-0000-0000-000000000002/ajuste',
       false, NOW() - INTERVAL '4 hours');
  END IF;

  -- Para cliente hotel (pedido en ruta)
  IF NOT EXISTS (SELECT 1 FROM app.notificaciones WHERE usuario_id = v_cliente_hotel_id AND origen_servicio = 'delivery') THEN
    INSERT INTO app.notificaciones (usuario_id, tipo_id, titulo, mensaje, origen_servicio, payload, prioridad, requiere_accion, leida, creado_en) VALUES
      (v_cliente_hotel_id, v_tipo_pedido_en_ruta_id, 
       '🚚 Tu pedido está en camino',
       'El pedido PED-2026-00004 salió a entrega. Tiempo estimado de llegada: antes del mediodía.',
       'delivery', 
       '{"pedido_id": "20000000-0000-0000-0000-000000000004", "numero_pedido": "PED-2026-00004", "transportista": "Mario Castillo"}'::jsonb,
       'normal', false,
       false, NOW() - INTERVAL '2 hours');
  END IF;

  -- Para bodeguero (pedido nuevo por validar)
  IF NOT EXISTS (SELECT 1 FROM app.notificaciones WHERE usuario_id = v_bodeguero_juan_id AND origen_servicio = 'order') THEN
    INSERT INTO app.notificaciones (usuario_id, tipo_id, titulo, mensaje, origen_servicio, payload, prioridad, requiere_accion, url_accion, leida, creado_en) VALUES
      (v_bodeguero_juan_id, v_tipo_pedido_creado_id, 
       '📦 Nuevo pedido pendiente de validación',
       'El pedido PED-2026-00003 de Supermercado del Sur requiere validación de bodega.',
       'order', 
       '{"pedido_id": "20000000-0000-0000-0000-000000000003", "numero_pedido": "PED-2026-00003", "cliente": "Supermercado del Sur"}'::jsonb,
       'alta', true, '/bodega/validar/20000000-0000-0000-0000-000000000003',
       false, NOW() - INTERVAL '2 hours');
  END IF;

  -- Para vendedor Carlos (rutero asignado)
  IF NOT EXISTS (SELECT 1 FROM app.notificaciones WHERE usuario_id = v_vendedor_carlos_id AND origen_servicio = 'route') THEN
    INSERT INTO app.notificaciones (usuario_id, tipo_id, titulo, mensaje, origen_servicio, payload, prioridad, requiere_accion, url_accion, leida, leida_en, creado_en) VALUES
      (v_vendedor_carlos_id, v_tipo_rutero_asignado_id, 
       '📋 Rutero comercial publicado',
       'Se ha publicado tu rutero comercial para hoy. Tienes 2 visitas programadas en Zona Norte.',
       'route', 
       '{"rutero_id": "41000000-0000-0000-0000-000000000001", "fecha": "2026-01-28", "zona": "Zona Norte", "visitas": 2}'::jsonb,
       'normal', true, '/ruteros/comercial/41000000-0000-0000-0000-000000000001',
       true, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '6 hours');
  END IF;

  -- Para transportista Mario (ruta asignada)
  IF NOT EXISTS (SELECT 1 FROM app.notificaciones WHERE usuario_id = v_transportista_mario_id AND origen_servicio = 'route') THEN
    INSERT INTO app.notificaciones (usuario_id, tipo_id, titulo, mensaje, origen_servicio, payload, prioridad, requiere_accion, url_accion, leida, leida_en, creado_en) VALUES
      (v_transportista_mario_id, v_tipo_rutero_asignado_id, 
       '🚛 Ruta logística asignada',
       'Tienes una ruta de entregas asignada para hoy. Vehículo: ABC-1234. 1 entrega programada.',
       'route', 
       '{"rutero_id": "42000000-0000-0000-0000-000000000001", "fecha": "2026-01-28", "vehiculo": "ABC-1234", "entregas": 1}'::jsonb,
       'alta', true, '/ruteros/logistico/42000000-0000-0000-0000-000000000001',
       true, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '5 hours');
  END IF;

  -- Para cliente distribuidora (pedido entregado - histórico)
  IF NOT EXISTS (SELECT 1 FROM app.notificaciones WHERE usuario_id = v_cliente_distribuidora_id AND origen_servicio = 'delivery') THEN
    INSERT INTO app.notificaciones (usuario_id, tipo_id, titulo, mensaje, origen_servicio, payload, prioridad, leida, leida_en, creado_en) VALUES
      (v_cliente_distribuidora_id, v_tipo_pedido_entregado_id, 
       '✅ Pedido entregado exitosamente',
       'El pedido PED-2026-00001 ha sido entregado. ¡Gracias por tu preferencia!',
       'delivery', 
       '{"pedido_id": "20000000-0000-0000-0000-000000000001", "numero_pedido": "PED-2026-00001"}'::jsonb,
       'normal',
       true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days');
  END IF;

  RAISE NOTICE 'Notificaciones seed completado';
END $$;


-- =====================================================
-- RESUMEN DE DATOS SEED
-- =====================================================
/*
CREDENCIALES DE ACCESO (password por defecto):
----------------------------------------------
Staff: Cafrisales2024*
  - admin@cafrilosa.com (Admin)
  - denis@cafrilosa.com (Supervisor) - ya existía con Mipass123*
  - maria.supervisora@cafrilosa.com (Supervisora)
  - carlos.vendedor@cafrilosa.com (Vendedor - Zona Norte)
  - ana.vendedora@cafrilosa.com (Vendedora - Zona Centro)
  - luis.vendedor@cafrilosa.com (Vendedor - Zona Sur)
  - juan.bodeguero@cafrilosa.com (Bodeguero)
  - pedro.bodeguero@cafrilosa.com (Bodeguero)
  - mario.transportista@cafrilosa.com (Transportista)
  - jose.transportista@cafrilosa.com (Transportista)

Clientes: Cliente2024*
  - contacto@distribuidoranorte.com (Mayorista - Zona Norte)
  - pedidos@restaurantelacasa.com (HORECA - Zona Centro)
  - compras@supermercadosur.com (Minorista - Zona Sur)
  - cocina@hotelgranplaza.com (HORECA - Zona Norte)
  - ventas@tiendadonpepe.com (Minorista - Zona Centro)

FLUJOS SIMULADOS:
-----------------
1. Pedido 1 (PED-2026-00001): Flujo completo exitoso
   - Cliente: Distribuidora Norte
   - Estado: ENTREGADO
   - Pago: Contado

2. Pedido 2 (PED-2026-00002): Pendiente aceptación cliente
   - Cliente: Restaurante La Casa
   - Estado: AJUSTADO_BODEGA
   - Ajuste: Camarón reducido de 3kg a 2kg

3. Pedido 3 (PED-2026-00003): Nuevo pedido
   - Cliente: Supermercado del Sur
   - Estado: PENDIENTE_VALIDACION
   - Pago: Crédito

4. Pedido 4 (PED-2026-00004): En reparto
   - Cliente: Hotel Gran Plaza
   - Estado: EN_RUTA
   - Pago: Contado

5. Pedido 5 (PED-2026-00005): Con crédito activo
   - Cliente: Tienda Don Pepe
   - Estado: ENTREGADO
   - Crédito: $30.24 a 15 días, abono de $15.00

CATÁLOGO:
---------
- 5 Categorías: Cerdo, Res, Pollo, Embutidos, Mariscos
- 10 Productos
- 11 SKUs con precios vigentes

ZONAS:
------
- Zona Norte: Entregas L-V, Visitas L-S
- Zona Sur: Entregas L-S, Visitas L-S
- Zona Centro: Entregas L-V, Visitas L-V

RUTEROS ACTIVOS:
----------------
- Comercial: Carlos (Zona Norte) - EN_CURSO
- Comercial: Ana (Zona Centro) - PUBLICADO para mañana
- Logístico: Mario (Zona Norte) - EN_CURSO con entrega

VEHÍCULOS:
----------
- ABC-1234: Hyundai HD65 (asignado)
- DEF-5678: Mitsubishi Canter (disponible)
*/

RAISE NOTICE '=====================================================';
RAISE NOTICE 'SEED DATA COMPLETADO EXITOSAMENTE';
RAISE NOTICE 'Consulte el resumen al final del script para credenciales';
RAISE NOTICE '=====================================================';
