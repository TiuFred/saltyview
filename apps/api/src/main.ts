import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  });

  // PORT é a convenção usada por PaaS (Render/Railway/Heroku) que injetam uma porta dinâmica;
  // API_PORT é o fallback usado em dev local (.env).
  await app.listen(process.env.PORT ?? process.env.API_PORT ?? 3001);
}
void bootstrap();
