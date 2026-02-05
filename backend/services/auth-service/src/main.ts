import 'reflect-metadata';
// 1. AGREGAMOS 'VersioningType' A LOS IMPORTS
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Seguridad
  app.use(helmet());

  // Prefijo global (/api)
  app.setGlobalPrefix('api');

  // 2. ACTIVAMOS EL VERSIONADO (ESTO ES LO QUE FALTABA)
  // Esto hace que NestJS lea el "version: '1'" del controlador
  // y transforme la ruta de "/api/auth" a "/api/v1/auth"
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // CORS - Modo permisivo (tu configuración actual correcta)
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Authorization', 'X-Service-Token', 'x-api-key'],
  });

  // Filtros y Pipes
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Servicio Auth corriendo en puerto: ${port}`);
}

bootstrap();