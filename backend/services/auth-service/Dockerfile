FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache git && npm install
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache git && npm install --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/src/main"]
