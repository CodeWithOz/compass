import React from 'react';
import Link from 'next/link';
import { getWeeklyReviewData } from '@/actions/analytics';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { startOfWeek, addWeeks, format } from 'date-fns';

export default async function WeeklyReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week: weekParam } = await searchParams;
  const parsedWeek = parseInt(weekParam || '0', 10);
  const weekOffset = Number.isFinite(parsedWeek) ? parsedWeek : 0;

  const currentWeekStart = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset);
  const canGoForward = weekOffset < 0;
  const previousWeek = weekOffset - 1;
  const nextWeek = weekOffset + 1;

  const reviewResult = await getWeeklyReviewData(currentWeekStart).catch(() => null);
  const reviews = reviewResult?.data ?? [];

  const trendConfig = {
    GROWING: {
      title: 'Growing Momentum',
      icon: <TrendingUp className="h-5 w-5 text-green-600" />,
      color: 'text-green-600',
    },
    STABLE: {
      title: 'Steady Rhythm',
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
    <>
      <AppHeader />

      <main className="max-w-3xl mx-auto px-6 py-10 pb-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Button variant="ghost" size="icon" aria-label="Previous week" asChild>
              <Link href={`/review?week=${previousWeek}`}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
              Weekly Review
            </Badge>
            {canGoForward ? (
              <Button variant="ghost" size="icon" aria-label="Next week" asChild>
                <Link href={`/review?week=${nextWeek}`}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="icon" aria-label="Next week" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
          <h1 className="text-3xl font-light mb-2">
            Week of {format(currentWeekStart, 'MMM d')}
          </h1>
          <p className="text-sm text-muted-foreground italic">
            What has been happening? Patterns, rhythms, and signals.
          </p>
        </div>

        {/* Reviews */}
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-2">No active resolutions to review</p>
              <p className="text-sm text-muted-foreground">
                Create resolutions and write journal entries to see your weekly review here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {(['GROWING', 'STABLE', 'DECLINING'] as const).map((trend) => {
              const trendReviews = reviews.filter((r) => r.momentumTrend === trend);
              if (trendReviews.length === 0) return null;

              return (
                <div key={trend}>
                  <div className="flex items-center gap-2 mb-4">
                    {trendConfig[trend].icon}
                    <h2 className={`text-lg font-semibold ${trendConfig[trend].color}`}>
                      {trendConfig[trend].title}
                    </h2>
                    <span className="text-xs text-muted-foreground">({trendReviews.length})</span>
                  </div>
                  <div className="space-y-3">
                    {trendReviews.map((review) => (
                      <Link
                        key={review.resolution.id}
                        href={`/resolutions/${review.resolution.id}`}
                        className="block"
                      >
                        <Card className="hover:border-primary/30 transition-colors">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-sm font-semibold">{review.resolution.name}</h3>
                              <div className="flex items-center gap-2">
                                {review.activeDays > 0 && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {review.activeDays} active day{review.activeDays !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                                {review.entryCount > 0 && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {review.entryCount} entr{review.entryCount !== 1 ? 'ies' : 'y'}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Activity bar */}
                            <div className="flex gap-1 mb-3">
                              {Array.from({ length: 7 }).map((_, i) => {
                                let bgClass = 'bg-primary/[0.08]';
                                if (i < review.fullDays) bgClass = 'bg-primary';
                                else if (i < review.fullDays + review.partialDays) bgClass = 'bg-primary/40';
                                return (
                                  <div
                                    key={i}
                                    className={`h-1.5 flex-1 rounded-full ${bgClass}`}
                                  />
                                );
                              })}
                            </div>

                            {/* Risk flags */}
                            {review.riskFlags.length > 0 && (
                              <div className="mt-3 space-y-1.5">
                                {review.riskFlags.map((flag, i) => (
                                  <div key={i} className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-md px-3 py-2">
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                                    <span className="text-xs text-muted-foreground line-clamp-2">{flag}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Adjustments */}
                            {review.adjustments.length > 0 && (
                              <div className="mt-2 space-y-1.5">
                                {review.adjustments.map((adj, i) => (
                                  <div key={i} className="flex items-start gap-2 bg-accent/50 border-l-2 border-primary/30 rounded-r-md px-3 py-2">
                                    <TrendingUp className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                    <p className="text-xs text-muted-foreground italic line-clamp-2">{adj}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {review.activeDays === 0 && review.entryCount === 0 && (
                              <p className="text-xs text-muted-foreground italic">
                                No engagement detected this week
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center pt-4 pb-2">
          <Separator className="mb-6" />
          <p className="text-xs text-muted-foreground italic">
            This is descriptive, not judgmental. Use it to understand what&apos;s happening, not to judge yourself.
          </p>
        </footer>
      </main>
    </>
  );
}
