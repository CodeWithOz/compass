import React from 'react';
import Link from 'next/link';
import { ExportDataButton } from './ExportDataButton';

/**
 * Settings & Export
 *
 * Primary question: Can I trust this system?
 *
 * Sections:
 * - Data export
 * - AI provider configuration
 */
export default async function SettingsPage() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-medium text-neutral-900 mb-2">Settings</h1>
        <p className="text-sm text-neutral-500">
          Your data belongs to you
        </p>
      </div>

      {/* Data Export */}
      <section>
        <h2 className="text-sm font-medium text-neutral-600 mb-4">Data export</h2>
        <div className="border border-neutral-200 rounded-md bg-white p-6">
          <p className="text-sm text-neutral-600 mb-4">
            Download all your data (resolutions, journal entries, AI interpretations, and phases) as JSON.
          </p>
          <ExportDataButton />
        </div>
      </section>

      {/* AI Configuration */}
      <section>
        <h2 className="text-sm font-medium text-neutral-600 mb-4">AI provider</h2>
        <div className="border border-neutral-200 rounded-md bg-white p-6">
          <p className="text-sm text-neutral-600 mb-2">
            Default: {process.env.DEFAULT_AI_PROVIDER || 'claude'}
          </p>
          <p className="text-xs text-neutral-500">
            Configured via environment variables
          </p>
        </div>
      </section>

      {/* Archive Link */}
      <section>
        <h2 className="text-sm font-medium text-neutral-600 mb-4">Archived resolutions</h2>
        <div className="border border-neutral-200 rounded-md bg-white p-6">
          <Link
            href="/resolutions?status=ARCHIVED"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View archived resolutions
          </Link>
        </div>
      </section>
    </div>
  );
}
