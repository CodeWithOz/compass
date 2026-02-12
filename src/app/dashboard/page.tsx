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
    getActiveReframes().catch(() => ({ success: false, data: {} })),
    getHeatmapData(startDate, endDate).catch(() => ({ success: false, data: [] })),
  ]);

  const resolutions = resolutionsResult.data || [];
  const reframesByResolution = (reframesResult as any).data || {};
  const heatmapData = (heatmapResult as any).data || [];

  // Flatten reframes
  const allReframes = Object.entries(reframesByResolution).flatMap(([resId, reframes]: [string, any]) =>
    reframes.map((reframe: any) => ({
      ...reframe,
      resolutionName:
        resolutions.find((r) => r.id === resId)?.name || 'Unknown Resolution',
    }))
  );

  // Flatten activities for combined heatmap
  const allActivities = heatmapData.flatMap((item: any) =>
    item.activities.map((a: any) => ({
      date: new Date(a.date),
      level: a.level,
    }))
  );

  return (
    <>
      {/* Header */}
      <header className="max-w-2xl mx-auto pt-10 pb-12 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <h1 className="text-sm font-semibold tracking-[0.2em] uppercase text-slate-500">
            Compass
          </h1>
        </div>
        <nav className="flex items-center gap-5">
          <Link
            href="/resolutions?status=ARCHIVED"
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-icons text-xl">inventory_2</span>
          </Link>
          <Link
            href="/settings"
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-icons text-xl">settings</span>
          </Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-6 pb-24">
        {/* Activity Heatmap Section */}
        <section className="mb-14">
          <div className="flex justify-between items-end mb-3">
            <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Momentum
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span>Quiet</span>
              <div className="flex gap-0.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-primary/10" />
                <div className="w-2.5 h-2.5 rounded-sm bg-primary/30" />
                <div className="w-2.5 h-2.5 rounded-sm bg-primary/60" />
                <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
              </div>
              <span>Active</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
            <div className="heatmap-grid">
              {Array.from({ length: 80 }).map((_, i) => {
                const date = subDays(endDate, 79 - i);
                const activity = allActivities.find(
                  (a: any) => a.date.toDateString() === date.toDateString()
                );

                let opacity = 0.08;
                if (activity) {
                  if (activity.level === 'FULL') opacity = 1;
                  else if (activity.level === 'PARTIAL') opacity = 0.4;
                  else opacity = 0.12;
                }

                return (
                  <div
                    key={i}
                    className="aspect-square rounded-sm"
                    style={{ backgroundColor: `rgba(19, 127, 236, ${opacity})` }}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="flex flex-col items-center mb-16">
          <Link href="/journal">
            <button className="bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-full font-medium shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center gap-3 text-base">
              <span className="material-icons text-xl">edit</span>
              Capture a reflection
            </button>
          </Link>
          <p className="mt-4 text-sm text-slate-400 italic">
            Be honest with yourself today.
          </p>
        </section>

        {/* Strategic Signals Section */}
        {allReframes.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-5">
              Recent Strategic Signals
            </h2>
            <div className="space-y-3">
              {allReframes.slice(0, 3).map((reframe: any) => (
                <div
                  key={reframe.id}
                  className="p-5 bg-white border border-slate-200/80 rounded-xl"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                    <div>
                      <p className="text-[15px] leading-relaxed text-slate-600">
                        {reframe.reason || reframe.suggestion}
                      </p>
                      <span className="block mt-2 text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                        {reframe.resolutionName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
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

      <footer className="max-w-2xl mx-auto px-6 py-10 border-t border-slate-200/60 text-center">
        <p className="text-xs text-slate-400 italic">
          Compass is a space for momentum, not metrics.
        </p>
      </footer>
    </>
  );
}
