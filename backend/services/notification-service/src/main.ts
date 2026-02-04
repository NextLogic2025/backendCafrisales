import { NestFactory } from '@nestjs/core';
// 1. IMPORTAR VersioningType
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

    // CORS - Modo permisivo
    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Token', 'x-api-key'],
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

    // API prefix
    app.setGlobalPrefix('api');

    // 2. ACTIVAR VERSIONADO
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    // Swagger configuration
    const config = new DocumentBuilder()
        .setTitle('Notification Service API')
        .setDescription('Sistema híbrido de notificaciones en tiempo real')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // Graceful shutdown
    app.enableShutdownHooks();

    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.log(`🚀 Notification Service running on http://localhost:${port}`);
    logger.log(`📚 API Docs available at http://localhost:${port}/api/docs`);
    logger.log(`🔌 WebSocket available at ws://localhost:${port}/notifications`);
}

bootstrap();