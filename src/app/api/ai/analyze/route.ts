import { NextRequest, NextResponse } from 'next/server';
import { triggerReanalysis, getEntriesPendingAnalysis } from '@/actions/journal';
import { batchAnalyzeEntries } from '@/lib/ai/analyze';
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

    // Single entry re-analysis
    if (entryId) {
      const result = await triggerReanalysis(entryId, provider as AIProvider);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Analysis triggered for entry ${entryId}`,
      });
    }

    // Batch analysis
    if (entryIds && Array.isArray(entryIds)) {
      await batchAnalyzeEntries(entryIds, provider as AIProvider);

      return NextResponse.json({
        success: true,
        message: `Batch analysis triggered for ${entryIds.length} entries`,
      });
    }

    // Analyze all pending entries
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

      await batchAnalyzeEntries(pendingIds, provider as AIProvider);

      return NextResponse.json({
        success: true,
        message: `Batch analysis triggered for ${pendingIds.length} pending entries`,
      });
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
 * GET /api/ai/analyze/pending
 *
 * Get list of entries pending AI analysis
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : 20;

    const result = await getEntriesPendingAnalysis(limit);

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
