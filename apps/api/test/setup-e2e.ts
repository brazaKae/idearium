/* eslint-disable @typescript-eslint/no-var-requires */
// Jest globalSetup — roda uma única vez antes da suite e2e.
// 1. Carrega .env.test (se existir) para sobreescrever .env.
// 2. Define defaults se nada for fornecido.
// 3. Aplica migrations contra o banco de testes.

import { execSync } from 'child_process';
import { join } from 'path';
import * as dotenv from 'dotenv';

export default async function globalSetup(): Promise<void> {
  // 1. carrega .env.test (sobrepõe variáveis já existentes)
  dotenv.config({ path: join(__dirname, '../.env.test'), override: true });

  // 2. defaults
  const dbUrl =
    process.env.DATABASE_URL ||
    'postgresql://idearium:idearium_dev@localhost:5432/idearium_test?schema=public';

  process.env.DATABASE_URL = dbUrl;
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_SECRET ||= 'test-secret-not-for-production-use';
  process.env.JWT_ACCESS_EXPIRES ||= '15m';
  process.env.JWT_REFRESH_EXPIRES_DAYS ||= '30';
  process.env.LOG_LEVEL ||= 'fatal';
  process.env.APP_VERSION ||= '0.0.0-test';

  // 3. aplica migrations (idempotente)
  execSync('npx prisma migrate deploy', {
    cwd: join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'inherit',
  });

  // 4. seed (idempotente; cria os 6 labs)
  execSync('npx prisma db seed', {
    cwd: join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'inherit',
  });
}
