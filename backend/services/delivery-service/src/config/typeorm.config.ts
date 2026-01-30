import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

const isProduction = process.env.NODE_ENV === 'production';

// Configuración común
const dbConfig = {
    type: 'postgres' as const,
    // Lógica Híbrida
    ...(process.env.DB_HOST
        ? {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT, 10) || 5432,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        }
        : {
            url: process.env.DATABASE_URL,
        }),
    schema: 'app',
    logging: false,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
};

export const typeormConfig = registerAs('typeorm', (): TypeOrmModuleOptions => ({
    ...dbConfig,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: true, // Activado para crear tablas
}));

export const dataSourceOptions: DataSourceOptions = {
    ...dbConfig,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: true, // Activado
    extra: {
        connectionTimeoutMillis: 5000,
    }
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;