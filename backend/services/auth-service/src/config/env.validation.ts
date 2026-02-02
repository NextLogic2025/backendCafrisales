import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  JWT_SECRET: Joi.string().required(),

  // OPCIÓN A: Conexión por URL (Típico en Local)
  DATABASE_URL: Joi.string().uri().optional(),

  // OPCIÓN B: Conexión Desglosada (Típico en Cloud Run / Producción con Secretos)
  // Los hacemos opcionales aquí porque Joi valida la estructura,
  // pero TypeORM es quien realmente intentará usarlos.
  DB_HOST: Joi.string().optional(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().optional(),
  DB_PASSWORD: Joi.string().optional(),
  DB_NAME: Joi.string().optional(),
  
  // Soporte para los alias que pusimos en Cloud Build para asegurar compatibilidad
  DB_USERNAME: Joi.string().optional(),
  DB_DATABASE: Joi.string().optional(),
  DB_SCHEMA: Joi.string().default('public'),
});