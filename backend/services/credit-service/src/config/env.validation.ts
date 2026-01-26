import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    SERVICE_TOKEN: Joi.string().required(),
    ORDER_SERVICE_URL: Joi.string().default('http://order-service:3000'),
    USER_SERVICE_URL: Joi.string().default('http://user-service:3000'),
});
