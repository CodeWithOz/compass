import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getResolution } from '@/actions/resolutions';
import { getPhases } from '@/actions/phases';
import { getDailyActivity, getEngagementStats } from '@/actions/analytics';
import { getJournalEntries } from '@/actions/journal';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { HeatmapChart } from '@/components/features/HeatmapChart';
import { PhaseManager } from '@/components/features/PhaseManager';
import { ArchiveResolutionButton } from './ArchiveResolutionButton';
import { subDays } from 'date-fns';

/**
 * Resolution Detail Page
 *
 * Single resolution view with:
 * - Type-specific displays
 * - Phase management interface
 * - Resolution-specific heatmap with phase boundaries
 * - Recent journal entries related to this resolution
 * - AI insights and momentum trends
 * - Reframe suggestions specific to this resolution
 * - For EXPLORATORY_TRACK: Prominent "Exit gracefully" option
 */
export default async function ResolutionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const resolutionResult = await getResolution(params.id);

  if (!resolutionResult.success || !resolutionResult.data) {
    notFound();
  }

  const resolution = resolutionResult.data;

  // Fetch related data in parallel
  const endDate = new Date();
  const startDate = subDays(endDate, 365);

  const [phasesResult, activityResult, statsResult, entriesResult] = await Promise.all([
    getPhases(params.id),
    getDailyActivity(startDate, endDate, params.id),
    getEngagementStats(params.id, subDays(endDate, 30), endDate),
    getJournalEntries({
      resolutionId: params.id,
      limit: 5,
    }),
  ]);

  const phases = phasesResult.data || [];
  const activities = activityResult.data || [];
  const stats = statsResult.data;
  const recentEntries = entriesResult.data || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/resolutions" className="text-blue-600 hover:underline text-sm mb-2 block">
          ← Back to Resolutions
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{resolution.name}</h1>
            <div className="flex gap-2 mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {resolution.type.replace('_', ' ')}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  resolution.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : resolution.status === 'PAUSED'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {resolution.status}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/resolutions/${params.id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            {resolution.type === 'EXPLORATORY_TRACK' && resolution.status === 'ACTIVE' && (
              <ArchiveResolutionButton
                resolutionId={params.id}
                label="Exit Gracefully"
                variant="primary"
              />
            )}
            {resolution.status === 'ACTIVE' && resolution.type !== 'EXPLORATORY_TRACK' && (
              <ArchiveResolutionButton resolutionId={params.id} />
            )}
          </div>
        </div>
      </div>

      {/* Resolution Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Purpose and details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resolution.purpose && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Purpose</p>
                  <p className="text-sm text-gray-600 mt-1">{resolution.purpose}</p>
                </div>
              )}

              {resolution.type === 'MEASURABLE_OUTCOME' && resolution.targetDate && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Target Date</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(resolution.targetDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {resolution.type === 'EXPLORATORY_TRACK' && resolution.exitCriteria && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Exit Criteria</p>
                  <p className="text-sm text-gray-600 mt-1">{resolution.exitCriteria}</p>
                </div>
              )}

              {resolution.successSignals && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Success Signals</p>
                  <p className="text-sm text-gray-600 mt-1">{resolution.successSignals}</p>
                </div>
              )}

              {resolution.constraints && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Constraints</p>
                  <p className="text-sm text-gray-600 mt-1">{resolution.constraints}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Pattern (Last 365 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <HeatmapChart
                data={activities.map((a) => ({
                  date: new Date(a.date),
                  level: a.activityLevel,
                }))}
                startDate={startDate}
                endDate={endDate}
              />
            </CardContent>
          </Card>

          {/* Recent Journal Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Journal Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {recentEntries.length > 0 ? (
                <div className="space-y-3">
                  {recentEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="border-l-4 border-blue-500 pl-3 py-2 hover:bg-gray-50"
                    >
                      <Link href={`/journal/${entry.id}`}>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {entry.rawText.substring(0, 150)}...
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </p>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No journal entries yet for this resolution
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Engagement Stats */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Last 30 Days</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Engagement Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {Math.round(stats.engagementRate)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.activeDays} of {stats.totalDays} days
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600">Full Activity</p>
                    <p className="text-lg font-semibold text-green-600">
                      {stats.fullActivityDays}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Partial Activity</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {stats.partialActivityDays}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-400 italic">
                  Presence and rhythm, not perfection
                </p>
              </CardContent>
            </Card>
          )}

          {/* Phase Manager */}
          <PhaseManager
            resolutionId={params.id}
            currentPhase={resolution.currentPhase}
            phases={phases}
          />
        </div>
      </div>
    </div>
  );
}
