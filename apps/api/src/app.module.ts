import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { SentryModule } from '@sentry/nestjs/setup';
import { LoggerModule } from 'nestjs-pino';
import {
  AcceptLanguageResolver,
  CookieResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { BuildersModule } from './builders/builders.module';
import { CommentsModule } from './comments/comments.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validateEnv, type AppEnv } from './config/env.validation';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { HealthModule } from './health/health.module';
import { LabsModule } from './labs/labs.module';
import { PrismaModule } from './prisma/prisma.module';
import { RfcsModule } from './rfcs/rfcs.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    SentryModule.forRoot(),
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
        // Em prod/test, __dirname já aponta pro local correto (dist/i18n ou src/i18n).
        // Em dev (`nest start --watch`), __dirname é dist/, mas dist é deletado/recriado
        // a cada compilação — o chokidar do nestjs-i18n vê o sumiço e dispara ENOENT.
        // Solução: ler direto de src/i18n em dev (estável, nunca apaga).
        path:
          process.env.NODE_ENV === 'development'
            ? join(__dirname, '..', 'src', 'i18n')
            : join(__dirname, 'i18n'),
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
    AuthModule,
    UsersModule,
    BuildersModule,
    LabsModule,
    RfcsModule,
    EnrollmentsModule,
    CommentsModule,
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
