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
# Soporta tanto /auth/* como /api/v1/auth/* para compatibilidad
# x-google-backend DEBE estar a nivel de operación, NO de path
# ==================================================================
paths:
  # ================================================================
  # AUTH SERVICE - Rutas /api/v1/auth/*
  # ================================================================
  /api/v1/auth/{proxy+}:
    get:
      operationId: authApiV1Get
      x-google-backend:
        address: ${auth_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    post:
      operationId: authApiV1Post
      x-google-backend:
        address: ${auth_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    options:
      operationId: authApiV1Cors
      x-google-backend:
        address: ${auth_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK

  # AUTH SERVICE - Rutas legacy /auth/*
  /auth/{proxy+}:
    get:
      operationId: authGet
      x-google-backend:
        address: ${auth_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    post:
      operationId: authPost
      x-google-backend:
        address: ${auth_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    options:
      operationId: authCors
      x-google-backend:
        address: ${auth_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK

  # ================================================================
  # USER SERVICE - Rutas /api/v1/users/*
  # ================================================================
  /api/v1/users/{proxy+}:
    get:
      operationId: userApiV1Get
      x-google-backend:
        address: ${user_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    post:
      operationId: userApiV1Post
      x-google-backend:
        address: ${user_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    put:
      operationId: userApiV1Put
      x-google-backend:
        address: ${user_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    patch:
      operationId: userApiV1Patch
      x-google-backend:
        address: ${user_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    delete:
      operationId: userApiV1Delete
      x-google-backend:
        address: ${user_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    options:
      operationId: userApiV1Cors
      x-google-backend:
        address: ${user_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK

  # USER SERVICE - Rutas legacy /users/*
  /users/{proxy+}:
    get:
      operationId: userGet
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    post:
      operationId: userPost
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    put:
      operationId: userPut
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    patch:
      operationId: userPatch
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    delete:
      operationId: userDelete
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    options:
      operationId: userCors
      x-google-backend:
        address: ${user_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK

  # ================================================================
  # CATALOG SERVICE - Rutas /api/v1/catalog/*
  # ================================================================
  /api/v1/catalog/{proxy+}:
    get:
      operationId: catalogApiV1Get
      x-google-backend:
        address: ${catalog_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    post:
      operationId: catalogApiV1Post
      x-google-backend:
        address: ${catalog_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    put:
      operationId: catalogApiV1Put
      x-google-backend:
        address: ${catalog_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    options:
      operationId: catalogApiV1Cors
      x-google-backend:
        address: ${catalog_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK

  # CATALOG SERVICE - Rutas legacy /catalog/*
  /catalog/{proxy+}:
    get:
      operationId: catalogGet
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    post:
      operationId: catalogPost
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    put:
      operationId: catalogPut
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    options:
      operationId: catalogCors
      x-google-backend:
        address: ${catalog_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK

  # ================================================================
  # ORDER SERVICE - Rutas /api/v1/orders/*
  # ================================================================
  /api/v1/orders/{proxy+}:
    get:
      operationId: orderApiV1Get
      x-google-backend:
        address: ${order_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    post:
      operationId: orderApiV1Post
      x-google-backend:
        address: ${order_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    patch:
      operationId: orderApiV1Patch
      x-google-backend:
        address: ${order_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    options:
      operationId: orderApiV1Cors
      x-google-backend:
        address: ${order_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK

  # ORDER SERVICE - Rutas legacy /orders/*
  /orders/{proxy+}:
    get:
      operationId: orderGet
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    post:
      operationId: orderPost
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    patch:
      operationId: orderPatch
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    options:
      operationId: orderCors
      x-google-backend:
        address: ${order_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK

  # ================================================================
  # ZONE SERVICE - Rutas /api/v1/zones/*
  # ================================================================
  /api/v1/zones/{proxy+}:
    get:
      operationId: zoneApiV1Get
      x-google-backend:
        address: ${zone_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    post:
      operationId: zoneApiV1Post
      x-google-backend:
        address: ${zone_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    options:
      operationId: zoneApiV1Cors
      x-google-backend:
        address: ${zone_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK

  # ZONE SERVICE - Rutas legacy /zones/*
  /zones/{proxy+}:
    get:
      operationId: zoneGet
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    post:
      operationId: zonePost
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    options:
      operationId: zoneCors
      x-google-backend:
        address: ${zone_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK

  # ================================================================
  # CREDIT SERVICE - Rutas /api/v1/credits/*
  # ================================================================
  /api/v1/credits/{proxy+}:
    get:
      operationId: creditApiV1Get
      x-google-backend:
        address: ${credit_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    post:
      operationId: creditApiV1Post
      x-google-backend:
        address: ${credit_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    put:
      operationId: creditApiV1Put
      x-google-backend:
        address: ${credit_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    options:
      operationId: creditApiV1Cors
      x-google-backend:
        address: ${credit_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK

  # CREDIT SERVICE - Rutas legacy /credits/*
  /credits/{proxy+}:
    get:
      operationId: creditGet
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    post:
      operationId: creditPost
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    put:
      operationId: creditPut
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    options:
      operationId: creditCors
      x-google-backend:
        address: ${credit_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK

  # ================================================================
  # ROUTE SERVICE - Rutas /api/v1/routes/*
  # ================================================================
  /api/v1/routes/{proxy+}:
    get:
      operationId: routeApiV1Get
      x-google-backend:
        address: ${route_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    post:
      operationId: routeApiV1Post
      x-google-backend:
        address: ${route_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    options:
      operationId: routeApiV1Cors
      x-google-backend:
        address: ${route_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK

  # ROUTE SERVICE - Rutas legacy /routes/*
  /routes/{proxy+}:
    get:
      operationId: routeGet
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    post:
      operationId: routePost
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    options:
      operationId: routeCors
      x-google-backend:
        address: ${route_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK

  # ================================================================
  # DELIVERY SERVICE - Rutas /api/v1/deliveries/*
  # ================================================================
  /api/v1/deliveries/{proxy+}:
    get:
      operationId: deliveryApiV1Get
      x-google-backend:
        address: ${delivery_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    post:
      operationId: deliveryApiV1Post
      x-google-backend:
        address: ${delivery_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    put:
      operationId: deliveryApiV1Put
      x-google-backend:
        address: ${delivery_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    options:
      operationId: deliveryApiV1Cors
      x-google-backend:
        address: ${delivery_url}/api
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK

  # DELIVERY SERVICE - Rutas legacy /deliveries/*
  /deliveries/{proxy+}:
    get:
      operationId: deliveryGet
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    post:
      operationId: deliveryPost
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    put:
      operationId: deliveryPut
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
      responses:
        '200':
          description: OK
    options:
      operationId: deliveryCors
      x-google-backend:
        address: ${delivery_url}
        path_translation: APPEND_PATH_TO_ADDRESS
        deadline: 30.0
      responses:
        '200':
          description: OK

  # ================================================================
  # CORS GLOBAL - Catch-all para preflight requests
  # ================================================================
  /api/v1/{proxy+}:
    options:
      operationId: corsApiV1Global
      x-google-backend:
        address: ${auth_url}
        deadline: 30.0
      responses:
        '200':
          description: CORS Preflight
          headers:
            Access-Control-Allow-Origin:
              type: string
            Access-Control-Allow-Methods:
              type: string
            Access-Control-Allow-Headers:
              type: string
            Access-Control-Allow-Credentials:
              type: string

  /{proxy+}:
    options:
      operationId: corsGlobal
      x-google-backend:
        address: ${auth_url}
        deadline: 30.0
      responses:
        '200':
          description: CORS Preflight
          headers:
            Access-Control-Allow-Origin:
              type: string
            Access-Control-Allow-Methods:
              type: string
            Access-Control-Allow-Headers:
              type: string
            Access-Control-Allow-Credentials:
              type: string
