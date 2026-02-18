'use server';

import { prisma } from '@/lib/db/client';
import { startOfWeek, startOfDay, endOfDay, addDays, format } from 'date-fns';

/**
 * Get weekly summary for a specific week and optional resolution
 *
 * DATABASE IS SOURCE OF TRUTH: All aggregations in SQL, not React state
 * DASHBOARDS ARE READ-ONLY: Never compute in client, only display
 *
 * @param weekStart - Start date of the week
 * @param resolutionId - Optional resolution ID filter
 * @returns Weekly summaries
 */
export async function getWeeklySummary(weekStart: Date, resolutionId?: string) {
  try {
    // Normalize to start of week
    const normalizedWeekStart = startOfWeek(weekStart, { weekStartsOn: 0 }); // Sunday, consistent with heatmap

    const summaries = await prisma.weeklySummary.findMany({
      where: {
        weekStart: normalizedWeekStart,
        ...(resolutionId && { resolutionId }),
      },
      include: {
        resolution: {
          include: {
            currentPhase: true,
          },
        },
      },
    });

    return { success: true, data: summaries };
  } catch (error) {
    console.error('Error fetching weekly summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch weekly summary',
    };
  }
}

/**
 * Get daily activity data for heatmap visualization
 *
 * PHASE-AWARE: Includes phase boundaries and expectations
 * RESOLUTION TYPE-AWARE: Different visualization for different types
 *
 * @param startDate - Start date of range
 * @param endDate - End date of range
 * @param resolutionId - Optional resolution ID filter
 * @returns Daily activity records
 */
