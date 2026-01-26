-- Asegúrate de estar conectado a la base de datos correcta
\c cafrilosa_auth

DO $$
DECLARE
    v_supervisor_id uuid;
    v_email citext := 'supervisor.admin@cafrilosa.com';
    v_password_hash text := '$argon2id$v=19$m=4096,t=3,p=1$c29tZXNhbHQ$c29tZWhhc2g='; -- EJEMPLO de hash
BEGIN
    -- Insertar credencial y CAPTURAR el ID generado
    INSERT INTO app.credenciales (email, password_hash)
    VALUES (v_email, v_password_hash)
    RETURNING usuario_id INTO v_supervisor_id; -- Captura el UUID generado aquí

    RAISE NOTICE 'AUTH-SERVICE: Usuario "%" creado con ID: %', v_email, v_supervisor_id;
END$$;




DO $$
DECLARE
    -- **PEGA AQUÍ EL UUID EXACTO** que capturaste del Paso 2
    v_supervisor_id uuid := 'EL_UUID_QUE_COPIASTE_AQUI'; 
    
    v_email citext := 'supervisor.admin@cafrilosa.com';
    v_nombres varchar(100) := 'Mario';
    v_apellidos varchar(100) := 'Bravo';
    v_codigo_empleado varchar(50) := 'SUP001';
BEGIN

    -- 1. Insertar el usuario base en app.usuarios usando el ID predefinido
    INSERT INTO app.usuarios (id, email, rol, estado)
    VALUES (v_supervisor_id, v_email, 'supervisor'::rol_usuario, 'activo'::estado_usuario);

    -- 2. Insertar el perfil de usuario (usa el mismo ID)
    INSERT INTO app.perfiles_usuario (usuario_id, nombres, apellidos, telefono)
    VALUES (v_supervisor_id, v_nombres, v_apellidos, '0991234567');

    -- 3. Insertar el registro específico de supervisor (usa el mismo ID)
    INSERT INTO app.supervisores (usuario_id, codigo_empleado)
    VALUES (v_supervisor_id, v_codigo_empleado);

    RAISE NOTICE 'USER-SERVICE: Perfil de supervisor completado para ID: %', v_supervisor_id;

EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'Error de unicidad en USER-SERVICE. Verifique si el ID o el email ya existen.';
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrió un error inesperado durante la inserción en USER-SERVICE: %', SQLERRM;
END$$;