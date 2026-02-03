import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Seguridad
  app.use(helmet());
  app.setGlobalPrefix('api');

  // ✅ Versionado de API
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // CORS - Configuración Robusta
  app.enableCors({
    origin: [
      'http://localhost:5173',                                  // Desarrollo Local
      'https://gen-lang-client-0059045498.web.app',            // Producción Frontend
      'https://cafrisales-gateway-gw-4dxrikij.ue.gateway.dev'   // Producción Gateway
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Token', 'x-api-key'],
  });

  // Filtro global
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ✅ Swagger
  const config = new DocumentBuilder()
    .setTitle('Notification Service API')
    .setDescription('API de gestión de notificaciones')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('notifications')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Graceful shutdown
  app.enableShutdownHooks();

  // ⚠️ CRÍTICO: Escuchar en 0.0.0.0 para Cloud Run
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Notification Service running on http://localhost:${port}`);
}

bootstrap();