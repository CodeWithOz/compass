'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Resolution, ResolutionPhase } from '@prisma/client';

export interface ResolutionCardProps {
  resolution: Resolution & {
    currentPhase?: ResolutionPhase | null;
  };
  onClick?: () => void;
}

export function ResolutionCard({ resolution, onClick }: ResolutionCardProps) {
  const typeLabels = {
    HABIT_BUNDLE: 'Habit Bundle',
    MEASURABLE_OUTCOME: 'Measurable Outcome',
    EXPLORATORY_TRACK: 'Exploratory Track',
  };

  const statusVariants = {
    ACTIVE: 'default' as const,
    PAUSED: 'secondary' as const,
    ARCHIVED: 'outline' as const,
  };

  return (
    <Card
      className={`transition-shadow ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold leading-none tracking-tight">
              {resolution.name}
            </h3>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">
                {typeLabels[resolution.type]}
              </Badge>
              <Badge variant={statusVariants[resolution.status]}>
                {resolution.status}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {resolution.purpose && (
          <div>
            <p className="text-sm font-medium">Purpose</p>
            <p className="text-sm text-muted-foreground mt-1">{resolution.purpose}</p>
          </div>
        )}

        {resolution.currentPhase && (
          <div className="rounded-md border bg-accent/50 p-3">
            <p className="text-sm font-medium">Current Phase</p>
            <p className="text-sm text-muted-foreground mt-1">{resolution.currentPhase.name}</p>
            {resolution.currentPhase.expectedFrequency && (
              <p className="text-xs text-muted-foreground mt-1">
                Expected: {resolution.currentPhase.expectedFrequency}
                {resolution.currentPhase.intensityLevel && ` • Intensity: ${resolution.currentPhase.intensityLevel}/5`}
              </p>
            )}
          </div>
        )}

        {resolution.type === 'MEASURABLE_OUTCOME' && resolution.targetDate && (
          <div>
            <p className="text-sm font-medium">Target Date</p>
            <p className="text-sm text-muted-foreground mt-1">
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
            <p className="text-sm font-medium">Exit Criteria</p>
            <p className="text-sm text-muted-foreground mt-1">{resolution.exitCriteria}</p>
          </div>
        )}

        {resolution.successSignals && (
          <div>
            <p className="text-sm font-medium">Success Signals</p>
            <p className="text-sm text-muted-foreground mt-1">{resolution.successSignals}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
