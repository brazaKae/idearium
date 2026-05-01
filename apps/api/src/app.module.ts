import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import {
  AcceptLanguageResolver,
  CookieResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { join } from 'path';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validateEnv, type AppEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: validateEnv(process.env).LOG_LEVEL,
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: { singleLine: true, translateTime: 'SYS:standard' },
              }
            : undefined,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        customProps: () => ({ service: 'idearium-api' }),
      },
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'pt-BR',
      loaderOptions: {
        path: join(__dirname, 'i18n'),
        watch: process.env.NODE_ENV !== 'production',
      },
      resolvers: [
        new QueryResolver(['lang']),
        new HeaderResolver(['x-lang']),
        new CookieResolver(['lang']),
        AcceptLanguageResolver,
      ],
    }),
    PrismaModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}

export type { AppEnv };
