import React from 'react';
import Link from 'next/link';
import { getJournalEntries } from '@/actions/journal';
import { getResolutions } from '@/actions/resolutions';
import { JournalFormWrapper } from './JournalFormWrapper';

/**
 * Journal Page
 *
 * Primary question: What do I want to say right now?
 *
 * Layout:
 * - Full-width text area with subtle placeholder
 * - Recent entries below
 */
export default async function JournalPage() {
  const [entriesResult, resolutionsResult] = await Promise.all([
    getJournalEntries({ limit: 20 }),
    getResolutions('ACTIVE'),
  ]);

  const entries = entriesResult.data || [];
  const resolutions = resolutionsResult.data || [];

  return (
    <div className="space-y-12">
      {/* New Entry Form */}
      <section>
        <h2 className="text-sm font-medium text-neutral-600 mb-4">New entry</h2>
        <div className="border border-neutral-200 rounded-md bg-white p-6">
          <JournalFormWrapper linkedResolutionIds={resolutions.map((r) => r.id)} />
        </div>
      </section>

      {/* Recent Entries */}
      {entries.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-neutral-600 mb-4">Recent entries</h2>
          <div className="space-y-3">
            {entries.map((entry) => (
              <Link
                key={entry.id}
                href={`/journal/${entry.id}`}
                className="block border border-neutral-200 rounded-md bg-white p-4 hover:border-neutral-300 transition-colors"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <p className="text-xs text-neutral-500">
                    {new Date(entry.timestamp).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {entry.rawText.split(/\s+/).length} words
                  </p>
                </div>
                <p className="text-sm text-neutral-700 line-clamp-3">{entry.rawText}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
