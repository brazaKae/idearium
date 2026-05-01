import * as Sentry from '@sentry/node';
import type { AppEnv } from './env.validation';

export const initSentry = (env: AppEnv): void => {
  if (!env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    release: env.APP_VERSION,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
};
