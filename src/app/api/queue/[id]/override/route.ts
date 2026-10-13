import { NextResponse } from 'next/server';
import { opdStore } from '@/lib/store';
import { PriorityLevel } from '@/types/triage';


interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/queue/[id]/override
 * Executes a one-tap clinical nurse override with mandatory audit logging.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { newPriority, justification, staffBadge } = body;

    if (!newPriority || !['IMMEDIATE', 'SOON', 'ROUTINE'].includes(newPriority)) {
      return NextResponse.json(
        { success: false, error: 'A valid priority level (IMMEDIATE, SOON, ROUTINE) is required.' },
        { status: 400 }
      );
    }

    if (!justification || typeof justification !== 'string' || justification.trim().length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mandatory clinical override justification must be provided (at least 5 characters).',
        },
        { status: 400 }
      );
    }

    const effectiveBadge =
      (staffBadge && typeof staffBadge === 'string' && staffBadge.trim()) ||
      'Staff Nurse Sunita (SN-402)';

    const updatedPatient = opdStore.overridePriority(
      id,
      newPriority as PriorityLevel,
      justification.trim(),
      effectiveBadge
    );

    return NextResponse.json({
      success: true,
      patient: updatedPatient,
      message: `Token #${updatedPatient.tokenNumber} priority successfully overridden to [${updatedPatient.currentPriority}]`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to apply clinical override';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
