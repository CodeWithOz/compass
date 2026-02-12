'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

/**
 * Export Data Button Component
 *
 * Downloads all user data as JSON
 * Exit is a feature - user owns their data
 */
export function ExportDataButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Call export API endpoint
      const response = await fetch('/api/export');

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const data = await response.json();

      // Create download
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compass-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="px-4 py-2 text-sm font-medium text-neutral-900 bg-white border border-neutral-300 rounded-md hover:border-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isExporting ? 'Exporting...' : 'Export all data'}
    </button>
  );
}
