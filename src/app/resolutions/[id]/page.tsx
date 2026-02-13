import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getResolution } from '@/actions/resolutions';
import { getDailyActivity } from '@/actions/analytics';
import { getJournalEntries } from '@/actions/journal';
import { AppHeader } from '@/components/layout/AppHeader';
import { ArchiveResolutionButton } from './ArchiveResolutionButton';
import { subDays } from 'date-fns';

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
  const startDate = subDays(endDate, 180);

  const [activityResult, entriesResult] = await Promise.all([
    getDailyActivity(startDate, endDate, params.id).catch(() => ({ success: false, data: [] })),
    getJournalEntries({ resolutionId: params.id, limit: 10 }).catch(() => ({ success: false, data: [] })),
  ]);

  const activities = (activityResult as any).data || [];
  const recentEntries = (entriesResult as any).data || [];

  return (
    <>
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 py-10">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-10">
        <Link
          href="/resolutions"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <span className="material-icons text-lg">arrow_back</span>
          Overview
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Active Reflection
          </span>
        </div>
      </div>

      {/* Title & Purpose */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">{resolution.name}</h1>
        {resolution.purpose && (
          <p className="text-lg text-slate-500 leading-relaxed">{resolution.purpose}</p>
        )}
      </div>

      {/* Constraint Cards */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        {resolution.constraints && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-4">
            <p className="text-[10px] font-medium text-primary/70 uppercase tracking-wider mb-1.5">
              Constraints
            </p>
            <p className="text-sm font-medium text-slate-700">{resolution.constraints}</p>
          </div>
        )}
        {resolution.currentPhase && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-4">
            <p className="text-[10px] font-medium text-primary/70 uppercase tracking-wider mb-1.5">
              Current Phase
            </p>
            <p className="text-sm font-medium text-slate-700">{resolution.currentPhase.name}</p>
          </div>
        )}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4">
          <p className="text-[10px] font-medium text-primary/70 uppercase tracking-wider mb-1.5">
            Type
          </p>
          <p className="text-sm font-medium text-slate-700">
            {resolution.type === 'HABIT_BUNDLE' && 'Habit Bundle'}
            {resolution.type === 'MEASURABLE_OUTCOME' && 'Measurable Outcome'}
            {resolution.type === 'EXPLORATORY_TRACK' && 'Exploratory Track'}
          </p>
        </div>
        {resolution.type === 'MEASURABLE_OUTCOME' && resolution.targetDate && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-4">
            <p className="text-[10px] font-medium text-primary/70 uppercase tracking-wider mb-1.5">
              Target Date
            </p>
            <p className="text-sm font-medium text-slate-700">
              {new Date(resolution.targetDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Engagement Momentum Heatmap */}
      <section className="mb-12">
        <div className="flex justify-between items-end mb-3">
          <h2 className="text-lg font-bold text-slate-900">Engagement Momentum</h2>
          <span className="text-xs text-slate-400">Past 6 Months</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80">
          <div className="heatmap-grid">
            {Array.from({ length: 60 }).map((_, i) => {
              const date = subDays(endDate, 59 - i);
              const activity = activities.find(
                (a: any) => new Date(a.date).toDateString() === date.toDateString()
              );

              let opacity = 0.08;
              if (activity) {
                if (activity.activityLevel === 'FULL') opacity = 1;
                else if (activity.activityLevel === 'PARTIAL') opacity = 0.4;
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
          <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400 uppercase tracking-wider">
            <span>Less Active</span>
            <div className="flex gap-0.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary/10" />
              <div className="w-2.5 h-2.5 rounded-sm bg-primary/30" />
              <div className="w-2.5 h-2.5 rounded-sm bg-primary/60" />
              <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
            </div>
            <span>Deep Work</span>
          </div>
        </div>
      </section>

      {/* Observed Patterns */}
      {recentEntries.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-icons text-primary text-xl">insights</span>
            <h2 className="text-lg font-bold text-slate-900">Observed Patterns</h2>
          </div>
          <div className="space-y-3">
            {recentEntries.slice(0, 3).map((entry: any) => (
              <Link
                key={entry.id}
                href={`/journal/${entry.id}`}
                className="flex items-start gap-4 bg-white border border-slate-200/80 rounded-xl p-5 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-icons text-primary text-lg">bolt</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    {new Date(entry.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                    {entry.rawText}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Exit reflection if archived */}
      {resolution.status === 'ARCHIVED' && resolution.exitNote && (
        <section className="mb-12 bg-amber-50/50 border border-amber-200/40 rounded-xl p-6">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded mb-3 inline-block">
            Exit Reflection
          </span>
          <p className="text-base text-slate-600 italic leading-relaxed">
            &quot;{resolution.exitNote}&quot;
          </p>
        </section>
      )}

      {/* Footer Controls */}
      <footer className="border-t border-slate-200/60 pt-6 mt-12 flex items-center justify-between">
        {resolution.status === 'ACTIVE' && (
          <>
            <ArchiveResolutionButton
              resolutionId={params.id}
              label={resolution.type === 'EXPLORATORY_TRACK' ? 'Exit' : 'Archive Resolution'}
            />
            <div className="flex items-center gap-3">
              <Link
                href={`/resolutions/${params.id}/edit`}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:border-slate-400 transition-colors"
              >
                Edit Detail
              </Link>
              <Link
                href="/resolutions"
                className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Exit View
              </Link>
            </div>
          </>
        )}
        {resolution.status === 'ARCHIVED' && (
          <Link
            href="/resolutions"
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Back to Resolutions
          </Link>
        )}
      </footer>
    </main>
    </>
  );
}
