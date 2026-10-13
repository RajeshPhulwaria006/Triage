import { NextResponse } from 'next/server';
import { opdStore } from '@/lib/store';
import { PatientStatus } from '@/types/triage';


interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/queue/[id]/status
 * Updates patient consultation lifecycle status.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status, staffBadge } = body;

    const validStatuses: PatientStatus[] = ['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid status is required (WAITING, IN_CONSULTATION, COMPLETED, CANCELLED).' },
        { status: 400 }
      );
    }

    const effectiveBadge =
      (staffBadge && typeof staffBadge === 'string' && staffBadge.trim()) || 'Staff Nurse (Station 1)';

    const updatedPatient = opdStore.updateStatus(id, status as PatientStatus, effectiveBadge);

    return NextResponse.json({
      success: true,
      patient: updatedPatient,
      message: `Token #${updatedPatient.tokenNumber} status updated to ${status}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update patient status';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
