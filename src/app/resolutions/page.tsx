import React from 'react';
import Link from 'next/link';
import { getResolutions } from '@/actions/resolutions';
import type { ResolutionStatus } from '@prisma/client';

/**
 * Resolutions Overview
 *
 * Primary question: What am I currently oriented toward?
 *
 * Layout: Flat list of resolution cards
 * Each shows: Name, Type, Phase, Last activity
 */
export default async function ResolutionsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = (searchParams.status as ResolutionStatus) || 'ACTIVE';
  const resolutionsResult = await getResolutions(status);
  const resolutions = resolutionsResult.data || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium text-neutral-900 mb-4">Resolutions</h1>

        {/* Status Filter */}
        <div className="flex gap-3 text-sm">
          <Link
            href="/resolutions?status=ACTIVE"
            className={
              status === 'ACTIVE'
                ? 'text-neutral-900 font-medium border-b-2 border-neutral-900 pb-1'
                : 'text-neutral-500 hover:text-neutral-900 pb-1'
            }
          >
            Active
          </Link>
          <Link
            href="/resolutions?status=PAUSED"
            className={
              status === 'PAUSED'
                ? 'text-neutral-900 font-medium border-b-2 border-neutral-900 pb-1'
                : 'text-neutral-500 hover:text-neutral-900 pb-1'
            }
          >
            Paused
          </Link>
          <Link
            href="/resolutions?status=ARCHIVED"
            className={
              status === 'ARCHIVED'
                ? 'text-neutral-900 font-medium border-b-2 border-neutral-900 pb-1'
                : 'text-neutral-500 hover:text-neutral-900 pb-1'
            }
          >
            Archived
          </Link>
        </div>
      </div>

      {/* Resolution List */}
      {resolutions.length === 0 ? (
        <div className="border border-neutral-200 rounded-md bg-white p-12 text-center">
          <p className="text-neutral-500 mb-4">
            No {status.toLowerCase()} resolutions
          </p>
          {status === 'ACTIVE' && (
            <Link
              href="/resolutions/new"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Create a resolution
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {resolutions.map((resolution) => (
            <Link
              key={resolution.id}
              href={`/resolutions/${resolution.id}`}
              className="block border border-neutral-200 rounded-md bg-white p-4 hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-medium text-neutral-900 mb-1">
                    {resolution.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <span>
                      {resolution.type === 'HABIT_BUNDLE' && 'Habit bundle'}
                      {resolution.type === 'MEASURABLE_OUTCOME' && 'Measurable outcome'}
                      {resolution.type === 'EXPLORATORY_TRACK' && 'Exploratory track'}
                    </span>
                    {resolution.currentPhase && (
                      <>
                        <span>•</span>
                        <span>{resolution.currentPhase.name}</span>
                      </>
                    )}
                  </div>
                  {resolution.status === 'ARCHIVED' && resolution.exitNote && (
                    <p className="text-sm text-neutral-500 mt-2 italic">
                      {resolution.exitNote}
                    </p>
                  )}
                </div>
                <div className="text-xs text-neutral-400 ml-4">
                  {resolution.updatedAt && (
                    <time>
                      {new Date(resolution.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
