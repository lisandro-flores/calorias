import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Restringir CORS a los orígenes conocidos
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:8100')
    .split(',')
    .map(o => o.trim());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Usar explícitamente 0.0.0.0 previene el choque de EADDRINUSE con IPv6 (::)
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();

