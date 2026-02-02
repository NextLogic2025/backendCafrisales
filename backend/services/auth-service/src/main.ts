import 'reflect-metadata';

import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Seguridad: cabeceras HTTP contra XSS, clickjacking, sniffing
  app.use(helmet());
  app.use(cookieParser());

  // API prefix unified across services
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: [
      'http://localhost:5173',                      // Tu local
      'https://gen-lang-client-0059045498.web.app' // Tu producción
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Token'],
  });

  // Filtro global para formatear errores y ocultar detalles sensibles
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ✅ Versionado de API
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ✅ Swagger
  const config = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription('API de Autenticación y Gestión de Tokens')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Graceful shutdown: cierra conexiones pendientes antes de terminar
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Servicio Auth corriendo en puerto: ${port}`);
}

bootstrap();
