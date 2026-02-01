# ── Etapa 1: Build ───────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

# Instalar git (necesario para algunas dependencias)
RUN apk add --no-cache git

WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos TODAS las dependencias (incluyendo dev) para poder compilar
RUN npm install

# Copiamos el código fuente
COPY . .

# Construimos la aplicación (NestJS genera dist/main.js por defecto)
RUN npm run build

# ── Etapa 2: Imagen final (Producción) ───────────────────────────────────────
FROM node:24-alpine

# Instalar git nuevamente si es necesario en runtime (opcional, pero seguro dejarlo)
RUN apk add --no-cache git

# 🔥 CORRECCIÓN CRÍTICA DE PERMISOS 🔥
# Creamos la carpeta y le damos dueño ANTES de cambiar de usuario.
WORKDIR /app
RUN chown node:node /app

# Ahora sí cambiamos al usuario seguro 'node'
USER node

# Copiamos package.json con los permisos correctos
COPY --chown=node:node package*.json ./

# Instalamos solo dependencias de producción (más ligero y seguro)
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

# Copiamos el código compilado desde la etapa anterior
COPY --chown=node:node --from=builder /app/dist ./dist

# Puerto informativo
EXPOSE 3000

# ✅ EL COMANDO DE TU COMPAÑERO (Limpio y estándar)
CMD ["node", "dist/main"]