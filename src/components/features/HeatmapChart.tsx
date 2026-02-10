'use client';

import React from 'react';
import HeatMap from '@uiw/react-heat-map';
import type { ActivityLevel } from '@prisma/client';

export interface HeatmapData {
  date: Date;
  level: ActivityLevel;
}

export interface HeatmapChartProps {
  data: HeatmapData[];
  resolutionName?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Heatmap Chart Component
 *
 * GitHub-style activity visualization
 *
 * CRITICAL PRINCIPLES:
 * - Read-only projection: Receives pre-aggregated data from server
 * - No client-side calculation: All activity levels computed in SQL
 * - Phase-aware: Visual indicators for phase boundaries (future enhancement)
 * - Shows rhythm and continuity, not success/failure
 */
export function HeatmapChart({
  data,
  resolutionName,
  startDate,
  endDate,
}: HeatmapChartProps) {
  // Convert to format expected by @uiw/react-heat-map
  const heatmapValue = data.map((item) => ({
    date: item.date.toISOString().split('T')[0],
    count: activityLevelToCount(item.level),
  }));

  // Set date range (default to last 365 days if not specified)
  const end = endDate || new Date();
  const start = startDate || new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-2">
      {resolutionName && (
        <h3 className="text-sm font-medium text-gray-700">{resolutionName}</h3>
      )}

      <div className="overflow-x-auto">
        <HeatMap
          value={heatmapValue}
          startDate={start}
          endDate={end}
          width="100%"
          style={{ color: '#374151' }}
          panelColors={{
            0: '#f3f4f6', // NONE - gray-100
            1: '#dbeafe', // PARTIAL - blue-100
            2: '#3b82f6', // FULL - blue-500
          }}
          legendCellSize={12}
          rectSize={14}
          space={4}
          rectProps={{
            rx: 2,
          }}
        />
      </div>

      <div className="flex items-center justify-end gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded-sm" />
            <div className="w-3 h-3 bg-blue-100 border border-gray-300 rounded-sm" />
            <div className="w-3 h-3 bg-blue-500 border border-gray-300 rounded-sm" />
          </div>
          <span>More</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 italic">
        This shows your engagement pattern over time. Presence and rhythm matter more than
        perfection.
      </p>
    </div>
  );
}

/**
 * Convert ActivityLevel enum to numeric count for heatmap
 */
function activityLevelToCount(level: ActivityLevel): number {
  switch (level) {
    case 'NONE':
      return 0;
    case 'PARTIAL':
      return 1;
    case 'FULL':
      return 2;
    default:
      return 0;
  }
}
