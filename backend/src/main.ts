import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadEnvFile } from './config/load-env';

async function bootstrap() {
  loadEnvFile();

  const app = await NestFactory.create(AppModule);
  const configuredOrigins = process.env.FRONTEND_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: configuredOrigins?.length ? configuredOrigins : true,
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
