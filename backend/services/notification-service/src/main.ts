import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);

    // Seguridad: cabeceras HTTP contra XSS, clickjacking, sniffing
    app.use(helmet());

    // CORS
    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean) || '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Filtro global para formatear errores y ocultar detalles sensibles
    app.useGlobalFilters(new HttpExceptionFilter());

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // API prefix
    app.setGlobalPrefix('api');

    // ✅ Versionado de API
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

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

    // Graceful shutdown: cierra conexiones pendientes antes de terminar
    app.enableShutdownHooks();

    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.log(`🚀 Notification Service running on http://localhost:${port}`);
    logger.log(`📚 API Docs available at http://localhost:${port}/api/docs`);
    logger.log(`🔌 WebSocket available at ws://localhost:${port}/notifications`);
}

bootstrap();
