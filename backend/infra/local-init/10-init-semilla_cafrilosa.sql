-- =====================================================
-- SEMILLA DE DATOS PARA CAFRILOSA
-- Catálogo completo: categorías, productos, SKUs y precios
-- PRODUCTOS CÁRNICOS
-- =====================================================

\c cafrilosa_catalogo

-- Usuario supervisor de referencia (usado en creado_por)
-- Este ID corresponde al supervisor denis@cafrilosa.com creado en 02-init-cafrilosa_usuarios.sql

-- =====================================================
-- 1) CATEGORÍAS
-- =====================================================

INSERT INTO app.categorias (id, nombre, slug, descripcion, img_url, orden, activo, creado_por)
VALUES
  (gen_random_uuid(), 'Jamones', 'jamones', 'Jamones artesanales y premium de alta calidad', 'https://images.unsplash.com/photo-1562440499-64c9a74f0f0e', 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
  (gen_random_uuid(), 'Mortadelas', 'mortadelas', 'Mortadelas tradicionales y especiales', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f', 2, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
  (gen_random_uuid(), 'Salchichas', 'salchichas', 'Salchichas frescas y ahumadas de diferentes tipos', 'https://images.unsplash.com/photo-1612392166886-ee7c39d67627', 3, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
  (gen_random_uuid(), 'Ahumados', 'ahumados', 'Productos ahumados artesanalmente con madera seleccionada', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f', 4, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
  (gen_random_uuid(), 'Chorizos', 'chorizos', 'Chorizos tradicionales y especiales con diferentes especias', 'https://images.unsplash.com/photo-1599105455110-4c445c5c22e2', 5, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
  (gen_random_uuid(), 'Para la Parrilla', 'para-la-parrilla', 'Selección especial de carnes y embutidos para asados', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba', 6, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 2) PRODUCTOS (con referencias a categorías)
-- =====================================================

DO $$
DECLARE
  v_cat_jamones uuid;
  v_cat_mortadelas uuid;
  v_cat_salchichas uuid;
  v_cat_ahumados uuid;
  v_cat_chorizos uuid;
  v_cat_parrilla uuid;
  
  v_prod_jamon_serrano uuid;
  v_prod_jamon_york uuid;
  v_prod_jamon_ahumado uuid;
  
  v_prod_mortadela_clasica uuid;
  v_prod_mortadela_jamon uuid;
  v_prod_mortadela_aceitunas uuid;
  
  v_prod_salchicha_viena uuid;
  v_prod_salchicha_frankfurt uuid;
  v_prod_salchicha_polaca uuid;
  
  v_prod_tocino_ahumado uuid;
  v_prod_costilla_ahumada uuid;
  v_prod_pechuga_ahumada uuid;
  
  v_prod_chorizo_español uuid;
  v_prod_chorizo_parrillero uuid;
  v_prod_chorizo_picante uuid;
  
  v_prod_carne_res uuid;
  v_prod_carne_cerdo uuid;
  v_prod_mixto_parrilla uuid;
BEGIN
  -- Obtener IDs de categorías
  SELECT id INTO v_cat_jamones FROM app.categorias WHERE slug = 'jamones';
  SELECT id INTO v_cat_mortadelas FROM app.categorias WHERE slug = 'mortadelas';
  SELECT id INTO v_cat_salchichas FROM app.categorias WHERE slug = 'salchichas';
  SELECT id INTO v_cat_ahumados FROM app.categorias WHERE slug = 'ahumados';
  SELECT id INTO v_cat_chorizos FROM app.categorias WHERE slug = 'chorizos';
  SELECT id INTO v_cat_parrilla FROM app.categorias WHERE slug = 'para-la-parrilla';

  -- ====================
  -- JAMONES
  -- ====================
  v_prod_jamon_serrano := gen_random_uuid();
  INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, img_url, activo, creado_por)
  VALUES (
    v_prod_jamon_serrano,
    v_cat_jamones,
    'Jamón Serrano Premium',
    'jamon-serrano-premium',
    'Jamón serrano curado por 12 meses. Sabor intenso y textura suave.',
    'https://images.unsplash.com/photo-1562440499-64c9a74f0f0e',
    true,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  ) ON CONFLICT (slug) DO NOTHING;

  v_prod_jamon_york := gen_random_uuid();
  INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, img_url, activo, creado_por)
  VALUES (
    v_prod_jamon_york,
    v_cat_jamones,
    'Jamón York Tradicional',
    'jamon-york-tradicional',
    'Jamón cocido de alta calidad. Ideal para sándwiches y desayunos.',
    'https://images.unsplash.com/photo-1551030173-122aabc4489c',
    true,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  ) ON CONFLICT (slug) DO NOTHING;

  v_prod_jamon_ahumado := gen_random_uuid();
  INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, img_url, activo, creado_por)
  VALUES (
    v_prod_jamon_ahumado,
    v_cat_jamones,
    'Jamón Ahumado Artesanal',
    'jamon-ahumado-artesanal',
    'Jamón ahumado con madera de nogal. Sabor profundo y aromático.',
    'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f',
    true,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  ) ON CONFLICT (slug) DO NOTHING;

  -- ====================
  -- MORTADELAS
  -- ====================
  v_prod_mortadela_clasica := gen_random_uuid();
  INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, img_url, activo, creado_por)
  VALUES (
    v_prod_mortadela_clasica,
    v_cat_mortadelas,
    'Mortadela Clásica',
    'mortadela-clasica',
    'Mortadela tradicional de receta familiar. Textura fina y sabor suave.',
    'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f',
    true,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  ) ON CONFLICT (slug) DO NOTHING;

  v_prod_mortadela_jamon := gen_random_uuid();
  INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, img_url, activo, creado_por)
  VALUES (
    v_prod_mortadela_jamon,
    v_cat_mortadelas,
    'Mortadela con Jamón',
    'mortadela-con-jamon',
    'Mortadela especial con trozos de jamón. Premium y sabrosa.',
    'https://images.unsplash.com/photo-1551030173-122aabc4489c',
    true,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  ) ON CONFLICT (slug) DO NOTHING;

  v_prod_mortadela_aceitunas := gen_random_uuid();
  INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, img_url, activo, creado_por)
  VALUES (
    v_prod_mortadela_aceitunas,
    v_cat_mortadelas,
    'Mortadela con Aceitunas',
    'mortadela-con-aceitunas',
    'Mortadela italiana con aceitunas verdes. Sabor mediterráneo.',
    'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f',
    true,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  ) ON CONFLICT (slug) DO NOTHING;

  -- ====================
  -- SALCHICHAS
  -- ====================
  v_prod_salchicha_viena := gen_random_uuid();
  INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, img_url, activo, creado_por)
  VALUES (
    v_prod_salchicha_viena,
    v_cat_salchichas,
    'Salchichas Viena',
    'salchichas-viena',
    'Salchichas estilo viena. Ideales para hot dogs y bocadillos.',
    'https://images.unsplash.com/photo-1612392166886-ee7c39d67627',
    true,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  ) ON CONFLICT (slug) DO NOTHING;

  v_prod_salchicha_frankfurt := gen_random_uuid();
  INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, img_url, activo, creado_por)
  VALUES (
    v_prod_salchicha_frankfurt,
    v_cat_salchichas,
    'Salchichas Frankfurt',
    'salchichas-frankfurt',
    'Salchichas frankfurt alemanas. Ahumadas y jugosas.',
    'https://images.unsplash.com/photo-1612392166886-ee7c39d67627',
    true,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  ) ON CONFLICT (slug) DO NOTHING;

  v_prod_salchicha_polaca := gen_random_uuid();
  INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, img_url, activo, creado_por)
  VALUES (
    v_prod_salchicha_polaca,
    v_cat_salchichas,
    'Salchichas Polacas',
    'salchichas-polacas',
    'Salchichas polacas especiadas. Perfectas para la parrilla.',
    'https://images.unsplash.com/photo-1612392166886-ee7c39d67627',
    true,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  ) ON CONFLICT (slug) DO NOTHING;

  -- ====================
  -- AHUMADOS
  -- ====================
  v_prod_tocino_ahumado := gen_random_uuid();
  INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, img_url, activo, creado_por)
  VALUES (
    v_prod_tocino_ahumado,
    v_cat_ahumados,
    'Tocino Ahumado Artesanal',
    'tocino-ahumado-artesanal',
    'Tocino ahumado con madera de manzano. Crujiente y sabroso.',
    'https://images.unsplash.com/photo-1608039829572-78524f79c4c7',
    true,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  ) ON CONFLICT (slug) DO NOTHING;

  v_prod_costilla_ahumada := gen_random_uuid();
  INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, img_url, activo, creado_por)
  VALUES (
    v_prod_costilla_ahumada,
    v_cat_ahumados,
    'Costillas Ahumadas BBQ',
    'costillas-ahumadas-bbq',
    'Costillas de cerdo ahumadas lentamente. Estilo barbacoa americana.',
    'https://images.unsplash.com/photo-1544025162-d76694265947',
    true,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  ) ON CONFLICT (slug) DO NOTHING;

  v_prod_pechuga_ahumada := gen_random_uuid();
  INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, img_url, activo, creado_por)
  VALUES (
    v_prod_pechuga_ahumada,
    v_cat_ahumados,
    'Pechuga de Pavo Ahumada',
    'pechuga-pavo-ahumada',
    'Pechuga de pavo ahumada naturalmente. Baja en grasa.',
    'https://images.unsplash.com/photo-1551024506-0bccd828d307',
    true,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  ) ON CONFLICT (slug) DO NOTHING;

  -- ====================
  -- CHORIZOS
  -- ====================
  v_prod_chorizo_español := gen_random_uuid();
  INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, img_url, activo, creado_por)
  VALUES (
    v_prod_chorizo_español,
    v_cat_chorizos,
    'Chorizo Español Curado',
    'chorizo-español-curado',
    'Chorizo español tradicional curado. Pimentón ahumado.',
    'https://images.unsplash.com/photo-1599105455110-4c445c5c22e2',
    true,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  ) ON CONFLICT (slug) DO NOTHING;

  v_prod_chorizo_parrillero := gen_random_uuid();
  INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, img_url, activo, creado_por)
  VALUES (
    v_prod_chorizo_parrillero,
    v_cat_chorizos,
    'Chorizo Parrillero Fresco',
    'chorizo-parrillero-fresco',
    'Chorizo fresco ideal para la parrilla. Jugoso y sabroso.',
    'https://images.unsplash.com/photo-1599105455110-4c445c5c22e2',
    true,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  ) ON CONFLICT (slug) DO NOTHING;

  v_prod_chorizo_picante := gen_random_uuid();
  INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, img_url, activo, creado_por)
  VALUES (
    v_prod_chorizo_picante,
    v_cat_chorizos,
    'Chorizo Picante Premium',
    'chorizo-picante-premium',
    'Chorizo con chile y especias. Para los amantes del picante.',
    'https://images.unsplash.com/photo-1599105455110-4c445c5c22e2',
    true,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  ) ON CONFLICT (slug) DO NOTHING;

  -- ====================
  -- PARA LA PARRILLA
  -- ====================
  v_prod_carne_res := gen_random_uuid();
  INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, img_url, activo, creado_por)
  VALUES (
    v_prod_carne_res,
    v_cat_parrilla,
    'Carne de Res Premium',
    'carne-res-premium',
    'Cortes selectos de res para parrilla. Madurados 21 días.',
    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba',
    true,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  ) ON CONFLICT (slug) DO NOTHING;

  v_prod_carne_cerdo := gen_random_uuid();
  INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, img_url, activo, creado_por)
  VALUES (
    v_prod_carne_cerdo,
    v_cat_parrilla,
    'Carne de Cerdo para Asar',
    'carne-cerdo-asar',
    'Chuletas y cortes de cerdo. Tiernos y jugosos.',
    'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f',
    true,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  ) ON CONFLICT (slug) DO NOTHING;

  v_prod_mixto_parrilla := gen_random_uuid();
  INSERT INTO app.productos (id, categoria_id, nombre, slug, descripcion, img_url, activo, creado_por)
  VALUES (
    v_prod_mixto_parrilla,
    v_cat_parrilla,
    'Mixto Parrillero Especial',
    'mixto-parrillero-especial',
    'Surtido de embutidos y carnes. Perfecto para asados familiares.',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1',
    true,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  ) ON CONFLICT (slug) DO NOTHING;

  -- ====================
  -- SKUs (PRESENTACIONES)
  -- ====================
  
  -- SKUs para Jamón Serrano
  SELECT id INTO v_prod_jamon_serrano FROM app.productos WHERE slug = 'jamon-serrano-premium';
  
  INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo, creado_por)
  VALUES
    (gen_random_uuid(), v_prod_jamon_serrano, 'JAMON-SER-100G', 'Jamón Serrano 100g Loncheado', 100, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_jamon_serrano, 'JAMON-SER-250G', 'Jamón Serrano 250g Loncheado', 250, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_jamon_serrano, 'JAMON-SER-500G', 'Jamón Serrano 500g Pieza', 500, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
  ON CONFLICT (codigo_sku) DO NOTHING;

  -- SKUs para Jamón York
  SELECT id INTO v_prod_jamon_york FROM app.productos WHERE slug = 'jamon-york-tradicional';
  
  INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo, creado_por)
  VALUES
    (gen_random_uuid(), v_prod_jamon_york, 'JAMON-YORK-150G', 'Jamón York 150g Loncheado', 150, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_jamon_york, 'JAMON-YORK-300G', 'Jamón York 300g Loncheado', 300, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_jamon_york, 'JAMON-YORK-1KG', 'Jamón York 1kg Pieza', 1000, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
  ON CONFLICT (codigo_sku) DO NOTHING;

  -- SKUs para Jamón Ahumado
  SELECT id INTO v_prod_jamon_ahumado FROM app.productos WHERE slug = 'jamon-ahumado-artesanal';
  
  INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo, creado_por)
  VALUES
    (gen_random_uuid(), v_prod_jamon_ahumado, 'JAMON-AHU-200G', 'Jamón Ahumado 200g Loncheado', 200, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_jamon_ahumado, 'JAMON-AHU-400G', 'Jamón Ahumado 400g Loncheado', 400, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
  ON CONFLICT (codigo_sku) DO NOTHING;

  -- SKUs para Mortadela Clásica
  SELECT id INTO v_prod_mortadela_clasica FROM app.productos WHERE slug = 'mortadela-clasica';
  
  INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo, creado_por)
  VALUES
    (gen_random_uuid(), v_prod_mortadela_clasica, 'MORT-CLA-200G', 'Mortadela Clásica 200g', 200, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_mortadela_clasica, 'MORT-CLA-500G', 'Mortadela Clásica 500g', 500, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_mortadela_clasica, 'MORT-CLA-1KG', 'Mortadela Clásica 1kg', 1000, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
  ON CONFLICT (codigo_sku) DO NOTHING;

  -- SKUs para Mortadela con Jamón
  SELECT id INTO v_prod_mortadela_jamon FROM app.productos WHERE slug = 'mortadela-con-jamon';
  
  INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo, creado_por)
  VALUES
    (gen_random_uuid(), v_prod_mortadela_jamon, 'MORT-JAM-250G', 'Mortadela con Jamón 250g', 250, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_mortadela_jamon, 'MORT-JAM-500G', 'Mortadela con Jamón 500g', 500, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
  ON CONFLICT (codigo_sku) DO NOTHING;

  -- SKUs para Mortadela con Aceitunas
  SELECT id INTO v_prod_mortadela_aceitunas FROM app.productos WHERE slug = 'mortadela-con-aceitunas';
  
  INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo, creado_por)
  VALUES
    (gen_random_uuid(), v_prod_mortadela_aceitunas, 'MORT-ACE-250G', 'Mortadela Aceitunas 250g', 250, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_mortadela_aceitunas, 'MORT-ACE-500G', 'Mortadela Aceitunas 500g', 500, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
  ON CONFLICT (codigo_sku) DO NOTHING;

  -- SKUs para Salchichas Viena
  SELECT id INTO v_prod_salchicha_viena FROM app.productos WHERE slug = 'salchichas-viena';
  
  INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo, creado_por)
  VALUES
    (gen_random_uuid(), v_prod_salchicha_viena, 'SALCHI-VIENA-250G', 'Salchichas Viena 250g (6 unid)', 250, 'empaque-vacio', true, 6, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_salchicha_viena, 'SALCHI-VIENA-500G', 'Salchichas Viena 500g (12 unid)', 500, 'empaque-vacio', true, 12, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_salchicha_viena, 'SALCHI-VIENA-1KG', 'Salchichas Viena 1kg (24 unid)', 1000, 'empaque-vacio', true, 24, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
  ON CONFLICT (codigo_sku) DO NOTHING;

  -- SKUs para Salchichas Frankfurt
  SELECT id INTO v_prod_salchicha_frankfurt FROM app.productos WHERE slug = 'salchichas-frankfurt';
  
  INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo, creado_por)
  VALUES
    (gen_random_uuid(), v_prod_salchicha_frankfurt, 'SALCHI-FRANK-300G', 'Salchichas Frankfurt 300g (4 unid)', 300, 'empaque-vacio', true, 4, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_salchicha_frankfurt, 'SALCHI-FRANK-750G', 'Salchichas Frankfurt 750g (10 unid)', 750, 'empaque-vacio', true, 10, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
  ON CONFLICT (codigo_sku) DO NOTHING;

  -- SKUs para Salchichas Polacas
  SELECT id INTO v_prod_salchicha_polaca FROM app.productos WHERE slug = 'salchichas-polacas';
  
  INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo, creado_por)
  VALUES
    (gen_random_uuid(), v_prod_salchicha_polaca, 'SALCHI-POL-400G', 'Salchichas Polacas 400g (4 unid)', 400, 'empaque-vacio', true, 4, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_salchicha_polaca, 'SALCHI-POL-800G', 'Salchichas Polacas 800g (8 unid)', 800, 'empaque-vacio', true, 8, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
  ON CONFLICT (codigo_sku) DO NOTHING;

  -- SKUs para Tocino Ahumado
  SELECT id INTO v_prod_tocino_ahumado FROM app.productos WHERE slug = 'tocino-ahumado-artesanal';
  
  INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo, creado_por)
  VALUES
    (gen_random_uuid(), v_prod_tocino_ahumado, 'TOCINO-AHU-250G', 'Tocino Ahumado 250g Loncheado', 250, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_tocino_ahumado, 'TOCINO-AHU-500G', 'Tocino Ahumado 500g Loncheado', 500, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_tocino_ahumado, 'TOCINO-AHU-1KG', 'Tocino Ahumado 1kg Pieza', 1000, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
  ON CONFLICT (codigo_sku) DO NOTHING;

  -- SKUs para Costillas Ahumadas
  SELECT id INTO v_prod_costilla_ahumada FROM app.productos WHERE slug = 'costillas-ahumadas-bbq';
  
  INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo, creado_por)
  VALUES
    (gen_random_uuid(), v_prod_costilla_ahumada, 'COST-AHU-800G', 'Costillas Ahumadas 800g', 800, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_costilla_ahumada, 'COST-AHU-1-5KG', 'Costillas Ahumadas 1.5kg', 1500, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
  ON CONFLICT (codigo_sku) DO NOTHING;

  -- SKUs para Pechuga Ahumada
  SELECT id INTO v_prod_pechuga_ahumada FROM app.productos WHERE slug = 'pechuga-pavo-ahumada';
  
  INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo, creado_por)
  VALUES
    (gen_random_uuid(), v_prod_pechuga_ahumada, 'PECH-PAVO-200G', 'Pechuga Pavo Ahumada 200g', 200, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_pechuga_ahumada, 'PECH-PAVO-400G', 'Pechuga Pavo Ahumada 400g', 400, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_pechuga_ahumada, 'PECH-PAVO-1KG', 'Pechuga Pavo Ahumada 1kg', 1000, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
  ON CONFLICT (codigo_sku) DO NOTHING;

  -- SKUs para Chorizo Español
  SELECT id INTO v_prod_chorizo_español FROM app.productos WHERE slug = 'chorizo-español-curado';
  
  INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo, creado_por)
  VALUES
    (gen_random_uuid(), v_prod_chorizo_español, 'CHOR-ESP-200G', 'Chorizo Español 200g', 200, 'empaque-vacio', false, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_chorizo_español, 'CHOR-ESP-400G', 'Chorizo Español 400g', 400, 'empaque-vacio', false, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_chorizo_español, 'CHOR-ESP-800G', 'Chorizo Español 800g', 800, 'empaque-vacio', false, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
  ON CONFLICT (codigo_sku) DO NOTHING;

  -- SKUs para Chorizo Parrillero
  SELECT id INTO v_prod_chorizo_parrillero FROM app.productos WHERE slug = 'chorizo-parrillero-fresco';
  
  INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo, creado_por)
  VALUES
    (gen_random_uuid(), v_prod_chorizo_parrillero, 'CHOR-PARR-500G', 'Chorizo Parrillero 500g (5 unid)', 500, 'empaque-vacio', true, 5, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_chorizo_parrillero, 'CHOR-PARR-1KG', 'Chorizo Parrillero 1kg (10 unid)', 1000, 'empaque-vacio', true, 10, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
  ON CONFLICT (codigo_sku) DO NOTHING;

  -- SKUs para Chorizo Picante
  SELECT id INTO v_prod_chorizo_picante FROM app.productos WHERE slug = 'chorizo-picante-premium';
  
  INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo, creado_por)
  VALUES
    (gen_random_uuid(), v_prod_chorizo_picante, 'CHOR-PIC-300G', 'Chorizo Picante 300g', 300, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_chorizo_picante, 'CHOR-PIC-600G', 'Chorizo Picante 600g', 600, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
  ON CONFLICT (codigo_sku) DO NOTHING;

  -- SKUs para Carne de Res
  SELECT id INTO v_prod_carne_res FROM app.productos WHERE slug = 'carne-res-premium';
  
  INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo, creado_por)
  VALUES
    (gen_random_uuid(), v_prod_carne_res, 'CARNE-RES-500G', 'Carne Res Premium 500g', 500, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_carne_res, 'CARNE-RES-1KG', 'Carne Res Premium 1kg', 1000, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_carne_res, 'CARNE-RES-2KG', 'Carne Res Premium 2kg', 2000, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
  ON CONFLICT (codigo_sku) DO NOTHING;

  -- SKUs para Carne de Cerdo
  SELECT id INTO v_prod_carne_cerdo FROM app.productos WHERE slug = 'carne-cerdo-asar';
  
  INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo, creado_por)
  VALUES
    (gen_random_uuid(), v_prod_carne_cerdo, 'CARNE-CERDO-500G', 'Carne Cerdo 500g', 500, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_carne_cerdo, 'CARNE-CERDO-1KG', 'Carne Cerdo 1kg', 1000, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
  ON CONFLICT (codigo_sku) DO NOTHING;

  -- SKUs para Mixto Parrillero
  SELECT id INTO v_prod_mixto_parrilla FROM app.productos WHERE slug = 'mixto-parrillero-especial';
  
  INSERT INTO app.skus (id, producto_id, codigo_sku, nombre, peso_gramos, tipo_empaque, requiere_refrigeracion, unidades_por_paquete, activo, creado_por)
  VALUES
    (gen_random_uuid(), v_prod_mixto_parrilla, 'MIXTO-PARR-1KG', 'Mixto Parrillero 1kg', 1000, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_mixto_parrilla, 'MIXTO-PARR-2KG', 'Mixto Parrillero 2kg', 2000, 'empaque-vacio', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5'),
    (gen_random_uuid(), v_prod_mixto_parrilla, 'MIXTO-PARR-5KG', 'Mixto Parrillero 5kg Familiar', 5000, 'bandeja', true, 1, true, '0df6a2ea-248c-4138-bb37-2aeef0432df5')
  ON CONFLICT (codigo_sku) DO NOTHING;

  -- ====================
  -- PRECIOS VIGENTES
  -- ====================

  -- Precios Jamón Serrano
  INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta, creado_por)
  SELECT id, 
    CASE codigo_sku
      WHEN 'JAMON-SER-100G' THEN 6.50
      WHEN 'JAMON-SER-250G' THEN 15.00
      WHEN 'JAMON-SER-500G' THEN 28.00
    END,
    'USD',
    NOW(),
    NULL,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  FROM app.skus
  WHERE codigo_sku IN ('JAMON-SER-100G', 'JAMON-SER-250G', 'JAMON-SER-500G');

  -- Precios Jamón York
  INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta, creado_por)
  SELECT id,
    CASE codigo_sku
      WHEN 'JAMON-YORK-150G' THEN 3.50
      WHEN 'JAMON-YORK-300G' THEN 6.50
      WHEN 'JAMON-YORK-1KG' THEN 20.00
    END,
    'USD',
    NOW(),
    NULL,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  FROM app.skus
  WHERE codigo_sku IN ('JAMON-YORK-150G', 'JAMON-YORK-300G', 'JAMON-YORK-1KG');

  -- Precios Jamón Ahumado
  INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta, creado_por)
  SELECT id,
    CASE codigo_sku
      WHEN 'JAMON-AHU-200G' THEN 8.50
      WHEN 'JAMON-AHU-400G' THEN 16.00
    END,
    'USD',
    NOW(),
    NULL,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  FROM app.skus
  WHERE codigo_sku IN ('JAMON-AHU-200G', 'JAMON-AHU-400G');

  -- Precios Mortadela Clásica
  INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta, creado_por)
  SELECT id,
    CASE codigo_sku
      WHEN 'MORT-CLA-200G' THEN 2.50
      WHEN 'MORT-CLA-500G' THEN 5.50
      WHEN 'MORT-CLA-1KG' THEN 10.00
    END,
    'USD',
    NOW(),
    NULL,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  FROM app.skus
  WHERE codigo_sku IN ('MORT-CLA-200G', 'MORT-CLA-500G', 'MORT-CLA-1KG');

  -- Precios Mortadela con Jamón
  INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta, creado_por)
  SELECT id,
    CASE codigo_sku
      WHEN 'MORT-JAM-250G' THEN 4.00
      WHEN 'MORT-JAM-500G' THEN 7.50
    END,
    'USD',
    NOW(),
    NULL,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  FROM app.skus
  WHERE codigo_sku IN ('MORT-JAM-250G', 'MORT-JAM-500G');

  -- Precios Mortadela con Aceitunas
  INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta, creado_por)
  SELECT id,
    CASE codigo_sku
      WHEN 'MORT-ACE-250G' THEN 4.50
      WHEN 'MORT-ACE-500G' THEN 8.50
    END,
    'USD',
    NOW(),
    NULL,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  FROM app.skus
  WHERE codigo_sku IN ('MORT-ACE-250G', 'MORT-ACE-500G');

  -- Precios Salchichas Viena
  INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta, creado_por)
  SELECT id,
    CASE codigo_sku
      WHEN 'SALCHI-VIENA-250G' THEN 3.50
      WHEN 'SALCHI-VIENA-500G' THEN 6.50
      WHEN 'SALCHI-VIENA-1KG' THEN 12.00
    END,
    'USD',
    NOW(),
    NULL,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  FROM app.skus
  WHERE codigo_sku IN ('SALCHI-VIENA-250G', 'SALCHI-VIENA-500G', 'SALCHI-VIENA-1KG');

  -- Precios Salchichas Frankfurt
  INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta, creado_por)
  SELECT id,
    CASE codigo_sku
      WHEN 'SALCHI-FRANK-300G' THEN 5.00
      WHEN 'SALCHI-FRANK-750G' THEN 11.50
    END,
    'USD',
    NOW(),
    NULL,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  FROM app.skus
  WHERE codigo_sku IN ('SALCHI-FRANK-300G', 'SALCHI-FRANK-750G');

  -- Precios Salchichas Polacas
  INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta, creado_por)
  SELECT id,
    CASE codigo_sku
      WHEN 'SALCHI-POL-400G' THEN 6.50
      WHEN 'SALCHI-POL-800G' THEN 12.50
    END,
    'USD',
    NOW(),
    NULL,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  FROM app.skus
  WHERE codigo_sku IN ('SALCHI-POL-400G', 'SALCHI-POL-800G');

  -- Precios Tocino Ahumado
  INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta, creado_por)
  SELECT id,
    CASE codigo_sku
      WHEN 'TOCINO-AHU-250G' THEN 5.50
      WHEN 'TOCINO-AHU-500G' THEN 10.00
      WHEN 'TOCINO-AHU-1KG' THEN 18.00
    END,
    'USD',
    NOW(),
    NULL,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  FROM app.skus
  WHERE codigo_sku IN ('TOCINO-AHU-250G', 'TOCINO-AHU-500G', 'TOCINO-AHU-1KG');

  -- Precios Costillas Ahumadas
  INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta, creado_por)
  SELECT id,
    CASE codigo_sku
      WHEN 'COST-AHU-800G' THEN 14.00
      WHEN 'COST-AHU-1-5KG' THEN 25.00
    END,
    'USD',
    NOW(),
    NULL,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  FROM app.skus
  WHERE codigo_sku IN ('COST-AHU-800G', 'COST-AHU-1-5KG');

  -- Precios Pechuga Pavo Ahumada
  INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta, creado_por)
  SELECT id,
    CASE codigo_sku
      WHEN 'PECH-PAVO-200G' THEN 5.00
      WHEN 'PECH-PAVO-400G' THEN 9.50
      WHEN 'PECH-PAVO-1KG' THEN 22.00
    END,
    'USD',
    NOW(),
    NULL,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  FROM app.skus
  WHERE codigo_sku IN ('PECH-PAVO-200G', 'PECH-PAVO-400G', 'PECH-PAVO-1KG');

  -- Precios Chorizo Español
  INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta, creado_por)
  SELECT id,
    CASE codigo_sku
      WHEN 'CHOR-ESP-200G' THEN 7.00
      WHEN 'CHOR-ESP-400G' THEN 13.00
      WHEN 'CHOR-ESP-800G' THEN 24.00
    END,
    'USD',
    NOW(),
    NULL,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  FROM app.skus
  WHERE codigo_sku IN ('CHOR-ESP-200G', 'CHOR-ESP-400G', 'CHOR-ESP-800G');

  -- Precios Chorizo Parrillero
  INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta, creado_por)
  SELECT id,
    CASE codigo_sku
      WHEN 'CHOR-PARR-500G' THEN 8.00
      WHEN 'CHOR-PARR-1KG' THEN 15.00
    END,
    'USD',
    NOW(),
    NULL,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  FROM app.skus
  WHERE codigo_sku IN ('CHOR-PARR-500G', 'CHOR-PARR-1KG');

  -- Precios Chorizo Picante
  INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta, creado_por)
  SELECT id,
    CASE codigo_sku
      WHEN 'CHOR-PIC-300G' THEN 6.50
      WHEN 'CHOR-PIC-600G' THEN 12.00
    END,
    'USD',
    NOW(),
    NULL,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  FROM app.skus
  WHERE codigo_sku IN ('CHOR-PIC-300G', 'CHOR-PIC-600G');

  -- Precios Carne de Res
  INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta, creado_por)
  SELECT id,
    CASE codigo_sku
      WHEN 'CARNE-RES-500G' THEN 12.00
      WHEN 'CARNE-RES-1KG' THEN 22.00
      WHEN 'CARNE-RES-2KG' THEN 42.00
    END,
    'USD',
    NOW(),
    NULL,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  FROM app.skus
  WHERE codigo_sku IN ('CARNE-RES-500G', 'CARNE-RES-1KG', 'CARNE-RES-2KG');

  -- Precios Carne de Cerdo
  INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta, creado_por)
  SELECT id,
    CASE codigo_sku
      WHEN 'CARNE-CERDO-500G' THEN 9.00
      WHEN 'CARNE-CERDO-1KG' THEN 17.00
    END,
    'USD',
    NOW(),
    NULL,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  FROM app.skus
  WHERE codigo_sku IN ('CARNE-CERDO-500G', 'CARNE-CERDO-1KG');

  -- Precios Mixto Parrillero
  INSERT INTO app.precios_sku (sku_id, precio, moneda, vigente_desde, vigente_hasta, creado_por)
  SELECT id,
    CASE codigo_sku
      WHEN 'MIXTO-PARR-1KG' THEN 18.00
      WHEN 'MIXTO-PARR-2KG' THEN 34.00
      WHEN 'MIXTO-PARR-5KG' THEN 80.00
    END,
    'USD',
    NOW(),
    NULL,
    '0df6a2ea-248c-4138-bb37-2aeef0432df5'
  FROM app.skus
  WHERE codigo_sku IN ('MIXTO-PARR-1KG', 'MIXTO-PARR-2KG', 'MIXTO-PARR-5KG');

END $$;
