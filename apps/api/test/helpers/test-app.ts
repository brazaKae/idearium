import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

export const createTestApp = async (): Promise<INestApplication> => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication({ bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new I18nValidationExceptionFilter({ detailedErrors: false }));

  await app.init();
  return app;
};

export const cleanDatabase = async (app: INestApplication): Promise<void> => {
  const prisma = app.get(PrismaService);
  // Ordem importa por causa de FKs. Labs NÃO são truncados (vêm do seed).
  await prisma.$transaction([
    prisma.tagsOnRfcs.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.rfcVersion.deleteMany(),
    prisma.rfc.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.builderProfile.deleteMany(),
    prisma.user.deleteMany(),
  ]);
};
