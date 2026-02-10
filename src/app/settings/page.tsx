import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ExportDataButton } from './ExportDataButton';

/**
 * Settings Page
 *
 * - Default AI provider selection
 * - Export data functionality
 * - Resolution archive management
 */
export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Configure your Compass experience</p>
      </div>

      {/* Settings sections */}
      <div className="space-y-6">
        {/* AI Provider */}
        <Card>
          <CardHeader>
            <CardTitle>AI Provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Default AI provider for journal analysis. You can always re-analyze entries with a
              different provider.
            </p>

            <div className="flex items-center gap-3">
              <select
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue={process.env.DEFAULT_AI_PROVIDER || 'claude'}
              >
                <option value="claude">Claude (Anthropic) - Recommended</option>
                <option value="openai">OpenAI GPT-4</option>
              </select>
              <Button variant="secondary" disabled>
                Save (Coming Soon)
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              Note: This setting is currently configured via environment variables
            </p>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle>Export Your Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Download all your resolutions, journal entries, and AI interpretations as JSON. Exit
              is a feature - you own your data.
            </p>

            <div>
              <ExportDataButton />
            </div>

            <p className="text-xs text-gray-500">
              Includes: All resolutions, journal entries, AI interpretations, phases, and activity
              data
            </p>
          </CardContent>
        </Card>

        {/* Archive Management */}
        <Card>
          <CardHeader>
            <CardTitle>Archive Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              View and manage your archived resolutions. Archived items are not deleted - you can
              always reactivate them.
            </p>

            <div className="flex gap-3">
              <a href="/resolutions?status=ARCHIVED">
                <Button variant="secondary">View Archived Resolutions</Button>
              </a>
            </div>

            <p className="text-xs text-gray-500">
              Archiving preserves your data and history while removing items from active views
            </p>
          </CardContent>
        </Card>

        {/* Database Info */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Default AI Provider</p>
                <p className="font-medium text-gray-900">
                  {process.env.DEFAULT_AI_PROVIDER || 'claude'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Database</p>
                <p className="font-medium text-gray-900">PostgreSQL + Prisma 7</p>
              </div>
              <div>
                <p className="text-gray-600">Deployment</p>
                <p className="font-medium text-gray-900">
                  {process.env.NODE_ENV || 'development'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Framework</p>
                <p className="font-medium text-gray-900">Next.js 15 (App Router)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Philosophy reminder */}
      <div className="mt-12 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-purple-900 font-medium mb-2">
          🧭 Compass Philosophy
        </p>
        <ul className="text-sm text-purple-800 space-y-1">
          <li><strong>Direction &gt; speed:</strong> Progress toward purpose matters more than speed</li>
          <li><strong>Momentum &gt; precision:</strong> Focus on continuity and rhythm, not perfection</li>
          <li><strong>Reflection &gt; compliance:</strong> The system adapts to you, not vice versa</li>
          <li><strong>Exit = feature:</strong> You own your data. Graceful exits are successes.</li>
        </ul>
      </div>
    </div>
  );
}
