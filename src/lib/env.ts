import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_URL: z.string().url().default('http://localhost:3000'),
    APP_DEFAULT_LOCALE: z.enum(['es', 'en']).default('es'),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    AUTH_SECRET: z.string().min(16, 'AUTH_SECRET must be at least 16 chars'),
    AUTH_TRUST_HOST: z.string().optional(),

    SMTP_HOST: z.string().default('localhost'),
    SMTP_PORT: z.coerce.number().int().positive().default(1025),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().default('Sensei Modern <no-reply@sensei.local>'),

    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    STORAGE_LOCAL_DIR: z.string().default('./.uploads'),
    S3_ENDPOINT: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),

    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    SENSEI_APP_URL: z.string().url().optional(),
    SENSEI_APP_USER: z.string().optional(),
    SENSEI_APP_PASSWORD: z.string().optional(),
  },
  client: {},
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    APP_URL: process.env.APP_URL,
    APP_DEFAULT_LOCALE: process.env.APP_DEFAULT_LOCALE,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM: process.env.SMTP_FROM,
    STORAGE_DRIVER: process.env.STORAGE_DRIVER,
    STORAGE_LOCAL_DIR: process.env.STORAGE_LOCAL_DIR,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_REGION: process.env.S3_REGION,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    LOG_LEVEL: process.env.LOG_LEVEL,
    SENSEI_APP_URL: process.env.SENSEI_APP_URL,
    SENSEI_APP_USER: process.env.SENSEI_APP_USER,
    SENSEI_APP_PASSWORD: process.env.SENSEI_APP_PASSWORD,
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === '1',
});
