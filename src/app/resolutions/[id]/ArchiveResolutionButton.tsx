'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { archiveResolution } from '@/actions/resolutions';

export interface ArchiveResolutionButtonProps {
  resolutionId: string;
  label?: string;
}

export function ArchiveResolutionButton({
  resolutionId,
  label = 'Archive',
}: ArchiveResolutionButtonProps) {
  const router = useRouter();
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    const confirmed = window.confirm(
      label === 'Exit'
        ? 'Mark this exploratory track as complete? This is a natural completion point, not a failure.'
        : 'Archive this resolution? You can reactivate it later if needed.'
    );

    if (!confirmed) return;

    setIsArchiving(true);

    try {
      const result = await archiveResolution(resolutionId);

      if (result.success) {
        router.push('/resolutions');
        router.refresh();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error archiving resolution:', error);
      alert('Failed to archive resolution');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <button
      onClick={handleArchive}
      disabled={isArchiving}
      className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <span className="material-icons text-base">inventory_2</span>
      {isArchiving ? 'Archiving...' : label}
    </button>
  );
}
