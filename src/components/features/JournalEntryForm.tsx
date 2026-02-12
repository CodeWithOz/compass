'use client';

import React, { useState } from 'react';
import { createJournalEntry } from '@/actions/journal';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import type { AIProvider } from '@/lib/ai/providers';

export interface JournalEntryFormProps {
  linkedResolutionIds?: string[];
  provider?: AIProvider;
  onSuccess?: () => void;
}

/**
 * Journal Entry Form Component
 *
 * CRITICAL UX PHILOSOPHY:
 * - Low-friction, voice-like input (large textarea, no structure required)
 * - Support brain dumps and incoherent thoughts
 * - No character limits, no required fields beyond the text itself
 * - Make it feel like talking to yourself, not filling out a form
 * - Server Action only: Submit calls server action, no client-side logic
 * - Optimistic UI: Show success immediately, don't wait for AI
 * - Display pending state for AI analysis separately
 */
export function JournalEntryForm({
  linkedResolutionIds = [],
  provider,
  onSuccess,
}: JournalEntryFormProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      setError('Please write something before submitting');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Call server action - saves entry and enqueues AI analysis
      const result = await createJournalEntry(
        {
          rawText: text,
          linkedResolutionIds,
          idempotencyKey: `${Date.now()}-${Math.random()}`,
        },
        provider
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // Success! Entry saved, AI analysis enqueued
      setSuccess(true);
      setText(''); // Clear form

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save journal entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's been happening?"
          rows={8}
          className="font-sans text-base border-neutral-200 focus:border-neutral-400 focus:ring-0"
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <div className="text-sm text-neutral-600">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-neutral-600">
          ✓ Entry saved<br />
          <span className="text-neutral-500">Analysis pending...</span>
        </div>
      )}

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={!text.trim() || isSubmitting}
          className="px-4 py-2 text-sm font-medium text-neutral-900 bg-white border border-neutral-300 rounded-md hover:border-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
