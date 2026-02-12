'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { triggerReanalysis } from '@/actions/journal';
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
        setTimeout(() => {
          router.refresh();
        }, 2000);
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
    <button
      onClick={handleReanalyze}
      disabled={isAnalyzing}
      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors disabled:opacity-50"
    >
      <span className="material-icons text-slate-500 text-lg">person</span>
    </button>
  );
}
