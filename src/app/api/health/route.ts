import { NextResponse } from 'next/server';
import { isPostgresConfigured, getSql } from '@/lib/db';
import { opdStore } from '@/lib/store';

/**
 * GET /api/health
 * Production healthcheck endpoint for Docker, AWS ALB/ECS, Vercel, or monitoring tools.
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  let dbStatus = 'unconfigured';
  let dbLatencyMs: number | null = null;

  if (isPostgresConfigured()) {
    const sql = getSql();
    if (sql) {
      try {
        const start = performance.now();
        await sql`SELECT 1 as ping`;
        dbLatencyMs = Math.round(performance.now() - start);
        dbStatus = 'connected';
      } catch (err) {
        dbStatus = `error: ${err instanceof Error ? err.message : 'failed'}`;
      }
    }
  } else {
    dbStatus = 'wal_fallback_active';
  }

  const queueSummary = opdStore.getQueueSummary();

  const isHealthy = dbStatus !== 'error';

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'triage',
      version: '1.0.0',
      timestamp,
      environment: process.env.NODE_ENV || 'production',
      database: {
        engine: isPostgresConfigured() ? 'postgresql' : 'write_ahead_log',
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      queue: {
        activeWaiting: queueSummary.totalWaiting,
        immediateCases: queueSummary.immediateCount,
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
