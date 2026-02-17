import React from 'react';
import Link from 'next/link';
import { getJournalEntries } from '@/actions/journal';
import { getResolutions } from '@/actions/resolutions';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { JournalFormWrapper } from './JournalFormWrapper';

export default async function JournalPage() {
  const [entriesResult, resolutionsResult] = await Promise.all([
    getJournalEntries({ limit: 20 }).catch(() => null),
    getResolutions('ACTIVE').catch(() => null),
  ]);

  const entries = entriesResult?.data ?? [];
  const resolutions = resolutionsResult?.data ?? [];

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <AppHeader />

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Date and Title */}
        <div className="mb-8">
          <p className="text-sm text-primary/70 mb-1">{dateStr}</p>
          <h1 className="text-2xl font-bold tracking-tight">Reflections</h1>
        </div>

        {/* Journal Entry Form */}
        <div className="mb-8">
          <JournalFormWrapper linkedResolutionIds={resolutions.map((r) => r.id)} />
        </div>

        {/* Recent Entries */}
        {entries.length > 0 && (
          <section id="entries" className="mt-16 scroll-mt-20">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                Recent Entries
              </h2>
              <Separator className="flex-grow" />
            </div>
            <div className="space-y-3">
              {entries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/journal/${entry.id}`}
                  className="block"
                >
                  <Card className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-baseline justify-between mb-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {new Date(entry.timestamp).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(entry.rawText ?? '').match(/\S+/g)?.length ?? 0} words
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{entry.rawText ?? ''}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
