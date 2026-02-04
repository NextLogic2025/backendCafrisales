import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  // Base de Datos
  DATABASE_URL: Joi.string().uri().optional(),
  DB_HOST: Joi.string().optional(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().optional(),
  DB_PASSWORD: Joi.string().optional(),
  DB_NAME: Joi.string().optional(),

  JWT_SECRET: Joi.string().optional(), // Puede ser opcional si User solo confía en el Token interno
  
  // --- SEGURIDAD ENTRE SERVICIOS ---
  // CAMBIO: Debe ser REQUIRED para poder validar a Auth-Service
  SERVICE_TOKEN: Joi.string().required(), 
  
}).or('DATABASE_URL', 'DB_HOST');