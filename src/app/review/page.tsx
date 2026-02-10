import React from 'react';
import { getMomentumTrends } from '@/actions/analytics';
import { Card, CardContent } from '@/components/ui/Card';
import { WeeklySummaryCard } from '@/components/features/WeeklySummaryCard';
import { startOfWeek } from 'date-fns';

/**
 * Weekly Review Page
 *
 * - Weekly summaries for all resolutions
 * - Engagement scores and momentum trends
 * - Suggested adjustments from AI
 */
export default async function WeeklyReviewPage() {
  const trendsResult = await getMomentumTrends();
  const summaries = trendsResult.data || [];

  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Weekly Review</h1>
        <p className="text-gray-600">
          What has been happening? Patterns, rhythms, and signals from your resolutions.
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Week of {currentWeekStart.toLocaleDateString()}
        </p>
      </div>

      {/* Summaries */}
      {summaries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-3">No weekly summaries available yet</p>
            <p className="text-sm text-gray-400">
              Weekly summaries are generated automatically based on your journal entries and
              activity patterns
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Group by momentum trend */}
          {(['GROWING', 'STABLE', 'DECLINING'] as const).map((trend) => {
            const summariesWithTrend = summaries.filter((s) => s.momentumTrend === trend);
            if (summariesWithTrend.length === 0) return null;

            const trendConfig = {
              GROWING: {
                title: '📈 Growing Momentum',
                color: 'text-green-700',
              },
              STABLE: {
                title: '➡️ Stable Momentum',
                color: 'text-blue-700',
              },
              DECLINING: {
                title: '📉 Shifting Patterns',
                color: 'text-amber-700',
              },
            };

            return (
              <div key={trend}>
                <h2 className={`text-xl font-semibold mb-4 ${trendConfig[trend].color}`}>
                  {trendConfig[trend].title}{' '}
                  <span className="text-sm font-normal text-gray-500">
                    ({summariesWithTrend.length})
                  </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {summariesWithTrend.map((summary) => (
                    <WeeklySummaryCard key={summary.id} summary={summary} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Helper text */}
      <div className="mt-12 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900 font-medium mb-2">
          📊 Understanding Your Weekly Review
        </p>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            <strong>Growing Momentum:</strong> Patterns suggest increasing engagement and presence
          </li>
          <li>
            <strong>Stable Momentum:</strong> Consistent rhythm being maintained
          </li>
          <li>
            <strong>Shifting Patterns:</strong> Changes detected - not failure, just signals for
            reflection
          </li>
          <li className="mt-2 italic">
            Remember: This is descriptive, not judgmental. Use it to understand what&apos;s
            happening, not to judge yourself.
          </li>
        </ul>
      </div>
    </div>
  );
}
