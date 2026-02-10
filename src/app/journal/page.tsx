import React from 'react';
import Link from 'next/link';
import { getJournalEntries } from '@/actions/journal';
import { getResolutions } from '@/actions/resolutions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { JournalEntryForm } from '@/components/features/JournalEntryForm';

/**
 * Journal Page
 *
 * - Journal entry form with AI provider selection
 * - List of recent entries
 * - Link entries to resolutions
 */
export default async function JournalPage() {
  const [entriesResult, resolutionsResult] = await Promise.all([
    getJournalEntries({ limit: 20 }),
    getResolutions('ACTIVE'),
  ]);

  const entries = entriesResult.data || [];
  const resolutions = resolutionsResult.data || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Journal</h1>
        <p className="text-gray-600">
          Write freely. Your thoughts, messy and honest. The system adapts to you.
        </p>
      </div>

      {/* Journal Entry Form */}
      <div className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle>New Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <JournalEntryForm
              linkedResolutionIds={resolutions.map((r) => r.id)}
              onSuccess={() => {
                // Refresh page to show new entry
                window.location.reload();
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Entries */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Entries</h2>

        {entries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No journal entries yet. Write your first entry above!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const hasInterpretation =
                entry.interpretations && entry.interpretations.length > 0;

              return (
                <Link key={entry.id} href={`/journal/${entry.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm text-gray-500">
                          {new Date(entry.timestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {hasInterpretation ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Analyzed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⏳ Pending
                          </span>
                        )}
                      </div>

                      <p className="text-gray-700 line-clamp-3">{entry.rawText}</p>

                      <div className="mt-2 text-xs text-gray-500">
                        {entry.rawText.split(/\s+/).length} words
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="mt-12 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900 font-medium mb-2">💭 Journaling with Compass</p>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>Write naturally - brain dumps, incoherent thoughts, all welcome</li>
          <li>No structure required - this is your space to think out loud</li>
          <li>AI analysis happens in the background - you&apos;ll see insights on your dashboard</li>
          <li>Focus on presence and rhythm, not perfection</li>
        </ul>
      </div>
    </div>
  );
}
