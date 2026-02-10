import React from 'react';
import Link from 'next/link';
import { getResolutions } from '@/actions/resolutions';
import { getActiveReframes } from '@/actions/reframes';
import { getHeatmapData } from '@/actions/analytics';
import { getJournalEntries } from '@/actions/journal';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ReframeAlert } from '@/components/features/ReframeAlert';
import { HeatmapChart } from '@/components/features/HeatmapChart';
import { subDays } from 'date-fns';

/**
 * Dashboard Page
 *
 * Main entry point for the Compass application
 *
 * CRITICAL ARCHITECTURE:
 * - Reframe alerts at TOP (prominently displayed)
 * - GitHub-style heatmap for all resolutions
 * - Today's journal entry status
 * - Current phase info for each active resolution
 * - Quick action buttons
 *
 * Philosophy: "What has been happening?" not "How well are you doing?"
 */
export default async function DashboardPage() {
  // Fetch data in parallel
  const [resolutionsResult, reframesResult, todayEntriesResult] = await Promise.all([
    getResolutions('ACTIVE'),
    getActiveReframes(),
    getJournalEntries({
      startDate: new Date(new Date().setHours(0, 0, 0, 0)),
      limit: 5,
    }),
  ]);

  const resolutions = resolutionsResult.data || [];
  const reframesByResolution = reframesResult.data || {};
  const todayEntries = todayEntriesResult.data || [];

  // Get heatmap data for last 365 days
  const endDate = new Date();
  const startDate = subDays(endDate, 365);
  const heatmapResult = await getHeatmapData(startDate, endDate);
  const heatmapData = heatmapResult.data || [];

  // Get all active reframes (flatten)
  const allReframes = Object.entries(reframesByResolution).flatMap(([resId, reframes]) =>
    reframes.map((reframe: any) => ({
      ...reframe,
      resolutionName:
        resolutions.find((r) => r.id === resId)?.name || 'Unknown Resolution',
    }))
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compass</h1>
        <p className="text-gray-600">
          Your personal resolution tracking system. What has been happening?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Link href="/journal">
          <Button>✍️ New Journal Entry</Button>
        </Link>
        <Link href="/resolutions">
          <Button variant="secondary">+ Add Resolution</Button>
        </Link>
      </div>

      {/* CRITICAL: Reframe Alerts at TOP (prominently displayed) */}
      {allReframes.length > 0 && (
        <div className="mb-8 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Strategic Reframes</h2>
          {allReframes.slice(0, 3).map((reframe: any) => (
            <ReframeAlert
              key={reframe.id}
              interpretationId={reframe.id}
              type={reframe.type}
              reason={reframe.reason}
              suggestion={reframe.suggestion}
              resolutionName={reframe.resolutionName}
            />
          ))}
          {allReframes.length > 3 && (
            <p className="text-sm text-gray-500 text-center">
              + {allReframes.length - 3} more reframes.{' '}
              <Link href="/resolutions" className="text-blue-600 hover:underline">
                View all
              </Link>
            </p>
          )}
        </div>
      )}

      {/* Today's Activity */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Journal Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {todayEntries.length > 0 ? (
              <div className="space-y-2">
                {todayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="border-l-4 border-blue-500 pl-3 py-2 hover:bg-gray-50"
                  >
                    <Link href={`/journal/${entry.id}`}>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {entry.rawText.substring(0, 150)}...
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                        {entry.interpretations && entry.interpretations.length > 0 ? (
                          <span className="ml-2 text-green-600">✓ Analyzed</span>
                        ) : (
                          <span className="ml-2 text-yellow-600">⏳ Analysis pending</span>
                        )}
                      </p>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-3">No journal entries yet today</p>
                <Link href="/journal">
                  <Button size="sm">Write something</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Resolutions & Heatmaps */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Resolutions</h2>

        {resolutions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">
                You haven&apos;t created any resolutions yet
              </p>
              <Link href="/resolutions">
                <Button>Create Your First Resolution</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {heatmapData.map((item) => (
              <Card key={item.resolution.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/resolutions/${item.resolution.id}`}>
                        <CardTitle className="hover:text-blue-600 cursor-pointer">
                          {item.resolution.name}
                        </CardTitle>
                      </Link>
                      <div className="flex gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.resolution.type.replace('_', ' ')}
                        </span>
                        {item.currentPhase && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            📍 {item.currentPhase.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <HeatmapChart
                    data={item.activities.map((a) => ({
                      date: new Date(a.date),
                      level: a.level,
                    }))}
                    startDate={startDate}
                    endDate={endDate}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="text-center text-sm text-gray-400 italic mt-12">
        <p>
          Compass is about direction, not speed. Momentum, not precision. Reflection, not
          compliance.
        </p>
      </div>
    </div>
  );
}
