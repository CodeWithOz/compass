'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { dismissReframe, snoozeReframe, applyReframe } from '@/actions/reframes';
import type { ReframeType } from '@prisma/client';

export interface ReframeAlertProps {
  interpretationId: string;
  type: ReframeType;
  reason: string | null;
  suggestion: string | null;
  resolutionName: string;
  onDismiss?: () => void;
}

/**
 * Reframe Alert Component
 *
 * CRITICAL: Strategic reframes are FIRST-CLASS, not buried in text
 * - Distinct visual treatment (prominent display)
 * - Show reframe type as badge
 * - Display reason and concrete suggestion
 * - Action buttons: Apply, Dismiss, Remind Later
 * - Surface at top of dashboard when present
 *
 * Reframes are about questioning the resolution itself, not suggesting tweaks
 */
export function ReframeAlert({
  interpretationId,
  type,
  reason,
  suggestion,
  resolutionName,
  onDismiss,
}: ReframeAlertProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSnooze, setShowSnooze] = useState(false);

  const reframeConfig = {
    MISALIGNMENT: {
      icon: '🔄',
      color: 'orange',
      title: 'Possible Misalignment',
      description: 'This resolution may conflict with your current reality or priorities',
    },
    STAGNATION: {
      icon: '🔁',
      color: 'amber',
      title: 'Pattern of Stagnation',
      description: 'Consistent effort without meaningful progress detected',
    },
    OVER_OPTIMIZATION: {
      icon: '📊',
      color: 'blue',
      title: 'Over-Optimization Signal',
      description: 'Focus on metrics may be obscuring the underlying purpose',
    },
    PHASE_MISMATCH: {
      icon: '⚖️',
      color: 'indigo',
      title: 'Phase Expectation Mismatch',
      description: 'Current phase expectations may not fit actual capacity',
    },
    EXIT_SIGNAL: {
      icon: '🚪',
      color: 'purple',
      title: 'Exit Signal Detected',
      description: 'Pattern suggests this may be a natural completion point',
    },
  };

  const config = reframeConfig[type];

  const colorClasses = {
    orange: 'bg-orange-50 border-orange-300 text-orange-900',
    amber: 'bg-amber-50 border-amber-300 text-amber-900',
    blue: 'bg-blue-50 border-blue-300 text-blue-900',
    indigo: 'bg-indigo-50 border-indigo-300 text-indigo-900',
    purple: 'bg-purple-50 border-purple-300 text-purple-900',
  };

  const badgeClasses = {
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  const handleDismiss = async () => {
    setIsProcessing(true);
    try {
      await dismissReframe(interpretationId);
      if (onDismiss) onDismiss();
    } catch (error) {
      console.error('Failed to dismiss reframe:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSnooze = async (days: number) => {
    setIsProcessing(true);
    try {
      const until = new Date();
      until.setDate(until.getDate() + days);
      await snoozeReframe(interpretationId, until);
      if (onDismiss) onDismiss();
    } catch (error) {
      console.error('Failed to snooze reframe:', error);
    } finally {
      setIsProcessing(false);
      setShowSnooze(false);
    }
  };

  const handleApply = async () => {
    setIsProcessing(true);
    try {
      const action = window.prompt('What action did you take in response to this reframe?');
      if (action) {
        await applyReframe(interpretationId, action);
        if (onDismiss) onDismiss();
      }
    } catch (error) {
      console.error('Failed to apply reframe:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className={`border-2 ${colorClasses[config.color as keyof typeof colorClasses]}`}>
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          <div className="text-3xl flex-shrink-0">{config.icon}</div>

          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{config.title}</h3>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                    badgeClasses[config.color as keyof typeof badgeClasses]
                  }`}
                >
                  {type.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm opacity-80">{config.description}</p>
            </div>

            <div className="bg-white bg-opacity-50 rounded-md p-3 space-y-2">
              <div>
                <p className="text-sm font-medium">Resolution:</p>
                <p className="text-sm">{resolutionName}</p>
              </div>

              {reason && (
                <div>
                  <p className="text-sm font-medium">Why this matters:</p>
                  <p className="text-sm">{reason}</p>
                </div>
              )}

              {suggestion && (
                <div>
                  <p className="text-sm font-medium">Consider:</p>
                  <p className="text-sm">{suggestion}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" onClick={handleApply} disabled={isProcessing}>
                I took action
              </Button>

              {!showSnooze ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowSnooze(true)}
                    disabled={isProcessing}
                  >
                    Remind me later
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDismiss} disabled={isProcessing}>
                    Dismiss
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm">Snooze for:</span>
                  <Button size="sm" variant="secondary" onClick={() => handleSnooze(1)}>
                    1 day
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleSnooze(7)}>
                    1 week
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowSnooze(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
