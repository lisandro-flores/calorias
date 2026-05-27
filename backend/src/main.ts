import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/node';

async function bootstrap() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
    });
  }

  const app = await NestFactory.create(AppModule);
  // Habilitar CORS para que el puerto 8100 de Angular pueda conectarse sin restricciones del navegador
  app.enableCors({
    origin: '*',
  });
  // Usar explícitamente 0.0.0.0 previene el choque de EADDRINUSE con IPv6 (::)
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
