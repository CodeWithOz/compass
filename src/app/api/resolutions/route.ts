import { NextRequest, NextResponse } from 'next/server';
import { getResolutions } from '@/actions/resolutions';
import type { ResolutionStatus } from '@prisma/client';

/**
 * GET /api/resolutions
 *
 * List all resolutions with optional status filter
 * Useful for external integrations or CLI access
 *
 * Query params:
 * - status: ACTIVE, PAUSED, or ARCHIVED
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const validStatuses: ResolutionStatus[] = ['ACTIVE', 'PAUSED', 'ARCHIVED'];
    const status: ResolutionStatus | null = validStatuses.includes(statusParam as ResolutionStatus)
      ? (statusParam as ResolutionStatus)
      : null;

    const result = await getResolutions(status || undefined);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      resolutions: result.data,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/resolutions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
