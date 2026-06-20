import { pino } from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'sensei-modern' },
  redact: {
    paths: [
      'password',
      'pass',
      'passwordHash',
      'token',
      'authorization',
      'cookie',
      'set-cookie',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[redacted]',
  },
});
