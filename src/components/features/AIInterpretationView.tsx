'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import type { AIInterpretation } from '@prisma/client';

export interface AIInterpretationViewProps {
  interpretation?: AIInterpretation;
  isPending?: boolean;
}

/**
 * AI Interpretation View Component
 *
 * Displays AI analysis results with provider info
 * - Shows "Analysis pending..." if not yet complete
 * - Display provider used and timestamp
 * - Shows detected activity, momentum, and risk flags
 */
export function AIInterpretationView({ interpretation, isPending }: AIInterpretationViewProps) {
  if (isPending || !interpretation) {
    return (
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="py-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <svg
              className="animate-spin h-8 w-8 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-sm text-gray-500">Analysis pending...</p>
            <p className="text-xs text-gray-400">
              AI is processing your entry in the background
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const momentumColors = {
    NONE: 'bg-gray-100 text-gray-800',
    LOW: 'bg-yellow-100 text-yellow-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-green-100 text-green-800',
  };

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Provider and timestamp */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Analyzed by: {interpretation.provider}</span>
          <span>{new Date(interpretation.createdAt).toLocaleString()}</span>
        </div>

        {/* Momentum signal */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Momentum Signal</p>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              momentumColors[interpretation.momentumSignal]
            }`}
          >
            {interpretation.momentumSignal}
          </span>
        </div>

        {/* Detected activity */}
        {Object.keys(interpretation.detectedActivity as object).length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Detected Activity</p>
            <div className="space-y-1">
              {Object.entries(interpretation.detectedActivity as Record<string, string>).map(
                ([resolutionId, level]) => (
                  <div key={resolutionId} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{resolutionId.substring(0, 8)}...</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        level === 'FULL'
                          ? 'bg-green-100 text-green-800'
                          : level === 'PARTIAL'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {level}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Risk flags */}
        {interpretation.riskFlags && interpretation.riskFlags.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Signals Detected</p>
            <div className="flex flex-wrap gap-1">
              {interpretation.riskFlags.map((flag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800"
                >
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Suggested adjustments */}
        {interpretation.suggestedAdjustments && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm font-medium text-blue-900 mb-1">Optional Adjustments</p>
            <p className="text-sm text-blue-800">{interpretation.suggestedAdjustments}</p>
          </div>
        )}

        {/* Reframe indicator (link to full view) */}
        {interpretation.reframeType && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
            <p className="text-sm font-medium text-purple-900">
              ⚠️ Strategic reframe detected: {interpretation.reframeType.replace('_', ' ')}
            </p>
            <p className="text-xs text-purple-700 mt-1">
              View the full reframe suggestion on your dashboard
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
