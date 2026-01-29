import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

export const typeOrmConfig = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    type: 'postgres',
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
          url: process.env.DATABASE_URL || process.env.DB_URL,
        }),
    entities: [
      path.join(__dirname, '..', '..', '**', 'modules', '**', 'entities', '*.entity.js'),
      path.join(__dirname, '..', '..', '**', 'modules', '**', 'entities', '*.entity.ts'),
    ],
    synchronize: true, // Activado para creación de tablas
    schema: 'app',
    logging: false,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  };
};