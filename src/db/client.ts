import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/lib/env';
import * as schema from './schema';

// Reuse a single client in dev to avoid exhausting connections on hot reload.
const globalForDb = globalThis as unknown as {
  __sensei_pg?: ReturnType<typeof postgres>;
};

export const queryClient =
  globalForDb.__sensei_pg ??
  postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 30,
    prepare: false,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__sensei_pg = queryClient;
}

export const db = drizzle(queryClient, { schema, logger: process.env.LOG_LEVEL === 'debug' });

export type Database = typeof db;
