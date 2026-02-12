'use client';

import React, { useState } from 'react';
import { createJournalEntry } from '@/actions/journal';
import type { AIProvider } from '@/lib/ai/providers';

export interface JournalEntryFormProps {
  linkedResolutionIds?: string[];
  provider?: AIProvider;
  onSuccess?: () => void;
}

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

      setSuccess(true);
      setText('');

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save journal entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's been happening?"
        rows={12}
        className="w-full text-base text-slate-700 placeholder:text-slate-400 bg-transparent border-0 outline-none resize-none leading-relaxed"
        disabled={isSubmitting}
      />

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={!text.trim() || isSubmitting}
          className="bg-primary hover:bg-primary/90 text-white px-10 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>

        {success && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="material-icons text-sm animate-spin">autorenew</span>
            Analysis pending...
          </div>
        )}
      </div>
    </form>
  );
}
