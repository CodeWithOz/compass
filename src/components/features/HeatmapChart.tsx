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
    <div className="overflow-x-auto">
      <HeatMap
        value={heatmapValue}
        startDate={start}
        endDate={end}
        width="100%"
        style={{ color: '#737373' }}
        panelColors={{
          0: '#fafafa', // NONE - neutral-50
          1: '#e5e5e5', // PARTIAL - neutral-200
          2: '#737373', // FULL - neutral-500
        }}
        legendCellSize={0}
        rectSize={12}
        space={3}
        rectProps={{
          rx: 2,
        }}
      />
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
