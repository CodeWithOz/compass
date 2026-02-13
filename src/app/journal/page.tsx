import React from 'react';
import Link from 'next/link';
import { getJournalEntries } from '@/actions/journal';
import { getResolutions } from '@/actions/resolutions';
import { AppHeader } from '@/components/layout/AppHeader';
import { JournalFormWrapper } from './JournalFormWrapper';

export default async function JournalPage() {
  const [entriesResult, resolutionsResult] = await Promise.all([
    getJournalEntries({ limit: 20 }).catch(() => ({ success: false, data: [] })),
    getResolutions('ACTIVE').catch(() => ({ success: false, data: [] })),
  ]);

  const entries = (entriesResult as any).data || [];
  const resolutions = (resolutionsResult as any).data || [];

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <AppHeader />

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Date and Title */}
        <div className="mb-8">
          <p className="text-sm text-primary/70 mb-1">{dateStr}</p>
          <h1 className="text-2xl font-bold text-slate-900">Reflections</h1>
        </div>

        {/* Journal Entry Form */}
        <div className="mb-8">
          <JournalFormWrapper linkedResolutionIds={resolutions.map((r: any) => r.id)} />
        </div>

        {/* Recent Entries */}
        {entries.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                Recent Entries
              </h2>
              <div className="h-px bg-slate-200 flex-grow" />
            </div>
            <div className="space-y-3">
              {entries.map((entry: any) => (
                <Link
                  key={entry.id}
                  href={`/journal/${entry.id}`}
                  className="block bg-white border border-slate-200/80 rounded-xl p-5 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      {new Date(entry.timestamp).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-slate-400">
                      {entry.rawText.split(/\s+/).length} words
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{entry.rawText}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
