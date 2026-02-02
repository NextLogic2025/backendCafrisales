swagger: '2.0'
info:
  title: Cafrilosa API Gateway
  description: Gateway unificado para los 8 microservicios de Cafrilosa
  version: 1.0.0
schemes:
  - https
produces:
  - application/json

# Definición de seguridad básica
securityDefinitions:
  api_key:
    type: "apiKey"
    name: "key"
    in: "query"

security: []

# ==================================================================
# RUTEO INTELIGENTE (CORREGIDO CON /api/v1)
# ==================================================================
paths:
  # 1. AUTH SERVICE
  /api/v1/auth/**:
    post:
      x-google-backend:
        address: ${auth_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      summary: Auth Service Endpoints
      operationId: authProxyPost
      responses:
        '200':
          description: OK
    get:
      x-google-backend:
        address: ${auth_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      summary: Auth Service Endpoints
      operationId: authProxyGet
      responses:
        '200':
          description: OK
    options:
      operationId: authCors
      responses:
        '200':
          description: OK

  # 2. USER SERVICE
  /api/v1/users/**:
    get:
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: userGet
      responses: { '200': { description: OK } }
    post:
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: userPost
      responses: { '200': { description: OK } }
    put:
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: userPut
      responses: { '200': { description: OK } }
    patch:
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: userPatch
      responses: { '200': { description: OK } }
    delete:
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: userDelete
      responses: { '200': { description: OK } }
    options:
      operationId: userCors
      responses: { '200': { description: OK } }

  # 3. CATALOG SERVICE
  /api/v1/catalog/**:
    get:
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: catalogGet
      responses: { '200': { description: OK } }
    post:
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: catalogPost
      responses: { '200': { description: OK } }
    put:
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: catalogPut
      responses: { '200': { description: OK } }
    options:
      operationId: catalogCors
      responses: { '200': { description: OK } }

  # 4. ORDER SERVICE
  /api/v1/orders/**:
    get:
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: orderGet
      responses: { '200': { description: OK } }
    post:
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: orderPost
      responses: { '200': { description: OK } }
    patch:
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: orderPatch
      responses: { '200': { description: OK } }
    options:
      operationId: orderCors
      responses: { '200': { description: OK } }

  # 5. ZONE SERVICE
  /api/v1/zones/**:
    get:
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: zoneGet
      responses: { '200': { description: OK } }
    post:
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: zonePost
      responses: { '200': { description: OK } }
    options:
      operationId: zoneCors
      responses: { '200': { description: OK } }

  # 6. CREDIT SERVICE
  /api/v1/credits/**:
    get:
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: creditGet
      responses: { '200': { description: OK } }
    post:
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: creditPost
      responses: { '200': { description: OK } }
    put:
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: creditPut
      responses: { '200': { description: OK } }
    options:
      operationId: creditCors
      responses: { '200': { description: OK } }

  # 7. ROUTE SERVICE
  /api/v1/routes/**:
    get:
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: routeGet
      responses: { '200': { description: OK } }
    post:
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: routePost
      responses: { '200': { description: OK } }
    options:
      operationId: routeCors
      responses: { '200': { description: OK } }

  # 8. DELIVERY SERVICE
  /api/v1/deliveries/**:
    get:
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: deliveryGet
      responses: { '200': { description: OK } }
    post:
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: deliveryPost
      responses: { '200': { description: OK } }
    put:
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      operationId: deliveryPut
      responses: { '200': { description: OK } }
    options:
      operationId: deliveryCors
      responses: { '200': { description: OK } }

# ==================================================================
# CORS GLOBAL CATCH-ALL
# ==================================================================
  /**:
    options:
      description: CORS Preflight Global
      operationId: corsGlobal
      x-google-backend:
        address: ${auth_url} 
        deadline: 1.0
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
              default: 'Authorization, Content-Type, X-Api-Key'