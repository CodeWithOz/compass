'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { WeeklySummary, Resolution, ResolutionPhase } from '@prisma/client';

export interface WeeklySummaryCardProps {
  summary: WeeklySummary & {
    resolution: Resolution & {
      currentPhase?: ResolutionPhase | null;
    };
  };
}

export function WeeklySummaryCard({ summary }: WeeklySummaryCardProps) {
  const trendConfig = {
    DECLINING: { label: 'Declining', variant: 'destructive' as const, icon: '📉' },
    STABLE: { label: 'Stable', variant: 'secondary' as const, icon: '➡️' },
    GROWING: { label: 'Growing', variant: 'default' as const, icon: '📈' },
  };

  const weekStart = new Date(summary.weekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const trend = trendConfig[summary.momentumTrend];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold leading-none tracking-tight text-base">
              {summary.resolution.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5">
              Week of {weekStart.toLocaleDateString()} - {weekEnd.toLocaleDateString()}
            </p>
          </div>
          <Badge variant={trend.variant} className="gap-1">
            <span>{trend.icon}</span>
            {trend.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Engagement score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Engagement Pattern</p>
            <span className="text-sm font-semibold">{summary.engagementScore}/100</span>
          </div>
          <Progress value={summary.engagementScore} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1.5">
            This shows presence and continuity, not perfection
          </p>
        </div>

        {/* Phase context */}
        {summary.resolution.currentPhase && (
          <div className="rounded-md border bg-accent/50 p-3">
            <p className="text-xs font-medium">
              Phase: {summary.resolution.currentPhase.name}
            </p>
            {summary.resolution.currentPhase.expectedFrequency && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Expected: {summary.resolution.currentPhase.expectedFrequency}
              </p>
            )}
          </div>
        )}

        {/* Summary text */}
        {summary.summaryText && (
          <div className="rounded-md border bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">{summary.summaryText}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground italic">
          What has been happening this week? (Not &quot;how well are you doing?&quot;)
        </p>
      </CardContent>
    </Card>
  );
}
