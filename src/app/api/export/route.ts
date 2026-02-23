import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

/**
 * GET /api/export
 *
 * Export all user data as JSON
 * Includes: resolutions, phases, journal entries, interpretations, activity data
 *
 * EXIT IS A FEATURE: User owns their data and can export it anytime
 */
export async function GET() {
  try {
    // Fetch all data in parallel
    const [resolutions, journalEntries, weeklySummaries, dailyActivities] = await Promise.all([
      prisma.resolution.findMany({
        include: {
          phases: true,
          currentPhase: true,
        },
      }),
      prisma.journalEntry.findMany({
        include: {
          interpretations: true,
        },
      }),
      prisma.weeklySummary.findMany({
        include: {
          resolution: true,
        },
      }),
      prisma.dailyActivity.findMany({
        include: {
          resolution: true,
        },
      }),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {
        resolutions,
        journalEntries,
        weeklySummaries,
        dailyActivities,
      },
      stats: {
        totalResolutions: resolutions.length,
        totalJournalEntries: journalEntries.length,
        totalInterpretations: journalEntries.reduce(
          (sum, entry) => sum + (entry.interpretations?.length || 0),
          0
        ),
        totalWeeklySummaries: weeklySummaries.length,
        totalDailyActivities: dailyActivities.length,
      },
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
