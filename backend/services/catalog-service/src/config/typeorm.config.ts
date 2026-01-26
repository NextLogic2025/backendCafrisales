import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

export const typeOrmConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: process.env.DATABASE_URL || process.env.DB_URL,
  entities: [
    path.join(__dirname, '..', '..', '**', 'modules', '**', 'entities', '*.entity.js'),
    path.join(__dirname, '..', '..', '**', 'modules', '**', 'entities', '*.entity.ts'),
  ],
  synchronize: false,
  schema: 'app',
  //logging: process.env.NODE_ENV === 'development',
  logging: false,
});
