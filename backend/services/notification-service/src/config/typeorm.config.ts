import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const isProduction = process.env.NODE_ENV === 'production';

export const typeormConfig = registerAs(
    'typeorm',
    (): TypeOrmModuleOptions => ({
        type: 'postgres',
        // Aquí ya usabas variables separadas, perfecto. Solo aseguramos fallback
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'cafrilosa_notificaciones',
        entities: [__dirname + '/../**/*.entity.{js,ts}'],
        
        synchronize: true, // <--- ACTIVADO para crear tablas propias
        logging: process.env.DB_LOGGING === 'true',
        ssl: isProduction ? { rejectUnauthorized: false } : false,
    }),
);

// Configuración para conexión a order-service outbox
export const orderDbConfig = registerAs(
    'orderDb',
    (): TypeOrmModuleOptions => ({
        name: 'orderConnection',
        type: 'postgres',
        host: process.env.ORDER_DB_HOST || 'localhost',
        port: parseInt(process.env.ORDER_DB_PORT, 10) || 5432,
        username: process.env.ORDER_DB_USER || 'postgres',
        password: process.env.ORDER_DB_PASSWORD || 'postgres',
        database: process.env.ORDER_DB_NAME || 'cafrilosa_pedidos',
        entities: [__dirname + '/../modules/consumers/*.service.{js,ts}'],
        
        synchronize: false, // Este NO debe crear tablas, solo lee
        logging: false,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
    }),
);