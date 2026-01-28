import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),

    // Main DB (cafrilosa_notificaciones)
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().default(5432),
    DB_USER: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_NAME: Joi.string().default('cafrilosa_notificaciones'),
    DB_LOGGING: Joi.boolean().default(false),

    // Order DB connection (cafrilosa_pedidos)
    ORDER_DB_HOST: Joi.string().required(),
    ORDER_DB_PORT: Joi.number().default(5432),
    ORDER_DB_USER: Joi.string().required(),
    ORDER_DB_PASSWORD: Joi.string().required(),
    ORDER_DB_NAME: Joi.string().default('cafrilosa_pedidos'),

    // Redis (optional for now)
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().allow('').optional(),

    // JWT
    JWT_SECRET: Joi.string().required(),
});
