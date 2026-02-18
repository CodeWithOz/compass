import { NextRequest, NextResponse } from 'next/server';
import { createJournalEntry, getJournalEntries } from '@/actions/journal';
import type { AIProvider } from '@/lib/ai/providers';

/**
 * POST /api/journal
 *
 * Create a new journal entry (external submissions)
 * Useful for webhooks, daily reminders, or external integrations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawText, linkedResolutionIds, provider, idempotencyKey } = body;

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { error: 'rawText is required and must be a string' },
        { status: 400 }
      );
    }

    const validProviders: AIProvider[] = ['claude', 'openai', 'gemini'];
    if (provider !== undefined && !validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await createJournalEntry(
      {
        rawText,
        linkedResolutionIds: linkedResolutionIds || [],
        idempotencyKey,
      },
      provider as AIProvider | undefined
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        entry: result.data,
        message: 'Journal entry created successfully. Analysis enqueued.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/journal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/journal
 *
 * List journal entries with optional filters
 *
 * Query params:
 * - resolutionId: Filter by resolution
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - limit: Number of entries to return (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const resolutionId = searchParams.get('resolutionId') || undefined;

    const startDateRaw = searchParams.get('startDate');
    const startDate = startDateRaw ? new Date(startDateRaw) : undefined;
    if (startDate && isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'Invalid startDate' }, { status: 400 });
    }

    const endDateRaw = searchParams.get('endDate');
    const endDate = endDateRaw ? new Date(endDateRaw) : undefined;
    if (endDate && isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid endDate' }, { status: 400 });
    }

    const limitRaw = searchParams.get('limit');
    const limit = limitRaw ? parseInt(limitRaw, 10) : 50;
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({ error: 'Invalid limit' }, { status: 400 });
    }

    const result = await getJournalEntries({
      resolutionId,
      startDate,
      endDate,
      limit,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      entries: result.data,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/journal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
