import React from 'react';
import Link from 'next/link';
import { getHeatmapData, getRecentSignals } from '@/actions/analytics';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Pencil, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { subDays, format } from 'date-fns';
import { HeatmapChart } from '@/components/features/HeatmapChart';
import type { HeatmapDay } from '@/components/features/HeatmapChart';

export default async function DashboardPage() {
  const endDate = new Date();
  const startDate = subDays(endDate, 365);

  const [heatmapResult, signalsResult] = await Promise.all([
    getHeatmapData(startDate, endDate).catch(() => null),
    getRecentSignals(5).catch(() => null),
  ]);

  const heatmapData = heatmapResult?.data ?? null;
  const recentSignals = signalsResult?.data ?? [];

  // Merge all daily activities across resolutions, taking highest level per day
  const activityMap = new Map<string, 'NONE' | 'PARTIAL' | 'FULL'>();
  if (heatmapData) {
    for (const item of heatmapData) {
      for (const a of item.activities) {
        const dateStr = format(new Date(a.date), 'yyyy-MM-dd');
        const existing = activityMap.get(dateStr);
        const rank = { NONE: 0, PARTIAL: 1, FULL: 2 } as const;
        if (!existing || rank[a.level as keyof typeof rank] > rank[existing]) {
          activityMap.set(dateStr, a.level as 'NONE' | 'PARTIAL' | 'FULL');
        }
      }
    }
  }
  const heatmapDays: HeatmapDay[] = Array.from(activityMap.entries()).map(([date, level]) => ({
    date,
    level,
  }));

  return (
    <>
      <AppHeader />

      <main className="max-w-2xl mx-auto px-6 py-8 pb-10">
        {/* Activity Heatmap Section */}
        <section className="mb-14">
          <div className="flex justify-between items-end mb-3">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Momentum
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span>Quiet</span>
              <div className="flex gap-0.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-primary/[0.08]" />
                <div className="w-2.5 h-2.5 rounded-sm bg-primary/40" />
                <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
              </div>
              <span>Active</span>
            </div>
          </div>
          <Card>
            <CardContent className="p-4">
              <HeatmapChart data={heatmapDays} weeks={20} />
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="flex flex-col items-center mb-16">
          <Button asChild size="lg" className="rounded-full px-8 py-6 text-base shadow-lg gap-3">
            <Link href="/journal">
              <Pencil className="h-5 w-5" />
              Capture a reflection
            </Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground italic">
            Be honest with yourself today.
          </p>
        </section>

        {/* Strategic Signals Section */}
        {recentSignals.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-5">
              Recent Strategic Signals
            </h2>
            <div className="space-y-3">
              {recentSignals.map((signal) => {
                const iconMap = {
                  reframe: <AlertTriangle className="h-4 w-4 text-amber-500" />,
                  risk: <TrendingDown className="h-4 w-4 text-destructive" />,
                  adjustment: <TrendingUp className="h-4 w-4 text-primary" />,
                };
                const badgeMap = {
                  reframe: 'Reframe',
                  risk: 'Risk Flag',
                  adjustment: 'Suggestion',
                };
                const badgeVariant = signal.type === 'risk' ? 'destructive' as const : 'outline' as const;

                return (
                  <Link key={signal.id} href={`/journal/${signal.entryId}`} className="block">
                    <Card className="hover:border-primary/30 transition-colors">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3.5">
                          <div className="mt-0.5 shrink-0">{iconMap[signal.type]}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0">
                                {badgeMap[signal.type]}
                              </Badge>
                              {signal.resolutionName && (
                                <span className="text-[11px] text-muted-foreground truncate">
                                  {signal.resolutionName}
                                </span>
                              )}
                            </div>
                            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                              {signal.text}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
            <div className="mt-6 text-center">
              <Button variant="link" asChild>
                <Link href="/journal">View all reflections</Link>
              </Button>
            </div>
          </section>
        )}
      </main>

      <footer className="max-w-2xl mx-auto px-6 pt-4 pb-6 text-center">
        <Separator className="mb-6" />
        <p className="text-xs text-muted-foreground italic">
          Compass is a space for momentum, not metrics.
        </p>
      </footer>
    </>
  );
}
