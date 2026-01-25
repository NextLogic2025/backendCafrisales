import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Set API prefix to match spec: /v1
  app.setGlobalPrefix('v1');
  await app.listen(process.env.PORT || 3000);
}

bootstrap();
