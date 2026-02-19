'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { archiveResolution } from '@/actions/resolutions';
import { Button } from '@/components/ui/button';
import { Archive, Loader2 } from 'lucide-react';

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
      } else {
        alert(result.error);
        setIsArchiving(false);
      }
    } catch (error) {
      console.error('Error archiving resolution:', error);
      alert('Failed to archive resolution');
      setIsArchiving(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleArchive}
      disabled={isArchiving}
      className="text-muted-foreground"
    >
      {isArchiving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Archive className="h-4 w-4" />
      )}
      {isArchiving ? 'Archiving...' : label}
    </Button>
  );
}
