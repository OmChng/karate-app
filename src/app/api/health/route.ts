import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.execute(sql`select 1 as ok`);
    return NextResponse.json({ status: 'ok', db: 'up', ts: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, 'health: database ping failed');
    return NextResponse.json(
      { status: 'degraded', db: 'down', ts: new Date().toISOString() },
      { status: 503 },
    );
  }
}
