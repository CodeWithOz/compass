'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createJournalEntry } from '@/actions/journal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
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
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

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
          idempotencyKey,
        },
        provider
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess(true);
      setText('');
      setIdempotencyKey(crypto.randomUUID());

      if (onSuccess) {
        onSuccess();
      }

      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save journal entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's been happening?"
        rows={12}
        className="text-base leading-relaxed p-6 rounded-xl resize-none border-border/80 focus-visible:ring-ring/30"
        disabled={isSubmitting}
      />

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex flex-col items-center gap-3 pt-4">
        <Button
          type="submit"
          disabled={!text.trim() || isSubmitting}
          size="lg"
          className="px-10"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>

        {success && (
          <p className="text-sm text-muted-foreground">
            Analysis pending...
          </p>
        )}
      </div>
    </form>
  );
}
