'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { archiveResolution } from '@/actions/resolutions';
import { Button } from '@/components/ui/Button';
import type { ButtonProps } from '@/components/ui/Button';

export interface ArchiveResolutionButtonProps {
  resolutionId: string;
  label?: string;
  variant?: ButtonProps['variant'];
}

/**
 * Archive Resolution Button
 *
 * Client component for archiving resolutions
 * - For EXPLORATORY_TRACK: "Exit Gracefully" (positive framing)
 * - For others: "Archive" (not "Delete" or "Quit")
 */
export function ArchiveResolutionButton({
  resolutionId,
  label = 'Archive',
  variant = 'danger',
}: ArchiveResolutionButtonProps) {
  const router = useRouter();
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    const confirmed = window.confirm(
      label === 'Exit Gracefully'
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
    <Button variant={variant} onClick={handleArchive} isLoading={isArchiving}>
      {label}
    </Button>
  );
}
