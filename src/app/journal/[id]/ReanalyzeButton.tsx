'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { triggerReanalysis } from '@/actions/journal';
import { Button } from '@/components/ui/Button';
import { ProviderSelector } from '@/components/features/ProviderSelector';
import type { AIProvider } from '@/lib/ai/providers';

export interface ReanalyzeButtonProps {
  entryId: string;
}

/**
 * Reanalyze Button Component
 *
 * Allow re-analysis of journal entry with different AI provider
 * Useful for comparing interpretations
 */
export function ReanalyzeButton({ entryId }: ReanalyzeButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [provider, setProvider] = useState<AIProvider>('claude');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleReanalyze = async () => {
    setIsAnalyzing(true);

    try {
      const result = await triggerReanalysis(entryId, provider);

      if (result.success) {
        setIsOpen(false);
        // Refresh page to show new interpretation (after a delay for analysis to complete)
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

  if (!isOpen) {
    return (
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        🔄 Reanalyze
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-48">
        <ProviderSelector
          value={provider}
          onChange={setProvider}
          disabled={isAnalyzing}
        />
      </div>
      <Button onClick={handleReanalyze} isLoading={isAnalyzing} size="sm">
        Analyze
      </Button>
      <Button variant="ghost" onClick={() => setIsOpen(false)} size="sm">
        Cancel
      </Button>
    </div>
  );
}
