import { NextRequest, NextResponse } from 'next/server';
import { getWeeklySummary, getMomentumTrends } from '@/actions/analytics';

/**
 * GET /api/dashboard/weekly
 *
 * Get weekly summary data for dashboard
 *
 * Query params:
 * - weekStart: ISO date string for start of week (optional)
 * - resolutionId: Optional filter for specific resolution
 * - trends: If 'true', return momentum trends instead of specific week
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const trends = searchParams.get('trends') === 'true';

    // Get momentum trends for all resolutions
    if (trends) {
      const result = await getMomentumTrends();

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        count: result.data?.length || 0,
      });
    }

    // Get specific week summary
    const weekStartParam = searchParams.get('weekStart');
    const resolutionId = searchParams.get('resolutionId') || undefined;

    if (!weekStartParam) {
      return NextResponse.json(
        { error: 'weekStart is required (or use trends=true)' },
        { status: 400 }
      );
    }

    const weekStart = new Date(weekStartParam);

    if (isNaN(weekStart.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for weekStart' },
        { status: 400 }
      );
    }

    const result = await getWeeklySummary(weekStart, resolutionId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/dashboard/weekly:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
