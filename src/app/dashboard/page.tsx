import React from 'react';
import Link from 'next/link';
import { getResolutions } from '@/actions/resolutions';
import { getActiveReframes } from '@/actions/reframes';
import { getHeatmapData } from '@/actions/analytics';
import { HeatmapChart } from '@/components/features/HeatmapChart';
import { subDays } from 'date-fns';

/**
 * Dashboard / Home
 *
 * Primary question: What has been happening recently?
 *
 * Layout:
 * 1. Activity Heatmap (centerpiece)
 * 2. "Write an entry" CTA
 * 3. Strategic signals (recent reframes)
 */
export default async function DashboardPage() {
  const endDate = new Date();
  const startDate = subDays(endDate, 365);

  const [resolutionsResult, reframesResult, heatmapResult] = await Promise.all([
    getResolutions('ACTIVE'),
    getActiveReframes(),
    getHeatmapData(startDate, endDate),
  ]);

  const resolutions = resolutionsResult.data || [];
  const reframesByResolution = reframesResult.data || {};
  const heatmapData = heatmapResult.data || [];

  // Flatten reframes
  const allReframes = Object.entries(reframesByResolution).flatMap(([resId, reframes]) =>
    reframes.map((reframe: any) => ({
      ...reframe,
      resolutionName:
        resolutions.find((r) => r.id === resId)?.name || 'Unknown Resolution',
    }))
  );

  return (
    <div className="space-y-12">
      {/* Section 1: Activity Heatmap (centerpiece) */}
      <section>
        <h2 className="text-sm font-medium text-neutral-600 mb-4">Activity pattern</h2>
        {heatmapData.length > 0 ? (
          <div className="space-y-8">
            {heatmapData.map((item) => (
              <div key={item.resolution.id} className="space-y-3">
                <div>
                  <Link
                    href={`/resolutions/${item.resolution.id}`}
                    className="text-base font-medium text-neutral-900 hover:text-blue-600 transition-colors"
                  >
                    {item.resolution.name}
                  </Link>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {item.resolution.type === 'HABIT_BUNDLE' && 'Habit bundle'}
                    {item.resolution.type === 'MEASURABLE_OUTCOME' && 'Measurable outcome'}
                    {item.resolution.type === 'EXPLORATORY_TRACK' && 'Exploratory track'}
                    {item.currentPhase && ` • ${item.currentPhase.name}`}
                  </p>
                </div>
                <HeatmapChart
                  data={item.activities.map((a) => ({
                    date: new Date(a.date),
                    level: a.activityLevel,
                  }))}
                  startDate={startDate}
                  endDate={endDate}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-neutral-200 rounded-md bg-white p-12 text-center">
            <p className="text-neutral-500 mb-4">No resolutions yet</p>
            <Link
              href="/resolutions"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first resolution
            </Link>
          </div>
        )}
      </section>

      {/* Section 2: Write Entry CTA */}
      <section>
        <Link
          href="/journal"
          className="block border border-neutral-300 rounded-md bg-white p-6 hover:border-neutral-400 transition-colors text-center"
        >
          <p className="text-neutral-600">Write an entry</p>
        </Link>
      </section>

      {/* Section 3: Strategic Signals */}
      {allReframes.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-neutral-600 mb-4">Strategic signals</h2>
          <div className="space-y-4">
            {allReframes.slice(0, 3).map((reframe: any) => (
              <div
                key={reframe.id}
                className="border border-neutral-200 rounded-md bg-white p-4"
              >
                <p className="text-sm font-medium text-neutral-900 mb-1">
                  {reframe.type === 'MISALIGNMENT' && 'Pattern shift detected'}
                  {reframe.type === 'STAGNATION' && 'Stagnation pattern'}
                  {reframe.type === 'OVER_OPTIMIZATION' && 'Over-optimization detected'}
                  {reframe.type === 'PHASE_MISMATCH' && 'Phase mismatch'}
                  {reframe.type === 'EXIT_SIGNAL' && 'Exit signal'}
                  {' in '}
                  <Link
                    href={`/resolutions/${reframe.resolutionId}`}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    "{reframe.resolutionName}"
                  </Link>
                </p>
                {reframe.reason && (
                  <p className="text-sm text-neutral-600 mt-1">
                    → {reframe.reason}
                  </p>
                )}
                {reframe.suggestion && (
                  <p className="text-sm text-neutral-500 italic mt-2">
                    {reframe.suggestion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
