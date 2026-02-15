import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getJournalEntry, getAdjacentEntryIds } from '@/actions/journal';
import { AppHeader } from '@/components/layout/AppHeader';
import { ReanalyzeButton } from './ReanalyzeButton';

export default async function JournalEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [entryResult, adjacentResult] = await Promise.all([
    getJournalEntry(id),
    getAdjacentEntryIds(id).catch(() => ({ success: false, data: { previousId: null, nextId: null } })),
  ]);

  if (!entryResult.success || !entryResult.data) {
    notFound();
  }

  const entry = entryResult.data;
  const { previousId, nextId } = (adjacentResult as any).data || { previousId: null, nextId: null };
  const latestInterpretation =
    entry.interpretations && entry.interpretations.length > 0
      ? entry.interpretations[0]
      : undefined;

  const entryDate = new Date(entry.timestamp);

  return (
    <>
      <AppHeader />

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Entry Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            {previousId ? (
              <Link
                href={`/journal/${previousId}`}
                className="text-slate-400 hover:text-slate-600 transition-colors flex items-center"
              >
                <span className="material-icons text-lg">chevron_left</span>
              </Link>
            ) : (
              <span className="text-slate-300 cursor-not-allowed flex items-center">
                <span className="material-icons text-lg">chevron_left</span>
              </span>
            )}
            <span className="text-xs font-medium text-primary uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full">
              Reflection
            </span>
            {nextId ? (
              <Link
                href={`/journal/${nextId}`}
                className="text-slate-400 hover:text-slate-600 transition-colors flex items-center"
              >
                <span className="material-icons text-lg">chevron_right</span>
              </Link>
            ) : (
              <span className="text-slate-300 cursor-not-allowed flex items-center">
                <span className="material-icons text-lg">chevron_right</span>
              </span>
            )}
          </div>
          <h1 className="text-3xl font-light text-slate-800 mb-2">
            {entryDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h1>
          <p className="text-sm text-slate-400 italic">
            A mindful review of your progress and momentum.
          </p>
        </div>

        {/* Main Entry Content */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-8 mb-10">
          {/* Entry metadata */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                To Myself
              </p>
              <h2 className="text-lg font-medium text-slate-800 italic">
                Honest Momentum Report
              </h2>
            </div>
            {latestInterpretation && (
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Status</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-green-600">On Track</span>
                </div>
              </div>
            )}
          </div>

          {/* Entry text */}
          <div className="space-y-8">
            <div>
              <p className="text-base text-slate-600 leading-relaxed whitespace-pre-wrap">
                {entry.rawText}
              </p>
            </div>
          </div>

          {/* AI Overall Observations */}
          {latestInterpretation && (
            <div className="mt-10 pt-8 border-t border-slate-200/60">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icons text-primary text-lg">menu_book</span>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Overall Observations
                </h3>
              </div>
              <div className="bg-primary/5 border-l-2 border-primary/30 p-5 rounded-r-lg">
                <p className="text-sm text-slate-600 italic leading-relaxed">
                  {latestInterpretation.narrativeSummary ||
                    latestInterpretation.suggestedAdjustments?.[0] ||
                    'Analysis pending...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors">
              <span className="material-icons text-base">print</span>
              Print Memo
            </button>
            <button className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors">
              <span className="material-icons text-base">share</span>
              Export PDF
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/journal"
              className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:border-slate-400 transition-colors"
            >
              Archive
            </Link>
            <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
              <span className="material-icons text-sm">edit</span>
              Edit Memo
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center py-8 border-t border-slate-200/60">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="material-icons text-slate-400 text-sm">explore</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
            Compass System - Reflection Protocol v2.1
          </p>
        </footer>
      </main>
    </>
  );
}
