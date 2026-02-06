// 1. IMPORTAR VersioningType
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

    // CORS - Modo permisivo
    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Authorization', 'X-Service-Token', 'x-api-key'],
    });

    app.setGlobalPrefix('api');

    // 2. ACTIVAR VERSIONADO
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    // Filtros y Pipes
    app.useGlobalFilters(new HttpExceptionFilter());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    const swaggerConfig = new DocumentBuilder()
        .setTitle('Delivery Service API')
        .setDescription('Documentacion OpenAPI del servicio de entregas')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, swaggerDocument);

    // Graceful shutdown
    app.enableShutdownHooks();

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    logger.log(`🚀 Delivery Service running on port ${port}`);
}

bootstrap();
