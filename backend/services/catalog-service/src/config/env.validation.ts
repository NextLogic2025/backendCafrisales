import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  // Base de Datos (Híbrido: URL local u opciones Cloud)
  DATABASE_URL: Joi.string().uri().optional(),
  DB_HOST: Joi.string().optional(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().optional(),
  DB_PASSWORD: Joi.string().optional(),
  DB_NAME: Joi.string().optional(),

  // Comunicación entre servicios
  AUTH_URL: Joi.string().uri().optional().default('http://auth-service:3000'),
  USUARIOS_URL: Joi.string().uri().optional().default('http://user-service:3000'),
  SERVICE_TOKEN: Joi.string().optional(), // Token interno si lo usas
});