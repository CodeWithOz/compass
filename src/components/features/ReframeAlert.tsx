'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      title: 'Possible Misalignment',
      description: 'This resolution may conflict with your current reality or priorities',
    },
    STAGNATION: {
      icon: '🔁',
      title: 'Pattern of Stagnation',
      description: 'Consistent effort without meaningful progress detected',
    },
    OVER_OPTIMIZATION: {
      icon: '📊',
      title: 'Over-Optimization Signal',
      description: 'Focus on metrics may be obscuring the underlying purpose',
    },
    PHASE_MISMATCH: {
      icon: '⚖️',
      title: 'Phase Expectation Mismatch',
      description: 'Current phase expectations may not fit actual capacity',
    },
    EXIT_SIGNAL: {
      icon: '🚪',
      title: 'Exit Signal Detected',
      description: 'Pattern suggests this may be a natural completion point',
    },
  };

  const config = reframeConfig[type];

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
    <Card className="border-2 border-amber-200 bg-amber-50/50">
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          <div className="text-3xl flex-shrink-0">{config.icon}</div>

          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{config.title}</h3>
                <Badge variant="outline">
                  {type.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>

            <div className="rounded-md border bg-background/60 p-3 space-y-2">
              <div>
                <p className="text-sm font-medium">Resolution:</p>
                <p className="text-sm">{resolutionName}</p>
              </div>

              {reason && (
                <div>
                  <p className="text-sm font-medium">Why this matters:</p>
                  <p className="text-sm text-muted-foreground">{reason}</p>
                </div>
              )}

              {suggestion && (
                <div>
                  <p className="text-sm font-medium">Consider:</p>
                  <p className="text-sm text-muted-foreground">{suggestion}</p>
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
