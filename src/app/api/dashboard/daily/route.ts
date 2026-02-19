import { NextRequest, NextResponse } from 'next/server';
import { getDailyActivity, getHeatmapData } from '@/actions/analytics';

/**
 * GET /api/dashboard/daily
 *
 * Get daily activity data for dashboard visualization
 *
 * Query params:
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 * - resolutionId: Optional filter for specific resolution
 * - format: 'raw' or 'heatmap' (default: 'raw')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const resolutionId = searchParams.get('resolutionId') || undefined;
    const format = searchParams.get('format') || 'raw';

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (format === 'heatmap') {
      // Get heatmap-formatted data
      const result = await getHeatmapData(startDate, endDate);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: result.data,
      });
    } else {
      // Get raw daily activity data
      const result = await getDailyActivity(startDate, endDate, resolutionId);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        count: result.data?.length || 0,
      });
    }
  } catch (error) {
    console.error('Error in GET /api/dashboard/daily:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
