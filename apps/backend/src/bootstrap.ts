import { NestFactory } from '@nestjs/core';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';

export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  return app;
}

export function resolvePort(): number {
  if (process.env.NEW_BACKEND_PORT) {
    const port = parseInt(process.env.NEW_BACKEND_PORT, 10);
    if (!isNaN(port)) return port;
  }
  if (process.env.BACKEND_PORT) {
    const port = parseInt(process.env.BACKEND_PORT, 10);
    if (!isNaN(port)) return port;
  }
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (!isNaN(port)) return port;
  }
  return 8001;
}

export async function bootstrap(): Promise<void> {
  const app = await createApp();
  const port = resolvePort();
  await app.listen(port, '0.0.0.0');
  console.log(`Journ backend listening on port ${port}`);
}
