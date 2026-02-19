'use server';

import { prisma } from '@/lib/db/client';

/**
 * Get all active (unresolved) reframe suggestions
 *
 * Reframes are first-class strategic suggestions that should be
 * prominently displayed at the top of the dashboard
 *
 * @param resolutionId - Optional filter for specific resolution
 * @returns List of AI interpretations with active reframes
 */
export async function getActiveReframes(resolutionId?: string) {
  try {
    // Get journal entries with reframe suggestions
    const interpretations = await prisma.aIInterpretation.findMany({
      where: {
        reframeType: {
          not: null,
        },
        journalEntry: {
          ...(resolutionId && {
            linkedResolutionIds: {
              has: resolutionId,
            },
          }),
        },
      },
      include: {
        journalEntry: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Latest 10 reframes
    });

    // Group by resolution for easier display
    type ReframeEntry = {
      id: string;
      type: (typeof interpretations)[number]['reframeType'];
      reason: string | null;
      suggestion: string | null;
      detectedAt: Date;
      entryId: string;
    };

    const reframesByResolution = interpretations.reduce<Record<string, ReframeEntry[]>>((acc, interpretation) => {
      interpretation.journalEntry.linkedResolutionIds.forEach((resId) => {
        if (!acc[resId]) {
          acc[resId] = [];
        }
        acc[resId].push({
          id: interpretation.id,
          type: interpretation.reframeType,
          reason: interpretation.reframeReason,
          suggestion: interpretation.reframeSuggestion,
          detectedAt: interpretation.createdAt,
          entryId: interpretation.journalEntryId,
        });
      });
      return acc;
    }, {});

    return { success: true, data: reframesByResolution };
  } catch (error) {
    console.error('Error fetching active reframes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch active reframes',
    };
  }
}

/**
 * Dismiss a reframe suggestion
 *
 * Marks the reframe as seen/dismissed (can be implemented as metadata update)
 * For now, we just log the dismissal
 *
 * @param interpretationId - AI interpretation ID
 * @param reason - Optional reason for dismissal
 * @returns Success status
 */
export async function dismissReframe(interpretationId: string, reason?: string) {
  try {
    // Verify interpretation exists and has a reframe
    const interpretation = await prisma.aIInterpretation.findUnique({
      where: { id: interpretationId },
    });

    if (!interpretation) {
      throw new Error('Interpretation not found');
    }

    if (!interpretation.reframeType) {
      throw new Error('No reframe to dismiss');
    }

    // For now, we'll just log the dismissal
    // In the future, could add a 'dismissed' field or separate table to track this
    console.log(
      `🚫 Reframe dismissed: ${interpretation.reframeType} for interpretation ${interpretationId}`,
      reason ? `Reason: ${reason}` : ''
    );

    // Could implement:
    // await prisma.aIInterpretation.update({
    //   where: { id: interpretationId },
    //   data: { reframeDismissed: true, reframeDismissedAt: new Date(), reframeDismissalReason: reason }
    // });

    return { success: true };
  } catch (error) {
    console.error('Error dismissing reframe:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to dismiss reframe',
    };
  }
}

/**
 * Snooze a reframe suggestion
 *
 * Hide the reframe until a specified date
 *
 * @param interpretationId - AI interpretation ID
 * @param until - Date to snooze until
 * @returns Success status
 */
export async function snoozeReframe(interpretationId: string, until: Date) {
  try {
    // Verify interpretation exists and has a reframe
    const interpretation = await prisma.aIInterpretation.findUnique({
      where: { id: interpretationId },
    });

    if (!interpretation) {
      throw new Error('Interpretation not found');
    }

    if (!interpretation.reframeType) {
      throw new Error('No reframe to snooze');
    }

    // For now, just log the snooze
    console.log(
      `⏰ Reframe snoozed until ${until.toISOString()}: ${interpretation.reframeType} for interpretation ${interpretationId}`
    );

    // Could implement:
    // await prisma.aIInterpretation.update({
    //   where: { id: interpretationId },
    //   data: { reframeSnoozedUntil: until }
    // });

    return { success: true };
  } catch (error) {
    console.error('Error snoozing reframe:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to snooze reframe',
    };
  }
}

/**
 * Apply a reframe suggestion
 *
 * User took action on the reframe (e.g., updated resolution, changed approach)
 * Log this for audit trail
 *
 * @param interpretationId - AI interpretation ID
 * @param action - Description of action taken
 * @returns Success status
 */
export async function applyReframe(interpretationId: string, action: string) {
  try {
    // Verify interpretation exists and has a reframe
    const interpretation = await prisma.aIInterpretation.findUnique({
      where: { id: interpretationId },
    });

    if (!interpretation) {
      throw new Error('Interpretation not found');
    }

    if (!interpretation.reframeType) {
      throw new Error('No reframe to apply');
    }

    // Log the application for audit trail
    console.log(
      `✅ Reframe applied: ${interpretation.reframeType} for interpretation ${interpretationId}`,
      `Action taken: ${action}`
    );

    // Could implement:
    // await prisma.aIInterpretation.update({
    //   where: { id: interpretationId },
    //   data: { reframeApplied: true, reframeAppliedAt: new Date(), reframeAction: action }
    // });

    // Could also create a reframe actions log table:
    // await prisma.reframeAction.create({
    //   data: {
    //     interpretationId,
    //     reframeType: interpretation.reframeType,
    //     actionTaken: action,
    //   }
    // });

    return { success: true };
  } catch (error) {
    console.error('Error applying reframe:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply reframe',
    };
  }
}

/**
 * Get reframe history for a resolution
 *
 * Shows all reframes detected over time for pattern analysis
 *
 * @param resolutionId - Resolution ID
 * @param limit - Maximum number of reframes to return
 * @returns List of reframes
 */
export async function getReframeHistory(resolutionId: string, limit = 20) {
  try {
    const interpretations = await prisma.aIInterpretation.findMany({
      where: {
        reframeType: {
          not: null,
        },
        journalEntry: {
          linkedResolutionIds: {
            has: resolutionId,
          },
        },
      },
      include: {
        journalEntry: {
          select: {
            id: true,
            timestamp: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    const history = interpretations.map((interpretation) => ({
      id: interpretation.id,
      type: interpretation.reframeType,
      reason: interpretation.reframeReason,
      suggestion: interpretation.reframeSuggestion,
      detectedAt: interpretation.createdAt,
      entryTimestamp: interpretation.journalEntry.timestamp,
    }));

    return { success: true, data: history };
  } catch (error) {
    console.error('Error fetching reframe history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reframe history',
    };
  }
}
