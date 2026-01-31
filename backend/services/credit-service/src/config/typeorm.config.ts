import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

import { config } from 'dotenv';
config();

const getDbConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        type: 'postgres' as const,
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
};

export const typeormConfig = registerAs('typeorm', (): TypeOrmModuleOptions => ({
    ...getDbConfig(),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: true, // Activado
}));

export const dataSourceOptions: DataSourceOptions = {
    ...getDbConfig(),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: true, // Activado
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;