import { DataSource, DataSourceOptions } from 'typeorm';
import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: '.env' });

const isProduction = process.env.NODE_ENV === 'production';

// Configuración Base
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
    logging: false,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
};

export const typeormConfig = registerAs('typeorm', () => ({
    ...dbConfig,
    autoLoadEntities: true,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    // 🔥 CAMBIO: Apagado para producción
    synchronize: false, 
    migrationsRun: false,
    schema: 'app', // 🔥 AGREGADO: Para que busque en el esquema correcto
}));

export const connectionSource = new DataSource({
    ...dbConfig,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    // 🔥 CAMBIO: Apagado
    synchronize: false,
    schema: 'app',
} as DataSourceOptions);