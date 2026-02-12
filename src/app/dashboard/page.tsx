import React from 'react';
import Link from 'next/link';
import { getResolutions } from '@/actions/resolutions';
import { getActiveReframes } from '@/actions/reframes';
import { getHeatmapData } from '@/actions/analytics';
import { subDays } from 'date-fns';

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

  // Flatten activities for combined heatmap
  const allActivities = heatmapData.flatMap((item) =>
    item.activities.map((a) => ({
      date: new Date(a.date),
      level: a.level,
    }))
  );

  return (
    <>
      {/* Header */}
      <header className="max-w-2xl mx-auto pt-12 pb-16 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <h1 className="text-sm font-medium tracking-widest uppercase text-slate-500 dark:text-slate-400">
            Compass
          </h1>
        </div>
        <nav className="flex gap-6">
          <Link
            href="/resolutions?status=ARCHIVED"
            className="text-slate-400 hover:text-primary transition-colors"
          >
            <span className="material-icons text-[20px]">archive</span>
          </Link>
          <Link
            href="/settings"
            className="text-slate-400 hover:text-primary transition-colors"
          >
            <span className="material-icons text-[20px]">settings</span>
          </Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-6 pb-24">
        {/* Activity Heatmap Section */}
        <section className="mb-16">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Momentum
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>Quiet</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-sm bg-primary/10"></div>
                <div className="w-2 h-2 rounded-sm bg-primary/30"></div>
                <div className="w-2 h-2 rounded-sm bg-primary/60"></div>
                <div className="w-2 h-2 rounded-sm bg-primary"></div>
              </div>
              <span>Active</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="heatmap-grid">
              {/* Generate heatmap cells - showing last 80 days (4 rows x 20 cols) */}
              {Array.from({ length: 80 }).map((_, i) => {
                const date = subDays(endDate, 79 - i);
                const activity = allActivities.find(
                  (a) => a.date.toDateString() === date.toDateString()
                );

                let opacity = 10;
                if (activity) {
                  if (activity.level === 'FULL') opacity = 100;
                  else if (activity.level === 'PARTIAL') opacity = 40;
                  else opacity = 10;
                }

                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-sm bg-primary/${opacity}`}
                    style={{ backgroundColor: `rgba(19, 127, 236, ${opacity / 100})` }}
                  ></div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="flex flex-col items-center mb-20">
          <Link href="/journal">
            <button className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-3">
              <span className="material-icons">edit</span>
              Capture a reflection
            </button>
          </Link>
          <p className="mt-4 text-sm text-slate-400 dark:text-slate-500 italic">
            Be honest with yourself today.
          </p>
        </section>

        {/* Strategic Signals Section */}
        {allReframes.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-6">
              Recent Strategic Signals
            </h2>
            <div className="space-y-4">
              {allReframes.slice(0, 3).map((reframe: any) => (
                <div
                  key={reframe.id}
                  className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-primary/30 dark:hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                    <div>
                      <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
                        {reframe.reason || reframe.suggestion}
                      </p>
                      <span className="block mt-2 text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase">
                        {reframe.resolutionName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/resolutions"
                className="text-sm font-medium text-primary/70 hover:text-primary transition-colors"
              >
                View all observations
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* Subtle background decoration */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0"></div>

      <footer className="max-w-2xl mx-auto px-6 py-12 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-600 font-light">
          Compass is a space for momentum, not metrics.
        </p>
      </footer>
    </>
  );
}
