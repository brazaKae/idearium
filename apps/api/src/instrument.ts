// Sentry instrumentation — must be imported FIRST in main.ts,
// before any other module so that auto-instrumentation can patch them.
//
// Note: this file runs BEFORE ConfigModule loads the .env file. We must rely on
// `process.env` directly (which dotenv-cli or the runtime fills) and avoid full
// env validation here. The rest of the app uses validateEnv as usual.

import * as dotenv from 'dotenv';
import * as Sentry from '@sentry/nestjs';

dotenv.config();

const dsn = process.env.SENTRY_DSN;

if (dsn && dsn.trim() !== '') {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    release: process.env.APP_VERSION,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}
