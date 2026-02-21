'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { enqueueAnalysis } from '@/lib/queue/analysis-queue';
import type { AIProvider } from '@/lib/ai/providers';

/**
 * Validation schema for journal entry creation
 */
const CreateJournalEntrySchema = z.object({
  rawText: z.string().min(1, 'Journal entry cannot be empty'),
  linkedResolutionIds: z.array(z.string()).optional().default([]),
  idempotencyKey: z.string().optional(), // For duplicate prevention
});

/**
 * Create a new journal entry
 *
 * CRITICAL ARCHITECTURAL PATTERN:
 * 1. Save entry to database immediately (< 100ms target)
 * 2. Enqueue AI analysis (non-blocking)
 * 3. Return success to user without waiting for analysis
 * 4. Analysis happens in background
 * 5. Dashboard updates when next refreshed
 *
 * This is APPEND-ONLY: No updates, only inserts
 * This is SERVER-SIDE ONLY: Never expose to client components
 * This is TOLERANT: Handles duplicate submissions gracefully
 *
 * @param data - Journal entry data
 * @param provider - Optional AI provider for analysis
 * @returns The created journal entry
 */
export async function createJournalEntry(
  data: z.infer<typeof CreateJournalEntrySchema>,
  provider?: AIProvider
) {
  try {
    // Validate input
    const validated = CreateJournalEntrySchema.parse(data);

    // Check for duplicate via idempotency key — the key is used as the entry's id,
    // so a second request with the same key will find the already-created entry.
    if (validated.idempotencyKey) {
      const existing = await prisma.journalEntry.findUnique({
        where: { id: validated.idempotencyKey },
      });
      if (existing) {
        console.log('Duplicate journal entry detected via idempotency key, returning existing entry');
        return { success: true, data: existing };
      }
    }

    // Create journal entry (FAST - should be < 100ms)
    const entry = await prisma.journalEntry.create({
      data: {
        ...(validated.idempotencyKey && { id: validated.idempotencyKey }),
        rawText: validated.rawText,
        linkedResolutionIds: validated.linkedResolutionIds,
      },
    });

    // Enqueue AI analysis (NON-BLOCKING - do NOT await)
    // This runs in the background, user sees success immediately
    enqueueAnalysis(entry.id, provider).catch((error) => {
      // Log error but don't fail the request
      console.error('Failed to enqueue analysis:', error);
    });

    console.log(`✅ Journal entry created: ${entry.id} (analysis enqueued)`);

    return { success: true, data: entry };
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create journal entry',
    };
  }
}

/**
 * Get journal entries with optional filters
 *
 * @param options - Filter options
 * @returns List of journal entries
 */
export async function getJournalEntries(options?: {
  resolutionId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  try {
    const { resolutionId, startDate, endDate, limit = 50 } = options || {};

    const entries = await prisma.journalEntry.findMany({
      where: {
        ...(resolutionId && {
          linkedResolutionIds: {
            has: resolutionId,
          },
        }),
        ...((startDate || endDate) && {
          timestamp: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        }),
      },
      include: {
        interpretations: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Latest interpretation
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    return { success: true, data: entries };
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch journal entries',
    };
  }
}

/**
 * Get a single journal entry by ID
 *
 * @param id - Journal entry ID
 * @returns The journal entry with all interpretations
 */
export async function getJournalEntry(id: string) {
  try {
    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        interpretations: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!entry) {
      throw new Error('Journal entry not found');
    }

    return { success: true, data: entry };
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch journal entry',
    };
  }
}

/**
 * Get adjacent journal entry IDs (previous/next) for navigation
 *
 * @param currentId - Current journal entry ID
 * @returns Object with previousId and nextId (null if none exist)
 */
export async function getAdjacentEntryIds(currentId: string) {
  try {
    const currentEntry = await prisma.journalEntry.findUnique({
      where: { id: currentId },
      select: { timestamp: true },
    });

    if (!currentEntry) {
      throw new Error('Journal entry not found');
    }

    // Get previous entry (older, earlier timestamp)
    const previousEntry = await prisma.journalEntry.findFirst({
      where: {
        timestamp: {
          lt: currentEntry.timestamp,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      select: { id: true },
    });

    // Get next entry (newer, later timestamp)
    const nextEntry = await prisma.journalEntry.findFirst({
      where: {
        timestamp: {
          gt: currentEntry.timestamp,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
      select: { id: true },
    });

    return {
      success: true,
      data: {
        previousId: previousEntry?.id || null,
        nextId: nextEntry?.id || null,
      },
    };
  } catch (error) {
    console.error('Error fetching adjacent entry IDs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch adjacent entries',
    };
  }
}

/**
 * Trigger re-analysis of a journal entry with a different provider
 *
 * Useful for comparing AI interpretations or when switching providers
 *
 * @param entryId - Journal entry ID
 * @param provider - AI provider to use
 * @returns Success status
 */
export async function triggerReanalysis(entryId: string, provider: AIProvider) {
  try {
    // Verify entry exists
    const entry = await prisma.journalEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new Error('Journal entry not found');
    }

    // Enqueue analysis with specified provider
    await enqueueAnalysis(entryId, provider);

    return { success: true };
  } catch (error) {
    console.error('Error triggering reanalysis:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger reanalysis',
    };
  }
}

/**
 * Get journal entries linked to a resolution via AI-detected activity
 *
 * Unlike getJournalEntries which filters by user-provided linkedResolutionIds,
 * this queries for entries whose AI interpretations detected activity for the
 * given resolution (stored in detectedActivity JSON field).
 *
 * @param resolutionId - Resolution ID to find linked entries for
 * @param limit - Maximum entries to return
 * @returns Journal entries with AI-detected links to the resolution
 */
export async function getLinkedJournalEntries(resolutionId: string, limit = 5) {
  try {
    const interpretations = await prisma.aIInterpretation.findMany({
      where: {
        detectedActivity: {
          path: [resolutionId],
          not: 'NONE',
        },
      },
      include: {
        journalEntry: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      // Fetch more candidates than limit to account for duplicates across entries
      take: limit * 3,
    });

    const seen = new Set<string>();
    const entries = interpretations
      .map((interp) => interp.journalEntry)
      .filter((entry) => {
        if (seen.has(entry.id)) return false;
        seen.add(entry.id);
        return true;
      })
      .slice(0, limit);

    return { success: true, data: entries };
  } catch (error) {
    console.error('Error fetching linked journal entries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch linked entries',
    };
  }
}

/**
 * Get entries pending AI analysis
 *
 * Useful for backfilling or checking analysis status
 *
 * @param limit - Maximum number of entries to return
 * @returns List of entries without interpretations
 */
export async function getEntriesPendingAnalysis(limit = 20) {
  try {
    const entries = await prisma.journalEntry.findMany({
      where: {
        interpretations: {
          none: {},
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    return { success: true, data: entries };
  } catch (error) {
    console.error('Error fetching pending entries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch pending entries',
    };
  }
}
