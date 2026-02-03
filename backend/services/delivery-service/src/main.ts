import 'reflect-metadata';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Seguridad
  app.use(helmet());
  app.setGlobalPrefix('api');

  // Versionado
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

  // Filtros y Pipes
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Delivery Service API')
    .setDescription('API de gestión de logística y entregas')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('deliveries')
    .addTag('evidence')
    .addTag('incidents')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Puerto (Vital para Cloud Run)
  app.enableShutdownHooks();
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Delivery Service corriendo en puerto: ${port}`);
}
bootstrap();