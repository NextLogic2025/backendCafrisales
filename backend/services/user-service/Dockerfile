# ── Etapa 1: Build ───────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

# Instalar git (requerido para dependencias de GitHub)
RUN apk add --no-cache git

WORKDIR /app

# Copiamos solo lo necesario para dependencias → mejor uso de cache
COPY package*.json ./

# npm install para proyectos sin package-lock.json
RUN npm install

# Copiamos el código fuente
COPY . .

# Construimos la aplicación (genera ./dist con main.js en la raíz)
RUN npm run build

# ── Etapa 2: Imagen final (lo más liviana posible) ───────────────────────────
FROM node:24-alpine

# Instalar git (requerido para dependencias de GitHub)
RUN apk add --no-cache git

# Por seguridad: no correr como root
USER node

WORKDIR /app

# Copiamos solo package.json para instalar solo dependencias de producción
COPY --chown=node:node package*.json ./

# Instalamos solo dependencias de producción + limpieza de cache
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

# Copiamos solo el resultado del build (dist/)
COPY --chown=node:node --from=builder /app/dist ./dist

# Si tienes archivos estáticos que deban ir en runtime (ej: uploads vacía, assets, views, etc.)
# Descomenta y ajusta según necesites:
# COPY --chown=node:node --from=builder /app/uploads ./uploads
# COPY --chown=node:node --from=builder /app/public    ./public

# Puerto (solo informativo)
EXPOSE 3000

# Comando de arranque → ¡ESTE es el punto clave para tu proyecto!
CMD ["node", "dist/main"]