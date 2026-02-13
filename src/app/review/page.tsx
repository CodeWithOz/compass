import React from 'react';
import Link from 'next/link';
import { getMomentumTrends } from '@/actions/analytics';
import { AppHeader } from '@/components/layout/AppHeader';
import { startOfWeek } from 'date-fns';

export default async function WeeklyReviewPage() {
  const trendsResult = await getMomentumTrends().catch(() => ({ success: false, data: [] }));
  const summaries = (trendsResult as any).data || [];

  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  return (
    <>
      <AppHeader />

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-medium text-primary uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full">
            Weekly Review
          </span>
          <h1 className="text-3xl font-light text-slate-800 mt-4 mb-2">
            Week of {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </h1>
          <p className="text-sm text-slate-400 italic">
            What has been happening? Patterns, rhythms, and signals.
          </p>
        </div>

        {/* Summaries */}
        {summaries.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center">
            <p className="text-slate-500 mb-2">No weekly summaries available yet</p>
            <p className="text-sm text-slate-400">
              Weekly summaries are generated automatically based on your journal entries and activity patterns.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {(['GROWING', 'STABLE', 'DECLINING'] as const).map((trend) => {
              const summariesWithTrend = summaries.filter((s: any) => s.momentumTrend === trend);
              if (summariesWithTrend.length === 0) return null;

              const trendConfig = {
                GROWING: { title: 'Growing Momentum', icon: 'trending_up', color: 'text-green-600' },
                STABLE: { title: 'Stable Momentum', icon: 'trending_flat', color: 'text-primary' },
                DECLINING: { title: 'Shifting Patterns', icon: 'trending_down', color: 'text-amber-600' },
              };

              return (
                <div key={trend}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`material-icons ${trendConfig[trend].color}`}>
                      {trendConfig[trend].icon}
                    </span>
                    <h2 className={`text-lg font-semibold ${trendConfig[trend].color}`}>
                      {trendConfig[trend].title}
                    </h2>
                    <span className="text-xs text-slate-400">({summariesWithTrend.length})</span>
                  </div>
                  <div className="space-y-3">
                    {summariesWithTrend.map((summary: any) => (
                      <div
                        key={summary.id}
                        className="bg-white border border-slate-200/80 rounded-xl p-5"
                      >
                        <h3 className="text-sm font-semibold text-slate-800 mb-2">
                          {summary.resolutionName || 'Resolution'}
                        </h3>
                        {summary.narrativeSummary && (
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {summary.narrativeSummary}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center py-8 border-t border-slate-200/60">
          <p className="text-xs text-slate-400 italic">
            This is descriptive, not judgmental. Use it to understand what&apos;s happening, not to judge yourself.
          </p>
        </footer>
      </main>
    </>
  );
}
