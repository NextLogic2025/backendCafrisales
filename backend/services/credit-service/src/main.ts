import 'reflect-metadata';

import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const logger = new Logger('Bootstrap');

    // Seguridad: cabeceras HTTP contra ataques comunes (XSS, clickjacking, etc.)
    app.use(helmet());

    app.setGlobalPrefix('api');

    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean) || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
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
        .setTitle('Credit Service API')
        .setDescription('API de gestión de créditos y aprobaciones')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('credits')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // Graceful shutdown: cierra conexiones pendientes antes de terminar
    app.enableShutdownHooks();

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 Servicio Créditos corriendo en puerto: ${port}`);
}

bootstrap();
