import React from 'react';
import Link from 'next/link';
import { getResolutions } from '@/actions/resolutions';
import { getActiveReframes } from '@/actions/reframes';
import { getHeatmapData } from '@/actions/analytics';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Pencil } from 'lucide-react';
import { subDays } from 'date-fns';

export default async function DashboardPage() {
  const endDate = new Date();
  const startDate = subDays(endDate, 365);

  const [resolutionsResult, reframesResult, heatmapResult] = await Promise.all([
    getResolutions('ACTIVE'),
    getActiveReframes().catch(() => null),
    getHeatmapData(startDate, endDate).catch(() => null),
  ]);

  const resolutions = resolutionsResult.data ?? [];
  const reframesByResolution = reframesResult?.data ?? null;
  const heatmapData = heatmapResult?.data ?? null;

  const allReframes = reframesByResolution
    ? Object.entries(reframesByResolution).flatMap(([resId, reframes]) =>
        reframes.map((reframe) => ({
          ...reframe,
          resolutionName:
            resolutions.find((r) => r.id === resId)?.name || 'Unknown Resolution',
        }))
      )
    : [];

  const allActivities = heatmapData
    ? heatmapData.flatMap((item) =>
        item.activities.map((a) => ({
          date: new Date(a.date),
          level: a.level,
        }))
      )
    : [];

  return (
    <>
      <AppHeader />

      <main className="max-w-2xl mx-auto px-6 py-8 pb-24">
        {/* Activity Heatmap Section */}
        <section className="mb-14">
          <div className="flex justify-between items-end mb-3">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Momentum
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
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
          <Card>
            <CardContent className="p-5">
              <div className="heatmap-grid">
                {Array.from({ length: 80 }).map((_, i) => {
                  const date = subDays(endDate, 79 - i);
                  const activity = allActivities.find(
                    (a) => a.date.toDateString() === date.toDateString()
                  );

                  let level = 'bg-primary/[0.08]';
                  if (activity) {
                    if (activity.level === 'FULL') level = 'bg-primary';
                    else if (activity.level === 'PARTIAL') level = 'bg-primary/40';
                    else level = 'bg-primary/[0.12]';
                  }

                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-sm ${level}`}
                    />
                  );
                })}
              </div>
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
        {allReframes.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-5">
              Recent Strategic Signals
            </h2>
            <div className="space-y-3">
              {allReframes.slice(0, 3).map((reframe) => (
                <Card key={reframe.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3.5">
                      <div className="mt-2 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                      <div>
                        <p className="text-[15px] leading-relaxed text-muted-foreground">
                          {reframe.reason || reframe.suggestion}
                        </p>
                        <span className="block mt-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                          {reframe.resolutionName}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button variant="link" asChild>
                <Link href="/resolutions">View all observations</Link>
              </Button>
            </div>
          </section>
        )}
      </main>

      <footer className="max-w-2xl mx-auto px-6 py-10 text-center">
        <Separator className="mb-10" />
        <p className="text-xs text-muted-foreground italic">
          Compass is a space for momentum, not metrics.
        </p>
      </footer>
    </>
  );
}
