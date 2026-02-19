'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function jsonToCsv(data: Record<string, unknown[]>): string {
  const lines: string[] = [];

  for (const [section, rows] of Object.entries(data)) {
    if (!Array.isArray(rows) || rows.length === 0) continue;

    lines.push(`--- ${section} ---`);
    const headers = Object.keys(rows[0] as Record<string, unknown>);
    lines.push(headers.join(','));

    for (const row of rows) {
      const values = headers.map((h) => {
        const val = (row as Record<string, unknown>)[h];
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
        return `"${str.replace(/"/g, '""')}"`;
      });
      lines.push(values.join(','));
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function ExportDataButton({ format }: { format: 'csv' | 'json' }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await fetch('/api/export');

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const exportPayload = await response.json();
      const dateStr = new Date().toISOString().split('T')[0];

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
          type: 'application/json',
        });
        downloadBlob(blob, `compass-export-${dateStr}.json`);
      } else {
        const csv = jsonToCsv(exportPayload.data ?? {});
        const blob = new Blob([csv], { type: 'text/csv' });
        downloadBlob(blob, `compass-export-${dateStr}.csv`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      size="sm"
      variant={format === 'json' ? 'outline' : 'default'}
      className={format === 'json' ? 'text-primary border-primary/30 hover:bg-primary/5 hover:text-primary' : ''}
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Export as {format === 'json' ? 'JSON' : 'CSV'}
        </>
      )}
    </Button>
  );
}
