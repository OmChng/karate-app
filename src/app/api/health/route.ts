import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.execute(sql`select 1 as ok`);
    return NextResponse.json({ status: 'ok', db: 'up', ts: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { status: 'degraded', db: 'down', error: (e as Error).message },
      { status: 503 },
    );
  }
}
