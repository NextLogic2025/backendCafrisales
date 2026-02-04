import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Entorno y Puerto
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  // Base de Datos (Lógica Híbrida)
  DATABASE_URL: Joi.string().uri().optional(),
  DB_HOST: Joi.string().optional(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().optional(),
  DB_PASSWORD: Joi.string().optional(),
  DB_NAME: Joi.string().optional(),

  // Seguridad JWT
  JWT_SECRET: Joi.string().required(),

  // --- COMUNICACIÓN ENTRE MICROSERVICIOS (S2S) ---
  
  // 1. TOKEN DE SEGURIDAD INTERNA
  // Lo hacemos REQUERIDO. Si no hay token, no permitimos que el servicio arranque.
  // Esto asegura que Auth pueda autenticarse contra User-Service.
  SERVICE_TOKEN: Joi.string().required(),

  // 2. URL DEL SERVICIO DE USUARIOS
  // Agregamos esta validación crítica.
  // - En Cloud Run: Será 'https://user-service-xyz.run.app'
  // - En Local: Debes asegurarte de tenerla en tu .env (ej: 'http://localhost:3001' o 'http://user-service:3000')
  USUARIOS_SERVICE_URL: Joi.string().uri().required(),

}).or('DATABASE_URL', 'DB_HOST');