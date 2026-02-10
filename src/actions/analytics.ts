'use server';

import { prisma } from '@/lib/db/client';
import { startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

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
    const normalizedWeekStart = startOfWeek(weekStart, { weekStartsOn: 1 }); // Monday

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
    const activeDays = activities.length;
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
          preview: entry.rawText.substring(0, 100),
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
