import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { initializeFirebaseAdmin } from './common/infrastructure/firebase/firebase.config';

// Load environment variables if available
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    // Silently proceed if .env is missing (e.g., in containerized CI)
  }
}

async function bootstrap() {
  initializeFirebaseAdmin();

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Journ backend listening on port ${port}`);
}

bootstrap();
