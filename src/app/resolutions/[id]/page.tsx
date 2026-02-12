import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getResolution } from '@/actions/resolutions';
import { getDailyActivity } from '@/actions/analytics';
import { getJournalEntries } from '@/actions/journal';
import { HeatmapChart } from '@/components/features/HeatmapChart';
import { ArchiveResolutionButton } from './ArchiveResolutionButton';
import { subDays } from 'date-fns';

/**
 * Resolution Detail
 *
 * Primary question: What's happening with this resolution over time?
 *
 * Sections:
 * 1. Activity timeline / mini heatmap
 * 2. Recent entries (insights)
 * 3. Exit / Pause controls
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

  const endDate = new Date();
  const startDate = subDays(endDate, 365);

  const [activityResult, entriesResult] = await Promise.all([
    getDailyActivity(startDate, endDate, params.id),
    getJournalEntries({
      resolutionId: params.id,
      limit: 10,
    }),
  ]);

  const activities = activityResult.data || [];
  const recentEntries = entriesResult.data || [];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <Link
          href="/resolutions"
          className="text-sm text-neutral-500 hover:text-neutral-900 mb-4 inline-block"
        >
          ← Resolutions
        </Link>
        <h1 className="text-2xl font-medium text-neutral-900 mb-2">{resolution.name}</h1>
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <span>
            {resolution.type === 'HABIT_BUNDLE' && 'Habit bundle'}
            {resolution.type === 'MEASURABLE_OUTCOME' && 'Measurable outcome'}
            {resolution.type === 'EXPLORATORY_TRACK' && 'Exploratory track'}
          </span>
          {resolution.currentPhase && (
            <>
              <span>•</span>
              <span>{resolution.currentPhase.name}</span>
            </>
          )}
        </div>

        {/* Purpose & Details */}
        {resolution.purpose && (
          <div className="mt-4 text-sm text-neutral-600">
            <p className="font-medium text-neutral-700 mb-1">Purpose</p>
            <p>{resolution.purpose}</p>
          </div>
        )}

        {resolution.type === 'MEASURABLE_OUTCOME' && resolution.targetDate && (
          <div className="mt-4 text-sm text-neutral-600">
            <p className="font-medium text-neutral-700 mb-1">Target date</p>
            <p>
              {new Date(resolution.targetDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}

        {resolution.type === 'EXPLORATORY_TRACK' && resolution.exitCriteria && (
          <div className="mt-4 text-sm text-neutral-600">
            <p className="font-medium text-neutral-700 mb-1">Exit criteria</p>
            <p>{resolution.exitCriteria}</p>
          </div>
        )}

        {resolution.constraints && (
          <div className="mt-4 text-sm text-neutral-600">
            <p className="font-medium text-neutral-700 mb-1">Constraints</p>
            <p>{resolution.constraints}</p>
          </div>
        )}
      </div>

      {/* Section 1: Activity Timeline */}
      <section>
        <h2 className="text-sm font-medium text-neutral-600 mb-4">Activity pattern</h2>
        <div className="border border-neutral-200 rounded-md bg-white p-6">
          <HeatmapChart
            data={activities.map((a) => ({
              date: new Date(a.date),
              level: a.activityLevel,
            }))}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      </section>

      {/* Section 2: Recent Entries */}
      {recentEntries.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-neutral-600 mb-4">Recent entries</h2>
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <Link
                key={entry.id}
                href={`/journal/${entry.id}`}
                className="block border border-neutral-200 rounded-md bg-white p-4 hover:border-neutral-300 transition-colors"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <p className="text-xs text-neutral-500">
                    {new Date(entry.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <p className="text-sm text-neutral-700 line-clamp-3">{entry.rawText}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Section 3: Exit / Pause Controls */}
      {resolution.status === 'ACTIVE' && (
        <section className="border-t border-neutral-200 pt-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-neutral-500">
              {resolution.type === 'EXPLORATORY_TRACK'
                ? 'Exit is a feature, not a failure'
                : 'Archive when no longer relevant'}
            </div>
            <ArchiveResolutionButton
              resolutionId={params.id}
              label={resolution.type === 'EXPLORATORY_TRACK' ? 'Exit' : 'Archive'}
            />
          </div>
        </section>
      )}

      {resolution.status === 'ARCHIVED' && resolution.exitNote && (
        <section className="border border-neutral-200 rounded-md bg-neutral-50 p-4">
          <p className="text-sm font-medium text-neutral-700 mb-1">Exit reflection</p>
          <p className="text-sm text-neutral-600 italic">{resolution.exitNote}</p>
        </section>
      )}
    </div>
  );
}
