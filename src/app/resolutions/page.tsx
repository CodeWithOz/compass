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
  const archivedResult = await getResolutions('ARCHIVED').catch(() => ({ success: false, data: [] }));

  const resolutions = resolutionsResult.data || [];
  const archived = (archivedResult as any).data || [];

  return (
    <>
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-icons text-white text-lg">explore</span>
            </div>
            <span className="text-base font-bold tracking-wide text-slate-800 uppercase">
              Compass
            </span>
          </Link>
          <Link
            href="/resolutions/new"
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <span className="text-lg leading-none">+</span>
            New Resolution
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            My Resolutions
          </h1>
          <p className="text-slate-500">
            A space for honest reflection and steady momentum.
          </p>
        </header>

        {/* Active Resolutions */}
        {resolutions.length > 0 ? (
          <div className="space-y-4">
            {resolutions.map((resolution) => (
              <Link key={resolution.id} href={`/resolutions/${resolution.id}`}>
                <div className="bg-white border border-slate-200/80 p-6 rounded-xl hover:border-primary/40 transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-lg font-semibold text-slate-800">
                      {resolution.name}
                    </h2>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                        resolution.type === 'MEASURABLE_OUTCOME'
                          ? 'border-primary/30 text-primary bg-primary/5'
                          : resolution.type === 'EXPLORATORY_TRACK'
                            ? 'border-primary/30 text-primary bg-primary/5'
                            : 'border-slate-300 text-slate-500 bg-slate-50'
                      }`}
                    >
                      {resolution.type === 'HABIT_BUNDLE' && 'Habit'}
                      {resolution.type === 'MEASURABLE_OUTCOME' && 'Outcome'}
                      {resolution.type === 'EXPLORATORY_TRACK' && 'Exploration'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-5 text-sm text-slate-500">
                    {resolution.currentPhase && (
                      <div className="flex items-center gap-1.5">
                        <span className="material-icons text-base text-slate-400">layers</span>
                        <span className="font-medium text-slate-600">Phase:</span>
                        <span>{resolution.currentPhase.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="material-icons text-base text-slate-400">schedule</span>
                      <span className="font-medium text-slate-600">Last activity:</span>
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
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                Exited Resolutions
              </h3>
              <div className="h-px bg-slate-200 flex-grow" />
            </div>
            <div className="space-y-4">
              {archived.map((resolution: any) => (
                <Link key={resolution.id} href={`/resolutions/${resolution.id}`}>
                  <div className="bg-white/60 border border-dashed border-slate-300 p-6 rounded-xl opacity-75 hover:opacity-100 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-lg font-medium text-slate-500">
                        {resolution.name}
                      </h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 border border-slate-300 text-slate-400 rounded uppercase tracking-wider">
                        Exited
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-5 text-sm text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="material-icons text-base opacity-50">layers</span>
                        <span className="font-medium">Type:</span>
                        <span>
                          {resolution.type === 'HABIT_BUNDLE' && 'Habit'}
                          {resolution.type === 'MEASURABLE_OUTCOME' && 'Outcome'}
                          {resolution.type === 'EXPLORATORY_TRACK' && 'Exploration'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-icons text-base opacity-50">event</span>
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
        <footer className="mt-24 text-center border-t border-slate-200/60 pt-10 pb-20">
          <p className="text-slate-400 text-sm italic">&quot;Direction is more important than speed.&quot;</p>
          <div className="flex justify-center gap-2 mt-6">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          </div>
        </footer>
      </main>
    </>
  );
}
