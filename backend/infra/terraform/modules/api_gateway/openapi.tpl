swagger: '2.0'
info:
  title: Cafrilosa API Gateway
  description: Gateway unificado para los 8 microservicios de Cafrilosa
  version: 1.0.0
schemes:
  - https
produces:
  - application/json

security: []

# ==================================================================
# RUTEO INTELIGENTE (Sintaxis Correcta: /**)
# Corrección: Direcciones SIN "/api" al final
# ==================================================================
paths:
  # 1. AUTH SERVICE
  /api/v1/auth/**:
    get:
      summary: Auth Get
      operationId: authApiV1Get
      x-google-backend:
        address: ${auth_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK
    post:
      summary: Auth Post
      operationId: authApiV1Post
      x-google-backend:
        address: ${auth_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK
    options:
      summary: Auth Cors
      operationId: authApiV1Cors
      x-google-backend:
        address: ${auth_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK

  /auth/**:
    get:
      operationId: authGet
      x-google-backend:
        address: ${auth_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: authPost
      x-google-backend:
        address: ${auth_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: authCors
      x-google-backend:
        address: ${auth_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  # 2. USER SERVICE
  /api/v1/users:
    get:
      operationId: usersApiV1GetBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: usersApiV1PostBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: usersApiV1PutBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: usersApiV1PatchBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: usersApiV1DeleteBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: usersApiV1CorsBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/users/**:
    get:
      operationId: userApiV1Get
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: userApiV1Post
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: userApiV1Put
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: userApiV1Patch
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: userApiV1Delete
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: userApiV1Cors
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/usuarios:
    get:
      operationId: usuariosApiV1GetBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: usuariosApiV1PostBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: usuariosApiV1PutBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: usuariosApiV1PatchBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: usuariosApiV1DeleteBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: usuariosApiV1CorsBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/usuarios/**:
    get:
      operationId: usuariosApiV1Get
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: usuariosApiV1Post
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: usuariosApiV1Put
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: usuariosApiV1Patch
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: usuariosApiV1Delete
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: usuariosApiV1Cors
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/clientes:
    get:
      operationId: clientesApiV1GetBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: clientesApiV1PostBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: clientesApiV1PutBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: clientesApiV1PatchBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: clientesApiV1DeleteBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: clientesApiV1CorsBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/clientes/**:
    get:
      operationId: clientesApiV1Get
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: clientesApiV1Post
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: clientesApiV1Put
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: clientesApiV1Patch
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: clientesApiV1Delete
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: clientesApiV1Cors
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/canales:
    get:
      operationId: canalesApiV1GetBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: canalesApiV1PostBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: canalesApiV1PutBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: canalesApiV1PatchBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: canalesApiV1DeleteBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: canalesApiV1CorsBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/canales/**:
    get:
      operationId: canalesApiV1Get
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: canalesApiV1Post
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: canalesApiV1Put
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: canalesApiV1Patch
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: canalesApiV1Delete
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: canalesApiV1Cors
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/staff:
    get:
      operationId: staffApiV1GetBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: staffApiV1PostBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: staffApiV1PutBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: staffApiV1PatchBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: staffApiV1DeleteBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: staffApiV1CorsBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/staff/**:
    get:
      operationId: staffApiV1Get
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: staffApiV1Post
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: staffApiV1Put
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: staffApiV1Patch
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: staffApiV1Delete
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: staffApiV1Cors
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/vendedores:
    get:
      operationId: vendedoresApiV1GetBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: vendedoresApiV1CorsBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/vendedores/**:
    get:
      operationId: vendedoresApiV1Get
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: vendedoresApiV1Cors
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/zonas:
    get:
      operationId: zonasUsuariosApiV1GetBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: zonasUsuariosApiV1CorsBase
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/zonas/**:
    get:
      operationId: zonasUsuariosApiV1Get
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: zonasUsuariosApiV1Cors
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/internal/usuarios/**:
    get:
      operationId: usuariosInternalApiV1Get
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: usuariosInternalApiV1Post
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: usuariosInternalApiV1Cors
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/internal/clientes/**:
    get:
      operationId: clientesInternalApiV1Get
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: clientesInternalApiV1Post
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: clientesInternalApiV1Cors
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /users/**:
    get:
      operationId: userGet
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: userPost
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: userPut
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: userPatch
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: userDelete
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: userCors
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  # 3. CATALOG SERVICE
  /api/v1/catalog/**:
    get:
      operationId: catalogApiV1Get
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: catalogApiV1Post
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: catalogApiV1Put
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: catalogApiV1Cors
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/skus:
    get:
      operationId: skusApiV1GetBase
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: skusApiV1PostBase
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: skusApiV1CorsBase
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/skus/**:
    get:
      operationId: skusApiV1Get
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: skusApiV1Post
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: skusApiV1Put
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: skusApiV1Patch
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: skusApiV1Delete
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: skusApiV1Cors
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/internal/skus/**:
    get:
      operationId: skusInternalApiV1Get
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: skusInternalApiV1Post
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: skusInternalApiV1Cors
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/products:
    get:
      operationId: productsApiV1GetBase
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: productsApiV1PostBase
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: productsApiV1CorsBase
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/products/**:
    get:
      operationId: productsApiV1Get
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: productsApiV1Post
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: productsApiV1Put
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: productsApiV1Patch
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: productsApiV1Delete
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: productsApiV1Cors
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/categorias:
    get:
      operationId: categoriasApiV1GetBase
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: categoriasApiV1PostBase
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: categoriasApiV1CorsBase
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/categorias/**:
    get:
      operationId: categoriasApiV1Get
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: categoriasApiV1Post
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: categoriasApiV1Put
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: categoriasApiV1Patch
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: categoriasApiV1Delete
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: categoriasApiV1Cors
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /catalog/**:
    get:
      operationId: catalogGet
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: catalogPost
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: catalogPut
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: catalogCors
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  # 4. ORDER SERVICE
  /api/v1/orders:
    get:
      operationId: ordersApiV1GetBase
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: ordersApiV1PostBase
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: ordersApiV1CorsBase
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/orders/**:
    get:
      operationId: orderApiV1Get
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: orderApiV1Post
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: orderApiV1Put
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: orderApiV1Patch
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: orderApiV1Delete
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: orderApiV1Cors
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/internal/pedidos/**:
    get:
      operationId: pedidosInternalApiV1Get
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: pedidosInternalApiV1Post
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: pedidosInternalApiV1Patch
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: pedidosInternalApiV1Cors
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/validations:
    post:
      operationId: validationsApiV1PostBase
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: validationsApiV1CorsBase
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/validations/**:
    get:
      operationId: validationsApiV1Get
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: validationsApiV1Post
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: validationsApiV1Cors
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /orders/**:
    get:
      operationId: orderGet
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: orderPost
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: orderPatch
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: orderCors
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  # 5. ZONE SERVICE
  /api/v1/zones:
    get:
      operationId: zonesApiV1GetBase
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: zonesApiV1PostBase
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: zonesApiV1CorsBase
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/zones/**:
    get:
      operationId: zoneApiV1Get
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: zoneApiV1Post
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: zoneApiV1Cors
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/internal/zones/**:
    get:
      operationId: zonesInternalApiV1Get
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: zonesInternalApiV1Post
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: zonesInternalApiV1Cors
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/coverage:
    post:
      operationId: coverageApiV1PostBase
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: coverageApiV1CorsBase
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/coverage/**:
    get:
      operationId: coverageApiV1Get
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: coverageApiV1Post
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: coverageApiV1Put
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: coverageApiV1Patch
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: coverageApiV1Delete
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: coverageApiV1Cors
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/schedules:
    get:
      operationId: schedulesApiV1GetBase
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: schedulesApiV1PostBase
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: schedulesApiV1CorsBase
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/schedules/**:
    get:
      operationId: schedulesApiV1Get
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: schedulesApiV1Post
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: schedulesApiV1Put
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: schedulesApiV1Patch
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: schedulesApiV1Delete
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: schedulesApiV1Cors
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /zones/**:
    get:
      operationId: zoneGet
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: zonePost
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: zoneCors
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  # 6. CREDIT SERVICE
  /api/v1/credits:
    get:
      operationId: creditApiV1GetBase
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: creditApiV1CorsBase
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/credits/**:
    get:
      operationId: creditApiV1Get
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: creditApiV1Post
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: creditApiV1Put
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: creditApiV1Cors
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/creditos:
    get:
      operationId: creditosApiV1GetBase
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: creditosApiV1CorsBase
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/creditos/**:
    get:
      operationId: creditosApiV1Get
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: creditosApiV1Post
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: creditosApiV1Put
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: creditosApiV1Patch
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: creditosApiV1Delete
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: creditosApiV1Cors
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/reports:
    get:
      operationId: reportsApiV1GetBase
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: reportsApiV1CorsBase
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/reports/**:
    get:
      operationId: reportsApiV1Get
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: reportsApiV1Post
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: reportsApiV1Cors
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /credits/**:
    get:
      operationId: creditGet
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: creditPost
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: creditPut
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: creditCors
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  # 7. ROUTE SERVICE
  /api/v1/routes:
    get:
      operationId: routeApiV1GetBase
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: routeApiV1PostBase
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: routeApiV1CorsBase
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/routes/**:
    get:
      operationId: routeApiV1Get
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: routeApiV1Post
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: routeApiV1Put
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: routeApiV1Delete
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: routeApiV1Cors
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/ruteros-comerciales:
    get:
      operationId: ruterosComercialesApiV1GetBase
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: ruterosComercialesApiV1PostBase
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: ruterosComercialesApiV1CorsBase
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/ruteros-comerciales/**:
    get:
      operationId: ruterosComercialesApiV1Get
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: ruterosComercialesApiV1Post
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: ruterosComercialesApiV1Put
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: ruterosComercialesApiV1Patch
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: ruterosComercialesApiV1Delete
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: ruterosComercialesApiV1Cors
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/paradas-comerciales/**:
    get:
      operationId: paradasComercialesApiV1Get
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: paradasComercialesApiV1Post
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: paradasComercialesApiV1Put
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: paradasComercialesApiV1Patch
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: paradasComercialesApiV1Delete
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: paradasComercialesApiV1Cors
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /routes/**:
    get:
      operationId: routeGet
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: routePost
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: routeCors
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  # 7.1 FLEET (VEHICULOS) - ROUTE SERVICE
  /api/v1/vehiculos:
    get:
      operationId: vehiculosApiV1GetBase
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: vehiculosApiV1PostBase
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: vehiculosApiV1PutBase
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: vehiculosApiV1PatchBase
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: vehiculosApiV1DeleteBase
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: vehiculosApiV1CorsBase
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/vehiculos/**:
    get:
      operationId: vehiculosApiV1Get
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: vehiculosApiV1Post
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: vehiculosApiV1Put
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: vehiculosApiV1Patch
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: vehiculosApiV1Delete
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: vehiculosApiV1Cors
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /vehiculos/**:
    get:
      operationId: vehiculosGet
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: vehiculosPost
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: vehiculosPut
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: vehiculosPatch
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: vehiculosDelete
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: vehiculosCors
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  # 8. DELIVERY SERVICE
  /api/v1/deliveries:
    get:
      operationId: deliveryApiV1GetBase
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: deliveryApiV1CorsBase
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/deliveries/**:
    get:
      operationId: deliveryApiV1Get
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: deliveryApiV1Post
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: deliveryApiV1Put
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: deliveryApiV1Patch
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: deliveryApiV1Delete
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: deliveryApiV1Cors
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/entregas/**:
    get:
      operationId: entregasApiV1Get
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: entregasApiV1Post
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: entregasApiV1Put
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: entregasApiV1Patch
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: entregasApiV1Delete
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: entregasApiV1Cors
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /deliveries/**:
    get:
      operationId: deliveryGet
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: deliveryPost
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: deliveryPut
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: deliveryCors
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  # 9. NOTIFICATION SERVICE (REST)
  /api/v1/notifications:
    get:
      operationId: notificationsApiV1GetBase
      x-google-backend:
        address: ${notification_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: notificationsApiV1PostBase
      x-google-backend:
        address: ${notification_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: notificationsApiV1CorsBase
      x-google-backend:
        address: ${notification_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  /api/v1/notifications/**:
    get:
      operationId: notificationsApiV1Get
      x-google-backend:
        address: ${notification_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    post:
      operationId: notificationsApiV1Post
      x-google-backend:
        address: ${notification_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    put:
      operationId: notificationsApiV1Put
      x-google-backend:
        address: ${notification_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    patch:
      operationId: notificationsApiV1Patch
      x-google-backend:
        address: ${notification_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    delete:
      operationId: notificationsApiV1Delete
      x-google-backend:
        address: ${notification_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }
    options:
      operationId: notificationsApiV1Cors
      x-google-backend:
        address: ${notification_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses: { '200': { description: OK } }

  # CORS GLOBAL CATCH-ALL
  /**:
    options:
      operationId: corsGlobal
      x-google-backend:
        address: ${auth_url}
        deadline: 30.0
      responses:
        '200':
          description: OK
          headers:
            Access-Control-Allow-Origin:
              type: string
              default: '*'
            Access-Control-Allow-Methods:
              type: string
              default: 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
            Access-Control-Allow-Headers:
              type: string
              default: 'Authorization, Content-Type, X-Api-Key, X-Service-Token'
