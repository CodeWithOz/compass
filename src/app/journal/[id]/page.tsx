import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getJournalEntry } from '@/actions/journal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { AIInterpretationView } from '@/components/features/AIInterpretationView';
import { ReanalyzeButton } from './ReanalyzeButton';

/**
 * Journal Entry Detail Page
 *
 * - View single entry with AI interpretation
 * - Re-analyze with different provider option
 */
export default async function JournalEntryPage({
  params,
}: {
  params: { id: string };
}) {
  const entryResult = await getJournalEntry(params.id);

  if (!entryResult.success || !entryResult.data) {
    notFound();
  }

  const entry = entryResult.data;
  const latestInterpretation =
    entry.interpretations && entry.interpretations.length > 0
      ? entry.interpretations[0]
      : undefined;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/journal" className="text-blue-600 hover:underline text-sm mb-2 block">
          ← Back to Journal
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Journal Entry</h1>
            <p className="text-sm text-gray-500">
              {new Date(entry.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <ReanalyzeButton entryId={params.id} />
        </div>
      </div>

      {/* Entry Content */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-gray max-w-none">
              <p className="whitespace-pre-wrap text-gray-700">{entry.rawText}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                {entry.rawText.split(/\s+/).length} words •{' '}
                {new Date(entry.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Interpretation */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Interpretation</h2>
        <AIInterpretationView
          interpretation={latestInterpretation}
          isPending={!latestInterpretation}
        />
      </div>

      {/* All Interpretations (if multiple) */}
      {entry.interpretations && entry.interpretations.length > 1 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Previous Interpretations ({entry.interpretations.length - 1})
          </h2>
          <div className="space-y-4">
            {entry.interpretations.slice(1).map((interpretation) => (
              <AIInterpretationView
                key={interpretation.id}
                interpretation={interpretation}
              />
            ))}
          </div>
        </div>
      )}

      {/* Helper text */}
      <div className="mt-12 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 AI interpretations are descriptive, not judgmental. They surface patterns and
          signals to help you reflect, not to tell you what to do.
        </p>
      </div>
    </div>
  );
}
