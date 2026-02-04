import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const logger = new Logger('Bootstrap');

    // Seguridad: cabeceras HTTP contra ataques comunes (XSS, clickjacking, etc.)
    app.use(helmet());

    // CORS - Modo permisivo para producción (refleja dinámicamente el origen)
    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Token', 'x-api-key'],
    });

    app.setGlobalPrefix('api');

    // Filtro global para formatear errores y ocultar detalles sensibles
    app.useGlobalFilters(new HttpExceptionFilter());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Graceful shutdown: cierra conexiones pendientes antes de terminar
    app.enableShutdownHooks();

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    logger.log(`🚀 Delivery Service running on port ${port}`);
}

bootstrap();
