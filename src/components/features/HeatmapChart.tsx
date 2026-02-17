'use client';

import React, { useMemo, useState } from 'react';
import { format, subDays, startOfWeek, addDays, differenceInWeeks } from 'date-fns';

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  level: 'NONE' | 'PARTIAL' | 'FULL';
}

export interface HeatmapChartProps {
  data: HeatmapDay[];
  weeks?: number;
}

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

/**
 * GitHub-style contribution heatmap
 *
 * Displays activity as a grid of weeks (columns) x days (rows),
 * with month labels on top and day-of-week labels on the left.
 * Responsive: squares fill available space, labels stay compact.
 */
export function HeatmapChart({ data, weeks = 20 }: HeatmapChartProps) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    const endOfGrid = today;
    const startOfGrid = startOfWeek(subDays(endOfGrid, weeks * 7 - 1), { weekStartsOn: 1 });

    const dataMap = new Map<string, HeatmapDay['level']>();
    for (const d of data) {
      dataMap.set(d.date, d.level);
    }

    const totalWeeks = differenceInWeeks(endOfGrid, startOfGrid) + 1;
    const gridData: { date: Date; level: HeatmapDay['level']; dateStr: string }[][] = [];
    const months: { label: string; colStart: number }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < totalWeeks; w++) {
      const weekStart = addDays(startOfGrid, w * 7);
      const weekData: typeof gridData[number] = [];

      for (let d = 0; d < 7; d++) {
        const cellDate = addDays(weekStart, d);
        const dateStr = format(cellDate, 'yyyy-MM-dd');
        const level = dataMap.get(dateStr) ?? 'NONE';

        if (cellDate <= today) {
          weekData.push({ date: cellDate, level, dateStr });
        } else {
          weekData.push({ date: cellDate, level: 'NONE', dateStr });
        }
      }

      gridData.push(weekData);

      const monthOfWeek = weekStart.getMonth();
      if (monthOfWeek !== lastMonth) {
        months.push({
          label: format(weekStart, 'MMM'),
          colStart: w,
        });
        lastMonth = monthOfWeek;
      }
    }

    return { grid: gridData, monthLabels: months };
  }, [data, weeks]);

  const levelToClass = (level: HeatmapDay['level'], date: Date) => {
    const today = new Date();
    if (date > today) return 'bg-transparent';

    switch (level) {
      case 'FULL':
        return 'bg-primary';
      case 'PARTIAL':
        return 'bg-primary/40';
      default:
        return 'bg-primary/[0.08] dark:bg-primary/[0.06]';
    }
  };

  return (
    <div className="relative w-full overflow-x-auto">
      <div className="inline-flex flex-col gap-0 min-w-0 w-full">
        {/* Month labels */}
        <div className="flex" style={{ paddingLeft: '28px' }}>
          {grid.map((_, weekIdx) => {
            const monthEntry = monthLabels.find((m) => m.colStart === weekIdx);
            return (
              <div
                key={weekIdx}
                className="flex-1 min-w-0 text-[10px] text-muted-foreground leading-none"
                style={{ minWidth: 0 }}
              >
                {monthEntry ? monthEntry.label : ''}
              </div>
            );
          })}
        </div>

        {/* Grid body: day labels + cells */}
        <div className="flex gap-0">
          {/* Day-of-week labels */}
          <div className="flex flex-col justify-between pr-1 shrink-0" style={{ width: '24px' }}>
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="text-[10px] text-muted-foreground leading-none flex items-center justify-end"
                style={{ height: 0, flex: '1 1 0' }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Heatmap squares */}
          <div className="flex gap-[3px] flex-1 min-w-0">
            {grid.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px] flex-1 min-w-0">
                {week.map((cell, dayIdx) => {
                  const isInFuture = cell.date > new Date();
                  return (
                    <div
                      key={dayIdx}
                      className={`aspect-square rounded-sm ${levelToClass(cell.level, cell.date)} ${isInFuture ? 'opacity-0' : 'cursor-pointer'} transition-colors`}
                      onMouseEnter={(e) => {
                        if (isInFuture) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const parentRect = e.currentTarget.closest('.relative')?.getBoundingClientRect();
                        if (!parentRect) return;
                        const levelText = cell.level === 'FULL' ? 'Active' : cell.level === 'PARTIAL' ? 'Partial' : 'No activity';
                        setTooltip({
                          text: `${levelText} on ${format(cell.date, 'MMM d, yyyy')}`,
                          x: rect.left - parentRect.left + rect.width / 2,
                          y: rect.top - parentRect.top - 4,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 px-2 py-1 rounded text-[11px] bg-foreground text-background shadow-lg whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
