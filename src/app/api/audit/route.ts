import { NextResponse } from 'next/server';
import { opdStore } from '@/lib/store';


/**
 * GET /api/audit
 * Fetches immutable compliance audit logs with optional override-only filtering.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const overridesOnly = searchParams.get('overridesOnly') === 'true';

    const logs = opdStore.getAuditLogs(overridesOnly);

    return NextResponse.json({
      success: true,
      logs,
      totalCount: logs.length,
      overridesOnly,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch audit logs';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
