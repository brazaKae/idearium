// Sentry instrumentation MUST be the first import.
import './instrument';

import 'reflect-metadata';
import { Logger as NestLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { validateEnv } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const env = validateEnv(process.env);

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new I18nValidationExceptionFilter({ detailedErrors: false }));

  app.enableCors({
    origin: env.NODE_ENV === 'production' ? [env.WEB_URL] : true,
    credentials: true,
  });

  app.enableShutdownHooks();

  // OpenAPI / Swagger UI em /docs (não exposto em produção por padrão)
  if (env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Idearium API')
      .setDescription('Comunidade de construção coletiva — RFCs e laboratórios temáticos.')
      .setVersion(env.APP_VERSION)
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(env.PORT, '0.0.0.0');

  const logger = new NestLogger('Bootstrap');
  logger.log(`Idearium API running on ${env.APP_URL} (${env.NODE_ENV})`);
  if (env.NODE_ENV !== 'production') {
    logger.log(`Swagger UI: ${env.APP_URL}/docs`);
  }
}

void bootstrap();
