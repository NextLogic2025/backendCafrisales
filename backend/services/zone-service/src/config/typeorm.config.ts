import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService, registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: '.env' });

export const typeormConfig = registerAs('typeorm', () => ({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    autoLoadEntities: true,
    synchronize: false, // En producción debe ser false
    //logging: process.env.NODE_ENV === 'development',
    logging: false,
    migrations: ['dist/migrations/*{.ts,.js}'],
    migrationsRun: false,
}));

export const connectionSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: false,
} as DataSourceOptions);
