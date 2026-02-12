import React from 'react';
import Link from 'next/link';
import { getJournalEntries } from '@/actions/journal';
import { getResolutions } from '@/actions/resolutions';
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
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-icons text-white text-lg">explore</span>
            </div>
            <span className="text-base font-bold tracking-wide text-slate-800">
              Compass
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              New Journal Entry
            </span>
            <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors">
              <span className="material-icons text-xl">close</span>
            </Link>
          </div>
        </div>
      </nav>

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

      {/* Bottom bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/60">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="material-icons text-sm">schedule</span>
            Draft auto-saved
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Shortcuts</span>
            <span>Guidelines</span>
          </div>
        </div>
      </footer>
    </>
  );
}