export async function getDailyActivity(
  startDate: Date,
  endDate: Date,
  resolutionId?: string
) {
  try {
    // Normalize dates to start/end of day
    const normalizedStart = startOfDay(startDate);
    const normalizedEnd = endOfDay(endDate);

    const activities = await prisma.dailyActivity.findMany({
      where: {
        date: {
          gte: normalizedStart,
          lte: normalizedEnd,
        },
        ...(resolutionId && { resolutionId }),
      },
      include: {
        resolution: {
          include: {
            currentPhase: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return { success: true, data: activities };
  } catch (error) {
    console.error('Error fetching daily activity:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch daily activity',
    };
  }
}

/**
 * Get journal entry counts per day for the heatmap.
 *
 * Returns { date: "YYYY-MM-DD", count: number }[] over the given range.
 */
export async function getEntryCountsPerDay(startDate: Date, endDate: Date) {
  try {
    const entries = await prisma.journalEntry.findMany({
      where: {
        timestamp: { gte: startOfDay(startDate), lte: endOfDay(endDate) },
      },
      select: { timestamp: true },
      orderBy: { timestamp: 'asc' },
    });

    const counts = new Map<string, number>();
    for (const e of entries) {
      const key = format(new Date(e.timestamp), 'yyyy-MM-dd');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return {
      success: true,
      data: Array.from(counts.entries()).map(([date, count]) => ({ date, count })),
    };
  } catch (error) {
    console.error('Error fetching entry counts per day:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get journal entry counts per day for a specific resolution.
 *
 * Counts entries that have AI interpretations with detected activity
 * for the given resolution (PARTIAL or FULL).
 */
export async function getResolutionEntryCountsPerDay(
  resolutionId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const interpretations = await prisma.aIInterpretation.findMany({
      where: {
        detectedActivity: {
          path: [resolutionId],
          not: 'NONE',
        },
        journalEntry: { timestamp: { gte: startOfDay(startDate), lte: endOfDay(endDate) } },
      },
      include: {
        journalEntry: { select: { timestamp: true } },
      },
    });

    const counts = new Map<string, number>();
    for (const interp of interpretations) {
      if (!interp.journalEntry?.timestamp) continue;
      const key = format(new Date(interp.journalEntry.timestamp), 'yyyy-MM-dd');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return {
      success: true,
      data: Array.from(counts.entries()).map(([date, count]) => ({ date, count })),
    };
  } catch (error) {
    console.error('Error fetching resolution entry counts:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get heatmap data for all resolutions
 *
 * Returns data formatted for GitHub-style heatmap visualization
 *
 * @param startDate - Start date of range
 * @param endDate - End date of range
 * @returns Heatmap data grouped by resolution
 */
export async function getHeatmapData(startDate: Date, endDate: Date) {
  try {
    const normalizedStart = startOfDay(startDate);
    const normalizedEnd = endOfDay(endDate);

    // Get all active resolutions
    const resolutions = await prisma.resolution.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        currentPhase: true,
        dailyActivities: {
          where: {
            date: {
              gte: normalizedStart,
              lte: normalizedEnd,
            },
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    // Format for heatmap component
    const heatmapData = resolutions.map((resolution) => ({
      resolution: {
        id: resolution.id,
        name: resolution.name,
        type: resolution.type,
      },
      currentPhase: resolution.currentPhase
        ? {
            name: resolution.currentPhase.name,
            startDate: resolution.currentPhase.startDate,
            endDate: resolution.currentPhase.endDate,
            expectedFrequency: resolution.currentPhase.expectedFrequency,
            intensityLevel: resolution.currentPhase.intensityLevel,
          }
        : null,
      activities: resolution.dailyActivities.map((activity) => ({
        date: activity.date,
        level: activity.activityLevel,
      })),
    }));

    return { success: true, data: heatmapData };
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch heatmap data',
    };
  }
}

/**
 * Get engagement statistics for a resolution
 *
 * Provides aggregated metrics for dashboards
 *
 * @param resolutionId - Resolution ID
 * @param startDate - Optional start date (defaults to 30 days ago)
 * @param endDate - Optional end date (defaults to today)
 * @returns Engagement statistics
 */
export async function getEngagementStats(
  resolutionId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const normalizedStart = startDate
      ? startOfDay(startDate)
      : startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago
    const normalizedEnd = endDate ? endOfDay(endDate) : endOfDay(new Date());

    // Get daily activities in range
    const activities = await prisma.dailyActivity.findMany({
      where: {
        resolutionId,
        date: {
          gte: normalizedStart,
          lte: normalizedEnd,
        },
      },
    });

    // Calculate statistics
    const totalDays = Math.ceil(
      (normalizedEnd.getTime() - normalizedStart.getTime()) / (24 * 60 * 60 * 1000)
    );
    const activeDays = activities.filter((a) => a.activityLevel !== 'NONE').length;
    const fullActivityDays = activities.filter((a) => a.activityLevel === 'FULL').length;
    const partialActivityDays = activities.filter((a) => a.activityLevel === 'PARTIAL').length;

    // Get recent journal entries
    const recentEntries = await prisma.journalEntry.findMany({
      where: {
        linkedResolutionIds: {
          has: resolutionId,
        },
        timestamp: {
          gte: normalizedStart,
          lte: normalizedEnd,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 5,
    });

    return {
      success: true,
      data: {
        totalDays,
        activeDays,
        fullActivityDays,
        partialActivityDays,
        engagementRate: totalDays > 0 ? (activeDays / totalDays) * 100 : 0,
        recentEntries: recentEntries.map((entry) => ({
          id: entry.id,
          timestamp: entry.timestamp,
          preview: (entry.rawText ?? '').substring(0, 100),
        })),
      },
    };
  } catch (error) {
    console.error('Error fetching engagement stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch engagement stats',
    };
  }
}

/**
 * Get recent strategic signals from AI analysis
 *
 * Returns a mix of reframes, risk flags, and suggested adjustments from
 * recent AI interpretations. This powers the "Recent Strategic Signals"
 * section on the dashboard.
 *
 * @param limit - Maximum number of signals to return
 * @returns Recent strategic signals
 */
export async function getRecentSignals(limit = 5) {
  try {
    const interpretations = await prisma.aIInterpretation.findMany({
      where: {
        OR: [
          { reframeType: { not: null } },
          { riskFlags: { isEmpty: false } },
          { suggestedAdjustments: { not: null } },
        ],
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
      take: limit * 2,
    });

    const resolutions = await prisma.resolution.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    });

    const resolutionMap = new Map(resolutions.map((r) => [r.id, r.name]));

    type Signal = {
      id: string;
      type: 'reframe' | 'risk' | 'adjustment';
      text: string;
      resolutionName: string | null;
      momentumSignal: string;
      createdAt: Date;
      entryId: string;
    };

    const signals: Signal[] = [];

    for (const interp of interpretations) {
      // Derive resolution name from AI-detected activity (not user-linked IDs)
      const detected = interp.detectedActivity as Record<string, string> | null;
      let primaryResName: string | null = null;
      if (detected && typeof detected === 'object') {
        for (const [resId, level] of Object.entries(detected)) {
          if (level !== 'NONE' && resolutionMap.has(resId)) {
            primaryResName = resolutionMap.get(resId) ?? null;
            break;
          }
        }
      }

      if (interp.reframeType && interp.reframeSuggestion) {
        signals.push({
          id: `${interp.id}-reframe`,
          type: 'reframe',
          text: interp.reframeSuggestion,
          resolutionName: primaryResName,
          momentumSignal: interp.momentumSignal,
          createdAt: interp.createdAt,
          entryId: interp.journalEntryId,
        });
      }

      if (interp.riskFlags.length > 0) {
        for (let i = 0; i < interp.riskFlags.length; i++) {
          const flag = interp.riskFlags[i];
          signals.push({
            id: `${interp.id}-risk-${i}-${flag.substring(0, 10)}`,
            type: 'risk',
            text: flag,
            resolutionName: primaryResName,
            momentumSignal: interp.momentumSignal,
            createdAt: interp.createdAt,
            entryId: interp.journalEntryId,
          });
        }
      }

      if (interp.suggestedAdjustments && !interp.reframeType) {
        signals.push({
          id: `${interp.id}-adjust`,
          type: 'adjustment',
          text: interp.suggestedAdjustments,
          resolutionName: primaryResName,
          momentumSignal: interp.momentumSignal,
          createdAt: interp.createdAt,
          entryId: interp.journalEntryId,
        });
      }
    }

    // Deduplicate by text similarity and limit
    const seen = new Set<string>();
    const unique = signals.filter((s) => {
      const key = s.text.substring(0, 60).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return { success: true, data: unique.slice(0, limit) };
  } catch (error) {
    console.error('Error fetching recent signals:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch recent signals',
    };
  }
}

/**
 * Get momentum trends for all active resolutions
 *
 * Useful for dashboard overview
 *
 * @returns Momentum data for all active resolutions
 */
export async function getMomentumTrends() {
  try {
    // Get latest weekly summaries for each active resolution
    const latestSummaries = await prisma.weeklySummary.findMany({
      where: {
        resolution: {
          status: 'ACTIVE',
        },
      },
      include: {
        resolution: true,
      },
      orderBy: {
        weekStart: 'desc',
      },
      distinct: ['resolutionId'],
    });

    return { success: true, data: latestSummaries };
  } catch (error) {
    console.error('Error fetching momentum trends:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch momentum trends',
    };
  }
}

/**
 * Get weekly review data aggregated from AI interpretations and daily activities
 *
 * This computes review data on-the-fly rather than relying on pre-computed
 * WeeklySummary records. For each active resolution, it gathers:
 * - Journal entries that mention or engage with the resolution
 * - Daily activity levels for the week
 * - AI interpretation signals (momentum, risk flags, adjustments)
 *
 * @param weekStart - Sunday that begins the week
 * @returns Aggregated weekly review data grouped by resolution
 */
export async function getWeeklyReviewData(weekStart: Date) {
  try {
    const normalizedStart = startOfDay(startOfWeek(weekStart, { weekStartsOn: 0 }));
    const weekEnd = endOfDay(addDays(normalizedStart, 6));
    const prevWeekStart = addDays(normalizedStart, -7);
    const prevWeekEnd = endOfDay(addDays(normalizedStart, -1));

    // Get all active resolutions
    const resolutions = await prisma.resolution.findMany({
      where: { status: 'ACTIVE' },
      include: { currentPhase: true },
    });

    if (resolutions.length === 0) {
      return { success: true, data: [] };
    }

    // Get all journal entries for this week
    const entries = await prisma.journalEntry.findMany({
      where: {
        timestamp: {
          gte: normalizedStart,
          lte: weekEnd,
        },
      },
      include: {
        interpretations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Get daily activities for this week and the prior week (for trend comparison)
    const [dailyActivities, previousDailyActivities] = await Promise.all([
      prisma.dailyActivity.findMany({
        where: {
          date: {
            gte: normalizedStart,
            lte: weekEnd,
          },
        },
      }),
      prisma.dailyActivity.findMany({
        where: {
          date: {
            gte: prevWeekStart,
            lte: prevWeekEnd,
          },
        },
      }),
    ]);

    type WeeklyResolutionReview = {
      resolution: {
        id: string;
        name: string;
        type: string;
        purpose: string | null;
      };
      activeDays: number;
      fullDays: number;
      partialDays: number;
      momentumTrend: 'GROWING' | 'STABLE' | 'DECLINING';
      riskFlags: string[];
      adjustments: string[];
      entryCount: number;
    };

    const reviews: WeeklyResolutionReview[] = [];

    for (const resolution of resolutions) {
      // Get activities for this resolution this week and last week
      const resActivities = dailyActivities.filter((a) => a.resolutionId === resolution.id);
      const fullDays = resActivities.filter((a) => a.activityLevel === 'FULL').length;
      const partialDays = resActivities.filter((a) => a.activityLevel === 'PARTIAL').length;
      const activeDays = fullDays + partialDays;

      const prevResActivities = previousDailyActivities.filter((a) => a.resolutionId === resolution.id);
      const prevActiveDays = prevResActivities.filter((a) => a.activityLevel !== 'NONE').length;

      // Gather signals from interpretations that reference this resolution
      const riskFlags: string[] = [];
      const adjustments: string[] = [];
      let entryCount = 0;

      for (const entry of entries) {
        const interp = entry.interpretations[0];
        if (!interp) continue;

        // Check if interpretation detected activity for this resolution
        const detected = interp.detectedActivity as Record<string, string> | null;
        if (detected && detected[resolution.id] && detected[resolution.id] !== 'NONE') {
          entryCount++;
        }

        // Collect risk flags and adjustments from entries linked to this resolution
        if (entry.linkedResolutionIds.includes(resolution.id) || (detected && detected[resolution.id] && detected[resolution.id] !== 'NONE')) {
          riskFlags.push(...interp.riskFlags.filter((f) => !riskFlags.includes(f)));
          if (interp.suggestedAdjustments) {
            adjustments.push(interp.suggestedAdjustments);
          }
        }
      }

      // Determine momentum trend by comparing this week vs last week
      let momentumTrend: 'GROWING' | 'STABLE' | 'DECLINING' = 'STABLE';
      if (activeDays === 0 && entryCount === 0) momentumTrend = 'DECLINING';
      else if (activeDays > prevActiveDays) momentumTrend = 'GROWING';
      else if (activeDays < prevActiveDays) momentumTrend = 'DECLINING';

      reviews.push({
        resolution: {
          id: resolution.id,
          name: resolution.name,
          type: resolution.type,
          purpose: resolution.purpose,
        },
        activeDays,
        fullDays,
        partialDays,
        momentumTrend,
        riskFlags: [...new Set(riskFlags)].slice(0, 3),
        adjustments: [...new Set(adjustments)].slice(0, 2),
        entryCount,
      });
    }

    return { success: true, data: reviews };
  } catch (error) {
    console.error('Error fetching weekly review data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch weekly review data',
    };
  }
}
