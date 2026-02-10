'use client';

import React from 'react';
import { Select } from '@/components/ui/Select';
import type { AIProvider } from '@/lib/ai/providers';

export interface ProviderSelectorProps {
  value: AIProvider;
  onChange: (provider: AIProvider) => void;
  disabled?: boolean;
}

/**
 * Provider Selector Component
 *
 * Switch between AI providers (Claude, OpenAI)
 * Used for manual re-analysis or settings
 */
export function ProviderSelector({ value, onChange, disabled }: ProviderSelectorProps) {
  const options = [
    { value: 'claude', label: 'Claude (Anthropic)' },
    { value: 'openai', label: 'OpenAI GPT-4' },
  ];

  return (
    <Select
      label="AI Provider"
      value={value}
      onChange={(e) => onChange(e.target.value as AIProvider)}
      options={options}
      disabled={disabled}
      helperText="Choose which AI model to use for journal analysis"
    />
  );
}
