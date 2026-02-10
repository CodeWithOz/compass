'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { Resolution, ResolutionPhase } from '@prisma/client';

export interface ResolutionCardProps {
  resolution: Resolution & {
    currentPhase?: ResolutionPhase | null;
  };
  onClick?: () => void;
}

/**
 * Resolution Card Component
 *
 * Type-aware display with different information based on resolution type:
 * - HABIT_BUNDLE: Focus on consistency and rhythm
 * - MEASURABLE_OUTCOME: Show target date and progress indicators
 * - EXPLORATORY_TRACK: Emphasize exit criteria and presence
 *
 * Read-only projection from database - no client-side logic
 */
export function ResolutionCard({ resolution, onClick }: ResolutionCardProps) {
  const typeColors = {
    HABIT_BUNDLE: 'bg-blue-100 text-blue-800 border-blue-200',
    MEASURABLE_OUTCOME: 'bg-green-100 text-green-800 border-green-200',
    EXPLORATORY_TRACK: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  const typeLabels = {
    HABIT_BUNDLE: 'Habit Bundle',
    MEASURABLE_OUTCOME: 'Measurable Outcome',
    EXPLORATORY_TRACK: 'Exploratory Track',
  };

  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
    ARCHIVED: 'bg-gray-100 text-gray-800',
  };

  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-shadow ${onClick ? '' : 'cursor-default'}`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>{resolution.name}</CardTitle>
            <div className="flex gap-2 mt-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  typeColors[resolution.type]
                }`}
              >
                {typeLabels[resolution.type]}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  statusColors[resolution.status]
                }`}
              >
                {resolution.status}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {resolution.purpose && (
          <div>
            <p className="text-sm font-medium text-gray-700">Purpose</p>
            <p className="text-sm text-gray-600 mt-1">{resolution.purpose}</p>
          </div>
        )}

        {resolution.currentPhase && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm font-medium text-blue-900">Current Phase</p>
            <p className="text-sm text-blue-800 mt-1">{resolution.currentPhase.name}</p>
            {resolution.currentPhase.expectedFrequency && (
              <p className="text-xs text-blue-700 mt-1">
                Expected: {resolution.currentPhase.expectedFrequency}
                {resolution.currentPhase.intensityLevel && ` • Intensity: ${resolution.currentPhase.intensityLevel}/5`}
              </p>
            )}
          </div>
        )}

        {/* Type-specific information */}
        {resolution.type === 'MEASURABLE_OUTCOME' && resolution.targetDate && (
          <div>
            <p className="text-sm font-medium text-gray-700">Target Date</p>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(resolution.targetDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}

        {resolution.type === 'EXPLORATORY_TRACK' && resolution.exitCriteria && (
          <div>
            <p className="text-sm font-medium text-gray-700">Exit Criteria</p>
            <p className="text-sm text-gray-600 mt-1">{resolution.exitCriteria}</p>
          </div>
        )}

        {resolution.successSignals && (
          <div>
            <p className="text-sm font-medium text-gray-700">Success Signals</p>
            <p className="text-sm text-gray-600 mt-1">{resolution.successSignals}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
