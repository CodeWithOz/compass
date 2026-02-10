import React from 'react';
import Link from 'next/link';
import { getResolutions } from '@/actions/resolutions';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ResolutionCard } from '@/components/features/ResolutionCard';
import type { ResolutionStatus } from '@prisma/client';

/**
 * Resolutions List Page
 *
 * List all resolutions grouped by type and status
 * - Create/edit/archive resolution functionality
 * - Resolution type selection (HABIT_BUNDLE, MEASURABLE_OUTCOME, EXPLORATORY_TRACK)
 * - Type-specific forms
 */
export default async function ResolutionsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = (searchParams.status as ResolutionStatus) || 'ACTIVE';
  const resolutionsResult = await getResolutions(status);
  const resolutions = resolutionsResult.data || [];

  // Group by resolution type
  const grouped = resolutions.reduce(
    (acc, resolution) => {
      if (!acc[resolution.type]) {
        acc[resolution.type] = [];
      }
      acc[resolution.type].push(resolution);
      return acc;
    },
    {} as Record<string, typeof resolutions>
  );

  const typeLabels = {
    HABIT_BUNDLE: {
      title: 'Habit Bundles',
      description: 'Recurring systems evaluated on consistency over time',
      icon: '🔄',
    },
    MEASURABLE_OUTCOME: {
      title: 'Measurable Outcomes',
      description: 'Time-bound goals evaluated on progress toward targets',
      icon: '🎯',
    },
    EXPLORATORY_TRACK: {
      title: 'Exploratory Tracks',
      description: 'Open-ended exploration evaluated on presence, not output',
      icon: '🧭',
    },
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Resolutions</h1>
            <p className="text-gray-600">Your active commitments and explorations</p>
          </div>
          <Link href="/resolutions/new">
            <Button>+ New Resolution</Button>
          </Link>
        </div>

        {/* Status filter */}
        <div className="flex gap-2">
          <Link href="/resolutions?status=ACTIVE">
            <Button variant={status === 'ACTIVE' ? 'primary' : 'ghost'} size="sm">
              Active
            </Button>
          </Link>
          <Link href="/resolutions?status=PAUSED">
            <Button variant={status === 'PAUSED' ? 'primary' : 'ghost'} size="sm">
              Paused
            </Button>
          </Link>
          <Link href="/resolutions?status=ARCHIVED">
            <Button variant={status === 'ARCHIVED' ? 'primary' : 'ghost'} size="sm">
              Archived
            </Button>
          </Link>
        </div>
      </div>

      {/* Resolutions grouped by type */}
      {resolutions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No {status.toLowerCase()} resolutions found</p>
            {status === 'ACTIVE' && (
              <Link href="/resolutions/new">
                <Button>Create Your First Resolution</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(typeLabels).map(([type, config]) => {
            const resolutionsOfType = grouped[type] || [];
            if (resolutionsOfType.length === 0) return null;

            return (
              <div key={type}>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <span>{config.icon}</span>
                    <span>{config.title}</span>
                    <span className="text-sm font-normal text-gray-500">
                      ({resolutionsOfType.length})
                    </span>
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resolutionsOfType.map((resolution) => (
                    <Link key={resolution.id} href={`/resolutions/${resolution.id}`}>
                      <ResolutionCard resolution={resolution} />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Helper text */}
      <div className="mt-12 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900 font-medium mb-2">💡 About Resolution Types</p>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            <strong>Habit Bundles:</strong> Focus on rhythm and consistency, not perfection
          </li>
          <li>
            <strong>Measurable Outcomes:</strong> Track progress toward specific goals with
            deadlines
          </li>
          <li>
            <strong>Exploratory Tracks:</strong> Value presence and curiosity, exit is a feature
          </li>
        </ul>
      </div>
    </div>
  );
}
