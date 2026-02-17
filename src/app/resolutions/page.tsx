import React from 'react';
import Link from 'next/link';
import { getResolutions } from '@/actions/resolutions';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Layers, Clock, Calendar } from 'lucide-react';
import type { ResolutionStatus } from '@prisma/client';

export default async function ResolutionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const validStatuses: ResolutionStatus[] = ['ACTIVE', 'PAUSED', 'ARCHIVED'];
  const status: ResolutionStatus = validStatuses.includes(statusParam as ResolutionStatus)
    ? (statusParam as ResolutionStatus)
    : 'ACTIVE';
  const [resolutionsResult, archivedResult] = await Promise.all([
    getResolutions(status).catch(() => null),
    getResolutions('ARCHIVED').catch(() => null),
  ]);

  const resolutions = resolutionsResult?.data ?? [];
  const archived = archivedResult?.data ?? [];

  return (
    <>
      <AppHeader />

      <main className="max-w-3xl mx-auto px-6 py-10 pb-10">
        <header className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              My Resolutions
            </h1>
            <p className="text-muted-foreground">
              A space for honest reflection and steady momentum.
            </p>
          </div>
          <Button asChild>
            <Link href="/resolutions/new">
              <Plus className="h-4 w-4" />
              New Resolution
            </Link>
          </Button>
        </header>

        {/* Active Resolutions */}
        {resolutions.length > 0 ? (
          <div className="space-y-4">
            {resolutions.map((resolution) => (
              <Link key={resolution.id} href={`/resolutions/${resolution.id}`} className="block">
                <Card className="hover:border-primary/40 transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-lg font-semibold">
                        {resolution.name}
                      </h2>
                      <Badge
                        variant="outline"
                        className={
                          resolution.type === 'HABIT_BUNDLE'
                            ? 'border-border text-muted-foreground bg-secondary'
                            : 'border-primary/30 text-primary bg-primary/5'
                        }
                      >
                        {resolution.type === 'HABIT_BUNDLE' && 'Habit'}
                        {resolution.type === 'MEASURABLE_OUTCOME' && 'Outcome'}
                        {resolution.type === 'EXPLORATORY_TRACK' && 'Exploration'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
                      {resolution.currentPhase && (
                        <div className="flex items-center gap-1.5">
                          <Layers className="h-4 w-4" />
                          <span className="font-medium">Phase:</span>
                          <span>{resolution.currentPhase.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Last activity:</span>
                        <span>
                          {resolution.updatedAt
                            ? new Date(resolution.updatedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Never'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-20">
              <p className="text-muted-foreground mb-4">No active resolutions yet.</p>
              <Button variant="link" asChild>
                <Link href="/resolutions/new">Create your first resolution</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Exited Section */}
        {archived.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                Exited Resolutions
              </h3>
              <Separator className="flex-grow" />
            </div>
            <div className="space-y-4">
              {archived.map((resolution) => (
                <Link key={resolution.id} href={`/resolutions/${resolution.id}`} className="block">
                  <Card className="border-dashed opacity-75 hover:opacity-100 transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h2 className="text-lg font-medium text-muted-foreground">
                          {resolution.name}
                        </h2>
                        <Badge variant="outline">Exited</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Layers className="h-4 w-4 opacity-50" />
                          <span className="font-medium">Type:</span>
                          <span>
                            {resolution.type === 'HABIT_BUNDLE' && 'Habit'}
                            {resolution.type === 'MEASURABLE_OUTCOME' && 'Outcome'}
                            {resolution.type === 'EXPLORATORY_TRACK' && 'Exploration'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 opacity-50" />
                          <span className="font-medium">Exited:</span>
                          <span>
                            {resolution.updatedAt
                              ? new Date(resolution.updatedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center pt-6 pb-2">
          <Separator className="mb-6" />
          <p className="text-muted-foreground text-sm italic">&quot;Direction is more important than speed.&quot;</p>
        </footer>
      </main>
    </>
  );
}
