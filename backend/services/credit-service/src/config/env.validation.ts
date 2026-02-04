import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),

    // Lógica Híbrida: DATABASE_URL o variables individuales (DB_HOST, etc.)
    DATABASE_URL: Joi.string().optional(),
    DB_HOST: Joi.string().optional(),
    DB_PORT: Joi.number().default(5432),
    DB_USER: Joi.string().optional(),
    DB_PASSWORD: Joi.string().optional(),
    DB_NAME: Joi.string().optional(),

    JWT_SECRET: Joi.string().required(),
    SERVICE_TOKEN: Joi.string().required(),
    ORDER_SERVICE_URL: Joi.string().default('http://order-service:3000'),
    USER_SERVICE_URL: Joi.string().default('http://user-service:3000'),
}).or('DATABASE_URL', 'DB_HOST');
