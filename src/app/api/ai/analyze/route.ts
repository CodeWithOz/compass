import { NextRequest, NextResponse } from 'next/server';
import { triggerReanalysis, getEntriesPendingAnalysis } from '@/actions/journal';
import { enqueueAnalysis } from '@/lib/queue/analysis-queue';
import type { AIProvider } from '@/lib/ai/providers';

/**
 * POST /api/ai/analyze
 *
 * Trigger AI analysis for existing journal entries
 *
 * Body:
 * - entryId: Single entry ID to analyze (optional)
 * - entryIds: Array of entry IDs to analyze (optional)
 * - provider: AI provider to use
 * - analyzePending: If true, analyze all pending entries
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entryId, entryIds, provider, analyzePending } = body;

    const validProviders: AIProvider[] = ['claude', 'openai', 'gemini'];
    if (provider !== undefined && !validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    // Single entry re-analysis (small, keep synchronous)
    if (entryId) {
      if (!provider) {
        return NextResponse.json(
          { error: 'provider is required for single-entry re-analysis' },
          { status: 400 }
        );
      }
      const result = await triggerReanalysis(entryId, provider);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Analysis triggered for entry ${entryId}`,
      });
    }

    // Batch analysis — enqueue each entry to avoid blocking the HTTP response
    if (entryIds && Array.isArray(entryIds)) {
      for (const id of entryIds) {
        await enqueueAnalysis(id, provider as AIProvider | undefined);
      }

      return NextResponse.json(
        { success: true, message: `Accepted - analysis started for ${entryIds.length} entries` },
        { status: 202 }
      );
    }

    // Analyze all pending entries — enqueue to avoid long-running HTTP response
    if (analyzePending) {
      const pendingResult = await getEntriesPendingAnalysis(100);

      if (!pendingResult.success) {
        return NextResponse.json(
          { error: pendingResult.error },
          { status: 500 }
        );
      }

      const pendingIds = pendingResult.data?.map((entry) => entry.id) || [];

      if (pendingIds.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No pending entries to analyze',
        });
      }

      for (const id of pendingIds) {
        await enqueueAnalysis(id, provider as AIProvider | undefined);
      }

      return NextResponse.json(
        { success: true, message: `Accepted - analysis started for ${pendingIds.length} pending entries` },
        { status: 202 }
      );
    }

    return NextResponse.json(
      { error: 'Must provide entryId, entryIds, or analyzePending=true' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in POST /api/ai/analyze:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/analyze
 *
 * Get list of entries pending AI analysis
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitRaw = searchParams.get('limit');
    const limit = limitRaw ? parseInt(limitRaw, 10) : 20;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 20;

    const result = await getEntriesPendingAnalysis(safeLimit);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      entries: result.data,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/ai/analyze:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
