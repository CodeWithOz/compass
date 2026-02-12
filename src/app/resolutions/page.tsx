import React from 'react';
import Link from 'next/link';
import { getResolutions } from '@/actions/resolutions';
import type { ResolutionStatus } from '@prisma/client';

export default async function ResolutionsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = (searchParams.status as ResolutionStatus) || 'ACTIVE';
  const resolutionsResult = await getResolutions(status);
  const archivedResult = await getResolutions('ARCHIVED');

  const resolutions = resolutionsResult.data || [];
  const archived = archivedResult.data || [];

  return (
    <>
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="material-icons text-primary text-3xl">explore</span>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                Compass
              </span>
            </Link>
          </div>
          <Link
            href="/resolutions/new"
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <span className="material-icons text-sm">add</span>
            New Resolution
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            My Resolutions
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            A space for honest reflection and steady momentum.
          </p>
        </header>

        {/* Active Resolutions */}
        {resolutions.length > 0 ? (
          <div className="space-y-4">
            {resolutions.map((resolution) => (
              <Link key={resolution.id} href={`/resolutions/${resolution.id}`}>
                <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl hover:border-primary/50 dark:hover:border-primary/50 transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                      {resolution.name}
                    </h2>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        resolution.type === 'MEASURABLE_OUTCOME'
                          ? 'bg-primary/10 text-primary'
                          : resolution.type === 'EXPLORATORY_TRACK'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {resolution.type === 'HABIT_BUNDLE' && 'Habit'}
                      {resolution.type === 'MEASURABLE_OUTCOME' && 'Outcome'}
                      {resolution.type === 'EXPLORATORY_TRACK' && 'Exploration'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                    {resolution.currentPhase && (
                      <div className="flex items-center gap-1.5">
                        <span className="material-icons text-lg opacity-60">layers</span>
                        <span className="font-medium">Phase:</span>
                        <span>{resolution.currentPhase.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="material-icons text-lg opacity-60">history</span>
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
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-500 mb-4">No active resolutions yet.</p>
            <Link
              href="/resolutions/new"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Create your first resolution
            </Link>
          </div>
        )}

        {/* Exited Section */}
        {archived.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                Exited Resolutions
              </h3>
              <div className="h-px bg-slate-200 dark:border-slate-800 flex-grow"></div>
            </div>
            <div className="space-y-4">
              {archived.map((resolution) => (
                <Link key={resolution.id} href={`/resolutions/${resolution.id}`}>
                  <div className="bg-white/60 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 p-6 rounded-xl opacity-75 grayscale hover:grayscale-0 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-medium text-slate-600 dark:text-slate-400">
                        {resolution.name}
                      </h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 border border-slate-300 dark:border-slate-700 text-slate-400 rounded uppercase tracking-tighter">
                        Exited
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 dark:text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="material-icons text-lg opacity-40">layers</span>
                        <span className="font-medium">Type:</span>
                        <span>
                          {resolution.type === 'HABIT_BUNDLE' && 'Habit'}
                          {resolution.type === 'MEASURABLE_OUTCOME' && 'Outcome'}
                          {resolution.type === 'EXPLORATORY_TRACK' && 'Exploration'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-icons text-lg opacity-40">event</span>
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
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-24 text-center border-t border-slate-200 dark:border-slate-800 pt-10 pb-20">
          <p className="text-slate-400 text-sm italic">"Direction is more important than speed."</p>
          <div className="flex justify-center gap-4 mt-6 grayscale opacity-30">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
          </div>
        </footer>
      </main>
    </>
  );
}
