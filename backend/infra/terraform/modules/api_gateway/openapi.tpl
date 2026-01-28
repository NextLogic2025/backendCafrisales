swagger: '2.0'
info:
  title: Cafrilosa API Gateway
  description: Gateway unificado para los 8 microservicios de Cafrilosa
  version: 1.0.0
schemes:
  - https
produces:
  - application/json
  
# ==================================================================
# RUTEO INTELIGENTE POR PREFIJO
# ==================================================================
paths:
  # 1. AUTH SERVICE (/auth/login, /auth/register...)
  /auth/{proxy+}:
    x-google-backend:
      address: ${auth_url}
      path_translation: APPEND_PATH_TO_ADDRESS
    post:
      summary: Auth Service Endpoints
      operationId: authProxyPost
      responses:
        '200':
          description: OK
    get:
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

  # 2. USER SERVICE (/users/profile, /users/staff...)
  /users/{proxy+}:
    x-google-backend:
      address: ${user_url}
      path_translation: APPEND_PATH_TO_ADDRESS
    get:
      operationId: userGet
      responses: { '200': { description: OK } }
    post:
      operationId: userPost
      responses: { '200': { description: OK } }
    put:
      operationId: userPut
      responses: { '200': { description: OK } }
    patch:
      operationId: userPatch
      responses: { '200': { description: OK } }
    delete:
      operationId: userDelete
      responses: { '200': { description: OK } }
    options:
      operationId: userCors
      responses: { '200': { description: OK } }

  # 3. CATALOG SERVICE (/catalog/products, /catalog/prices...)
  /catalog/{proxy+}:
    x-google-backend:
      address: ${catalog_url}
      path_translation: APPEND_PATH_TO_ADDRESS
    get:
      operationId: catalogGet
      responses: { '200': { description: OK } }
    post:
      operationId: catalogPost
      responses: { '200': { description: OK } }
    put:
      operationId: catalogPut
      responses: { '200': { description: OK } }
    options:
      operationId: catalogCors
      responses: { '200': { description: OK } }

  # 4. ORDER SERVICE (/orders/create, /orders/list...)
  /orders/{proxy+}:
    x-google-backend:
      address: ${order_url}
      path_translation: APPEND_PATH_TO_ADDRESS
    get:
      operationId: orderGet
      responses: { '200': { description: OK } }
    post:
      operationId: orderPost
      responses: { '200': { description: OK } }
    patch:
      operationId: orderPatch
      responses: { '200': { description: OK } }
    options:
      operationId: orderCors
      responses: { '200': { description: OK } }

  # 5. ZONE SERVICE (/zones/coverage...)
  /zones/{proxy+}:
    x-google-backend:
      address: ${zone_url}
      path_translation: APPEND_PATH_TO_ADDRESS
    get:
      operationId: zoneGet
      responses: { '200': { description: OK } }
    post:
      operationId: zonePost
      responses: { '200': { description: OK } }
    options:
      operationId: zoneCors
      responses: { '200': { description: OK } }

  # 6. CREDIT SERVICE (/credits/check...)
  /credits/{proxy+}:
    x-google-backend:
      address: ${credit_url}
      path_translation: APPEND_PATH_TO_ADDRESS
    get:
      operationId: creditGet
      responses: { '200': { description: OK } }
    post:
      operationId: creditPost
      responses: { '200': { description: OK } }
    put:
      operationId: creditPut
      responses: { '200': { description: OK } }
    options:
      operationId: creditCors
      responses: { '200': { description: OK } }

  # 7. ROUTE SERVICE (/routes/plan...)
  /routes/{proxy+}:
    x-google-backend:
      address: ${route_url}
      path_translation: APPEND_PATH_TO_ADDRESS
    get:
      operationId: routeGet
      responses: { '200': { description: OK } }
    post:
      operationId: routePost
      responses: { '200': { description: OK } }
    options:
      operationId: routeCors
      responses: { '200': { description: OK } }

  # 8. DELIVERY SERVICE (/deliveries/evidence...)
  /deliveries/{proxy+}:
    x-google-backend:
      address: ${delivery_url}
      path_translation: APPEND_PATH_TO_ADDRESS
    get:
      operationId: deliveryGet
      responses: { '200': { description: OK } }
    post:
      operationId: deliveryPost
      responses: { '200': { description: OK } }
    put:
      operationId: deliveryPut
      responses: { '200': { description: OK } }
    options:
      operationId: deliveryCors
      responses: { '200': { description: OK } }

# ==================================================================
# CORS GLOBAL (Permitir acceso desde Web y Móvil)
# ==================================================================
  /{proxy+}:
    options:
      description: CORS Preflight
      operationId: corsGlobal
      x-google-backend:
        address: ${auth_url} # Usamos auth como dummy para responder el OPTIONS
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