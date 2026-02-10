'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { WeeklySummary, Resolution, ResolutionPhase } from '@prisma/client';

export interface WeeklySummaryCardProps {
  summary: WeeklySummary & {
    resolution: Resolution & {
      currentPhase?: ResolutionPhase | null;
    };
  };
}

/**
 * Weekly Summary Card Component
 *
 * Read-only projection displaying weekly insights
 * - Phase-aware context in summary
 * - Engagement score and momentum trend
 * - Descriptive, not judgmental language
 */
export function WeeklySummaryCard({ summary }: WeeklySummaryCardProps) {
  const trendColors = {
    DECLINING: 'bg-red-100 text-red-800 border-red-200',
    STABLE: 'bg-blue-100 text-blue-800 border-blue-200',
    GROWING: 'bg-green-100 text-green-800 border-green-200',
  };

  const trendIcons = {
    DECLINING: '📉',
    STABLE: '➡️',
    GROWING: '📈',
  };

  const weekStart = new Date(summary.weekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{summary.resolution.name}</CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Week of {weekStart.toLocaleDateString()} - {weekEnd.toLocaleDateString()}
            </p>
          </div>
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
              trendColors[summary.momentumTrend]
            }`}
          >
            <span>{trendIcons[summary.momentumTrend]}</span>
            <span>{summary.momentumTrend}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Engagement score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Engagement Pattern</p>
            <span className="text-sm font-semibold text-gray-900">{summary.engagementScore}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                summary.engagementScore >= 70
                  ? 'bg-green-500'
                  : summary.engagementScore >= 40
                    ? 'bg-blue-500'
                    : 'bg-yellow-500'
              }`}
              style={{ width: `${summary.engagementScore}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This shows presence and continuity, not perfection
          </p>
        </div>

        {/* Phase context if applicable */}
        {summary.resolution.currentPhase && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
            <p className="text-xs font-medium text-blue-900">
              Phase: {summary.resolution.currentPhase.name}
            </p>
            {summary.resolution.currentPhase.expectedFrequency && (
              <p className="text-xs text-blue-700 mt-0.5">
                Expected: {summary.resolution.currentPhase.expectedFrequency}
              </p>
            )}
          </div>
        )}

        {/* Summary text */}
        {summary.summaryText && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <p className="text-sm text-gray-700">{summary.summaryText}</p>
          </div>
        )}

        <p className="text-xs text-gray-400 italic">
          What has been happening this week? (Not "how well are you doing?")
        </p>
      </CardContent>
    </Card>
  );
}
