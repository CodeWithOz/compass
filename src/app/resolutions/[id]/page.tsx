import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getResolution } from '@/actions/resolutions';
import { getDailyActivity } from '@/actions/analytics';
import { getJournalEntries } from '@/actions/journal';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Zap } from 'lucide-react';
import { ArchiveResolutionButton } from './ArchiveResolutionButton';
import { subDays } from 'date-fns';

export default async function ResolutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resolutionResult = await getResolution(id);

  if (!resolutionResult.success || !resolutionResult.data) {
    notFound();
  }

  const resolution = resolutionResult.data;

  const endDate = new Date();
  const startDate = subDays(endDate, 180);

  const [activityResult, entriesResult] = await Promise.all([
    getDailyActivity(startDate, endDate, id).catch(() => null),
    getJournalEntries({ resolutionId: id, limit: 10 }).catch(() => null),
  ]);

  const activities = activityResult?.data ?? [];
  const recentEntries = entriesResult?.data ?? [];

  return (
    <>
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-10">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/resolutions">
              <ArrowLeft className="h-4 w-4" />
              Overview
            </Link>
          </Button>
          {resolution.status === 'ACTIVE' ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active Reflection
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Archived
              </span>
            </div>
          )}
        </div>

        {/* Title & Purpose */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-3">{resolution.name}</h1>
          {resolution.purpose && (
            <p className="text-lg text-muted-foreground leading-relaxed">{resolution.purpose}</p>
          )}
        </div>

        {/* Constraint Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {resolution.constraints && (
            <Card>
              <CardContent className="p-4">
                <p className="text-[10px] font-medium text-primary/70 uppercase tracking-wider mb-1.5">
                  Constraints
                </p>
                <p className="text-sm font-medium">{resolution.constraints}</p>
              </CardContent>
            </Card>
          )}
          {resolution.currentPhase && (
            <Card>
              <CardContent className="p-4">
                <p className="text-[10px] font-medium text-primary/70 uppercase tracking-wider mb-1.5">
                  Current Phase
                </p>
                <p className="text-sm font-medium">{resolution.currentPhase.name}</p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="p-4">
                <p className="text-[10px] font-medium text-primary/70 uppercase tracking-wider mb-1.5">
                  Type
                </p>
              <p className="text-sm font-medium">
                {resolution.type === 'HABIT_BUNDLE' && 'Habit Bundle'}
                {resolution.type === 'MEASURABLE_OUTCOME' && 'Measurable Outcome'}
                {resolution.type === 'EXPLORATORY_TRACK' && 'Exploratory Track'}
              </p>
            </CardContent>
          </Card>
          {resolution.type === 'MEASURABLE_OUTCOME' && resolution.targetDate && (
            <Card>
              <CardContent className="p-4">
                <p className="text-[10px] font-medium text-primary/70 uppercase tracking-wider mb-1.5">
                  Target Date
                </p>
                <p className="text-sm font-medium">
                  {new Date(resolution.targetDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Engagement Momentum Heatmap */}
        <section className="mb-12">
          <div className="flex justify-between items-end mb-3">
            <h2 className="text-lg font-bold tracking-tight">Engagement Momentum</h2>
            <span className="text-xs text-muted-foreground">Past 6 Months</span>
          </div>
          <Card>
            <CardContent className="p-5">
              <div className="heatmap-grid">
                {Array.from({ length: 60 }).map((_, i) => {
                  const date = subDays(endDate, 59 - i);
                  const activity = activities.find(
                    (a) => new Date(a.date).toDateString() === date.toDateString()
                  );

                  let level = 'bg-primary/[0.08]';
                  if (activity) {
                    if (activity.activityLevel === 'FULL') level = 'bg-primary';
                    else if (activity.activityLevel === 'PARTIAL') level = 'bg-primary/40';
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
              <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground uppercase tracking-wider">
                <span>Less Active</span>
                <div className="flex gap-0.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-primary/10" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-primary/30" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-primary/60" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                </div>
                <span>Deep Work</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Observed Patterns */}
        {recentEntries.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold tracking-tight">Observed Patterns</h2>
            </div>
            <div className="space-y-3">
              {recentEntries.slice(0, 3).map((entry) => (
                <Link
                  key={entry.id}
                  href={`/journal/${entry.id}`}
                  className="block"
                >
                  <Card className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">
                            {new Date(entry.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {entry.rawText}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Footer Controls */}
        <Separator className="mb-6 mt-12" />
        <footer className="flex items-center justify-between">
          {resolution.status === 'ACTIVE' && (
            <>
              <ArchiveResolutionButton
                resolutionId={id}
                label={resolution.type === 'EXPLORATORY_TRACK' ? 'Exit' : 'Archive Resolution'}
              />
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/resolutions/${id}/edit`}>Edit Detail</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/resolutions">Exit View</Link>
                </Button>
              </div>
            </>
          )}
          {resolution.status === 'ARCHIVED' && (
            <Button asChild>
              <Link href="/resolutions">Back to Resolutions</Link>
            </Button>
          )}
        </footer>
      </main>
    </>
  );
}
