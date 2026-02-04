// 1. IMPORTAR VersioningType
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const logger = new Logger('Bootstrap');

    // Seguridad
    app.use(helmet());

    // CORS - Modo permisivo
    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Token', 'x-api-key'],
    });

    // Global prefix
    app.setGlobalPrefix('api');

    // 2. ACTIVAR VERSIONADO
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    // Filtro global
    app.useGlobalFilters(new HttpExceptionFilter());

    // Validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Graceful shutdown
    app.enableShutdownHooks();

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    logger.log(`🚀 Route Service running on port ${port}`);
}

bootstrap();