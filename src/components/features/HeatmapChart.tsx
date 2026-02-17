'use client';

import React, { useMemo, useState, useCallback, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { format, subDays, startOfWeek, addDays, differenceInWeeks } from 'date-fns';

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface HeatmapChartProps {
  data: HeatmapDay[];
  weeks?: number;
}

const CELL_SIZE = 10;
const CELL_GAP = 3;
const LABEL_WIDTH = 28;
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function levelClass(count: number, isFuture: boolean): string {
  if (isFuture) return 'bg-transparent';
  if (count === 0) return 'bg-primary/[0.08] dark:bg-primary/[0.06]';
  if (count <= 3) return 'bg-primary/40';
  return 'bg-primary';
}

function levelText(count: number): string {
  if (count === 0) return 'No activity';
  if (count === 1) return '1 entry';
  return `${count} entries`;
}

/**
 * GitHub-style contribution heatmap.
 *
 * Fixed-size squares (10px) with scrollable overflow on narrow viewports.
 * Week starts on Sunday. Tooltips rendered as a portal to avoid clipping.
 */
export function HeatmapChart({ data, weeks = 52 }: HeatmapChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const mounted = useIsMounted();

  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    const endOfGrid = today;
    const startOfGrid = startOfWeek(subDays(endOfGrid, weeks * 7 - 1), {
      weekStartsOn: 0,
    });

    const dataMap = new Map<string, number>();
    for (const d of data) {
      dataMap.set(d.date, d.count);
    }

    const totalWeeks = differenceInWeeks(endOfGrid, startOfGrid) + 1;
    const gridData: {
      date: Date;
      count: number;
      dateStr: string;
    }[][] = [];
    const months: { label: string; colStart: number }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < totalWeeks; w++) {
      const weekStart = addDays(startOfGrid, w * 7);
      const weekData: (typeof gridData)[number] = [];

      for (let d = 0; d < 7; d++) {
        const cellDate = addDays(weekStart, d);
        const dateStr = format(cellDate, 'yyyy-MM-dd');
        const count = cellDate <= today ? (dataMap.get(dateStr) ?? 0) : 0;

        weekData.push({ date: cellDate, count, dateStr });
      }

      gridData.push(weekData);

      const firstVisibleDay = weekData.find(
        (d) => d.date.getDate() <= 7 && d.date.getDate() >= 1
      );
      const monthOfWeek = weekStart.getMonth();
      if (monthOfWeek !== lastMonth) {
        if (firstVisibleDay && firstVisibleDay.date.getDate() <= 7) {
          months.push({
            label: format(weekStart, 'MMM'),
            colStart: w,
          });
        }
        lastMonth = monthOfWeek;
      }
    }

    return { grid: gridData, monthLabels: months };
  }, [data, weeks]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, count: number, date: Date) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({
        text: `${levelText(count)} on ${format(date, 'MMM d, yyyy')}`,
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const totalWidth =
    LABEL_WIDTH + grid.length * CELL_SIZE + (grid.length - 1) * CELL_GAP;

  return (
    <div ref={containerRef} className="relative w-full overflow-x-auto">
      <div style={{ minWidth: totalWidth }}>
        {/* Month labels */}
        <div className="flex" style={{ paddingLeft: `${LABEL_WIDTH}px`, marginBottom: '2px' }}>
          {grid.map((_, weekIdx) => {
            const monthEntry = monthLabels.find((m) => m.colStart === weekIdx);
            return (
              <div
                key={weekIdx}
                style={{ width: CELL_SIZE, marginRight: CELL_GAP }}
                className="text-[10px] text-muted-foreground leading-none shrink-0"
              >
                {monthEntry ? monthEntry.label : ''}
              </div>
            );
          })}
        </div>

        {/* Grid body: day labels + cells */}
        <div className="flex">
          {/* Day-of-week labels */}
          <div
            className="flex flex-col shrink-0"
            style={{ width: `${LABEL_WIDTH}px` }}
          >
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                style={{
                  height: CELL_SIZE,
                  marginBottom: i < 6 ? CELL_GAP : 0,
                }}
                className="text-[10px] text-muted-foreground leading-none flex items-center justify-end pr-1"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Heatmap squares */}
          <div className="flex" style={{ gap: CELL_GAP }}>
            {grid.map((week, weekIdx) => (
              <div
                key={weekIdx}
                className="flex flex-col"
                style={{ gap: CELL_GAP }}
              >
                {week.map((cell, dayIdx) => {
                  const isFuture = cell.date > new Date();
                  return (
                    <div
                      key={dayIdx}
                      style={{ width: CELL_SIZE, height: CELL_SIZE }}
                      className={`rounded-[2px] ${levelClass(cell.count, isFuture)} ${isFuture ? 'opacity-0' : 'cursor-pointer'}`}
                      onMouseEnter={(e) => {
                        if (!isFuture) handleMouseEnter(e, cell.count, cell.date);
                      }}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip rendered as portal to avoid clipping */}
      {mounted &&
        tooltip &&
        createPortal(
          <div
            className="fixed pointer-events-none z-[9999] px-2 py-1 rounded text-[11px] bg-foreground text-background shadow-lg whitespace-nowrap"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            {tooltip.text}
          </div>,
          document.body
        )}
    </div>
  );
}
