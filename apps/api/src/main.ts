import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger as NestLogger } from '@nestjs/common';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { initSentry } from './config/sentry.config';
import { validateEnv } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const env = validateEnv(process.env);
  initSentry(env);

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  app.enableCors({
    origin: env.NODE_ENV === 'production' ? [env.WEB_URL] : true,
    credentials: true,
  });

  app.enableShutdownHooks();

  await app.listen(env.PORT, '0.0.0.0');

  const logger = new NestLogger('Bootstrap');
  logger.log(`Idearium API running on ${env.APP_URL} (${env.NODE_ENV})`);
}

void bootstrap();
