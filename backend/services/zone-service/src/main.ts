import 'reflect-metadata';

// 1. IMPORTAR VersioningType
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const logger = new Logger('Bootstrap');

    app.use(helmet());

    app.setGlobalPrefix('api');

    // 2. ACTIVAR VERSIONADO
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    // CORS - Modo permisivo
    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Authorization', 'X-Service-Token', 'x-api-key'],
    });

    app.useGlobalFilters(new HttpExceptionFilter());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    app.enableShutdownHooks();

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 Servicio Zonas corriendo en puerto: ${port}`);
}

bootstrap();