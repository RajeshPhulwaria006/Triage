import { NextResponse } from 'next/server';
import { opdStore } from '@/lib/store';


/**
 * POST /api/reset
 * Resets state store back to deterministic hackathon demo seeds.
 */
export async function POST() {
  try {
    opdStore.seedInitialData();
    return NextResponse.json({
      success: true,
      message: 'Triage store reset to initial seed state.',
      patients: opdStore.getPatients(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reset store';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
