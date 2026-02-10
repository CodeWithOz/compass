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
          placeholder="What's on your mind? Write freely, no structure needed. This is your space to think out loud..."
          rows={8}
          className="font-sans text-base"
          disabled={isSubmitting}
          helperText="Voice-like, messy, sporadic, and honest. The system adapts to you."
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-3 border border-green-200">
          <p className="text-sm text-green-800">
            ✓ Entry saved successfully. AI analysis is processing in the background.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {text.trim() ? `${text.trim().split(/\s+/).length} words` : 'Start writing...'}
        </div>

        <Button type="submit" isLoading={isSubmitting} disabled={!text.trim()}>
          {isSubmitting ? 'Saving...' : 'Save Entry'}
        </Button>
      </div>

      <div className="text-xs text-gray-400 italic">
        Your entry is saved immediately. AI interpretation happens in the background and will appear
        on your dashboard when ready.
      </div>
    </form>
  );
}
