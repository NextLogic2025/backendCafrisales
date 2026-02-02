import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
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

    app.enableCors({
        origin: [
        'http://localhost:5173',
        'https://gen-lang-client-0059045498.web.app'
        ],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'], // Agregamos headers explícitos por seguridad
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


    // ✅ Versionado de API
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    // ✅ Swagger
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

    // Graceful shutdown: cierra conexiones pendientes antes de terminar
    app.enableShutdownHooks();

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    logger.log(`🚀 Delivery Service running on port ${port}`);
}

bootstrap();
