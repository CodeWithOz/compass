import React from 'react';
import Link from 'next/link';
import { getMomentumTrends } from '@/actions/analytics';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { startOfWeek, addWeeks } from 'date-fns';

export default async function WeeklyReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week: weekParam } = await searchParams;
  const weekOffset = parseInt(weekParam || '0', 10);

  const trendsResult = await getMomentumTrends().catch(() => null);
  const summaries = trendsResult?.data ?? [];

  const currentWeekStart = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset);
  const canGoForward = weekOffset < 0;
  const previousWeek = weekOffset - 1;
  const nextWeek = weekOffset + 1;

  return (
    <>
      <AppHeader />

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/review?week=${previousWeek}`}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
              Weekly Review
            </Badge>
            {canGoForward ? (
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/review?week=${nextWeek}`}>
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
            Week of {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </h1>
          <p className="text-sm text-muted-foreground italic">
            What has been happening? Patterns, rhythms, and signals.
          </p>
        </div>

        {/* Summaries */}
        {summaries.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-2">No weekly summaries available yet</p>
              <p className="text-sm text-muted-foreground">
                Weekly summaries are generated automatically based on your journal entries and activity patterns.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {(['GROWING', 'STABLE', 'DECLINING'] as const).map((trend) => {
              const summariesWithTrend = summaries.filter((s) => s.momentumTrend === trend);
              if (summariesWithTrend.length === 0) return null;

              const trendConfig = {
                GROWING: {
                  title: 'Growing Momentum',
                  icon: <TrendingUp className="h-5 w-5 text-green-600" />,
                  color: 'text-green-600',
                },
                STABLE: {
                  title: 'Stable Momentum',
                  icon: <Minus className="h-5 w-5 text-primary" />,
                  color: 'text-primary',
                },
                DECLINING: {
                  title: 'Shifting Patterns',
                  icon: <TrendingDown className="h-5 w-5 text-amber-600" />,
                  color: 'text-amber-600',
                },
              };

              return (
                <div key={trend}>
                  <div className="flex items-center gap-2 mb-4">
                    {trendConfig[trend].icon}
                    <h2 className={`text-lg font-semibold ${trendConfig[trend].color}`}>
                      {trendConfig[trend].title}
                    </h2>
                    <span className="text-xs text-muted-foreground">({summariesWithTrend.length})</span>
                  </div>
                  <div className="space-y-3">
                    {summariesWithTrend.map((summary) => (
                      <Card key={summary.id}>
                        <CardContent className="p-5">
                          <h3 className="text-sm font-semibold mb-2">
                            {summary.resolution.name}
                          </h3>
                          {summary.summaryText && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {summary.summaryText}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center py-8">
          <Separator className="mb-8" />
          <p className="text-xs text-muted-foreground italic">
            This is descriptive, not judgmental. Use it to understand what&apos;s happening, not to judge yourself.
          </p>
        </footer>
      </main>
    </>
  );
}
