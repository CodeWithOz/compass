'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import type { AIProvider } from '@/lib/ai/providers';

export interface ProviderSelectorProps {
  value: AIProvider;
  onChange: (provider: AIProvider) => void;
  disabled?: boolean;
}

export function ProviderSelector({ value, onChange, disabled }: ProviderSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="ai-provider">AI Provider</Label>
      <select
        id="ai-provider"
        value={value}
        onChange={(e) => onChange(e.target.value as AIProvider)}
        disabled={disabled}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
      >
        <option value="claude">Claude (Anthropic)</option>
        <option value="openai">OpenAI GPT-4</option>
        <option value="gemini">Gemini (Google)</option>
      </select>
      <p className="text-xs text-muted-foreground">
        Choose which AI model to use for journal analysis
      </p>
    </div>
  );
}
