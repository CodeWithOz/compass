import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getJournalEntry, getAdjacentEntryIds } from '@/actions/journal';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, BookOpen, ArrowLeft } from 'lucide-react';

export default async function JournalEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [entryResult, adjacentResult] = await Promise.all([
    getJournalEntry(id),
    getAdjacentEntryIds(id).catch(() => null),
  ]);

  if (!entryResult.success || !entryResult.data) {
    notFound();
  }

  const entry = entryResult.data;
  const adjacentData = adjacentResult?.data ?? null;
  const previousId = adjacentData?.previousId ?? null;
  const nextId = adjacentData?.nextId ?? null;
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
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/journal/${previousId}`}>
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="icon" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
              Reflection
            </Badge>
            {nextId ? (
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/journal/${nextId}`}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="icon" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
          <h1 className="text-3xl font-light mb-2">
            {entryDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </h1>
          <p className="text-sm text-muted-foreground italic">
            A mindful review of your progress and momentum.
          </p>
        </div>

        {/* Main Entry Content */}
        <Card className="mb-10">
          <CardContent className="p-8">
            {/* Entry metadata */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                  To Myself
                </p>
                <h2 className="text-lg font-medium italic">
                  Honest Momentum Report
                </h2>
              </div>
              {latestInterpretation && (() => {
                const signalConfig: Record<string, { label: string; className: string }> = {
                  HIGH: { label: 'High', className: 'bg-green-600' },
                  MEDIUM: { label: 'Medium', className: 'bg-primary' },
                  LOW: { label: 'Low', className: 'bg-amber-600' },
                  NONE: { label: 'No signal', className: 'bg-muted text-muted-foreground' },
                };
                const signal = signalConfig[latestInterpretation.momentumSignal] ?? { label: latestInterpretation.momentumSignal, className: 'bg-muted text-muted-foreground' };
                return (
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                    <Badge variant="default" className={signal.className}>
                      {signal.label}
                    </Badge>
                  </div>
                );
              })()}
            </div>

            {/* Entry text */}
            <div className="space-y-8">
              <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {entry.rawText}
              </p>
            </div>

            {/* AI Overall Observations */}
            {latestInterpretation && (
              <>
                <Separator className="my-8" />
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Overall Observations
                    </h3>
                  </div>
                  <div className="bg-accent/50 border-l-2 border-primary/30 p-5 rounded-r-lg">
                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                      {latestInterpretation.suggestedAdjustments ||
                        'Analysis pending...'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <Separator className="mb-6 mt-12" />
        <footer className="flex items-center justify-end pb-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/journal">
              <ArrowLeft className="h-4 w-4" />
              Back to Journal
            </Link>
          </Button>
        </footer>
      </main>
    </>
  );
}
