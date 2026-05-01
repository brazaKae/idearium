type Env = {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  APP_URL: string;
  WEB_URL: string;
  APP_VERSION: string;
  LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  DATABASE_URL: string;
  SENTRY_DSN: string | null;
  SENTRY_ENVIRONMENT: string;
};

const required = (name: string, value: string | undefined): string => {
  if (!value || value.trim() === '') {
    throw new Error(`[env] missing required variable: ${name}`);
  }
  return value;
};

const optional = (value: string | undefined, fallback: string): string =>
  value && value.trim() !== '' ? value : fallback;

const nullable = (value: string | undefined): string | null =>
  value && value.trim() !== '' ? value : null;

export const validateEnv = (raw: NodeJS.ProcessEnv): Env => {
  const nodeEnv = optional(raw.NODE_ENV, 'development');
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error(`[env] invalid NODE_ENV: ${nodeEnv}`);
  }

  const logLevel = optional(raw.LOG_LEVEL, nodeEnv === 'production' ? 'info' : 'debug');
  if (!['fatal', 'error', 'warn', 'info', 'debug', 'trace'].includes(logLevel)) {
    throw new Error(`[env] invalid LOG_LEVEL: ${logLevel}`);
  }

  return {
    NODE_ENV: nodeEnv as Env['NODE_ENV'],
    PORT: parseInt(optional(raw.PORT, '3000'), 10),
    APP_URL: optional(raw.APP_URL, 'http://localhost:3000'),
    WEB_URL: optional(raw.WEB_URL, 'http://localhost:4200'),
    APP_VERSION: optional(raw.APP_VERSION, '0.1.0'),
    LOG_LEVEL: logLevel as Env['LOG_LEVEL'],
    DATABASE_URL: required('DATABASE_URL', raw.DATABASE_URL),
    SENTRY_DSN: nullable(raw.SENTRY_DSN),
    SENTRY_ENVIRONMENT: optional(raw.SENTRY_ENVIRONMENT, nodeEnv),
  };
};

export type AppEnv = Env;
