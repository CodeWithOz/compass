'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { triggerReanalysis } from '@/actions/journal';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import type { AIProvider } from '@/lib/ai/providers';

export interface ReanalyzeButtonProps {
  entryId: string;
}

export function ReanalyzeButton({ entryId }: ReanalyzeButtonProps) {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleReanalyze = async () => {
    setIsAnalyzing(true);

    try {
      const result = await triggerReanalysis(entryId, 'claude' as AIProvider);

      if (result.success) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        router.refresh();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error reanalyzing entry:', error);
      alert('Failed to trigger reanalysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleReanalyze}
      disabled={isAnalyzing}
      className="h-8 w-8 rounded-full"
      aria-label="Reanalyze journal entry"
    >
      {isAnalyzing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
    </Button>
  );
}
