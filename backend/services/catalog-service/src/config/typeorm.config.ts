import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

export const typeOrmConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: process.env.DATABASE_URL || process.env.DB_URL,
  entities: [path.join(__dirname, '..', '..', 'modules', '**', 'entities', '*.entity.{ts,js}')],
  synchronize: false,
  schema: 'app',
});
