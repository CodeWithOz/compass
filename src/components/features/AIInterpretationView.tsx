'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import type { AIInterpretation } from '@prisma/client';

export interface AIInterpretationViewProps {
  interpretation?: AIInterpretation;
  isPending?: boolean;
}

export function AIInterpretationView({ interpretation, isPending }: AIInterpretationViewProps) {
  if (isPending || !interpretation) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Analysis pending...</p>
            <p className="text-xs text-muted-foreground">
              AI is processing your entry in the background
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const momentumVariants = {
    NONE: 'secondary' as const,
    LOW: 'outline' as const,
    MEDIUM: 'secondary' as const,
    HIGH: 'default' as const,
  };

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Provider and timestamp */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Analyzed by: {interpretation.provider}</span>
          <span>{new Date(interpretation.createdAt).toLocaleString()}</span>
        </div>

        {/* Momentum signal */}
        <div>
          <p className="text-sm font-medium mb-2">Momentum Signal</p>
          <Badge variant={momentumVariants[interpretation.momentumSignal] ?? 'secondary'}>
            {interpretation.momentumSignal}
          </Badge>
        </div>

        {/* Detected activity */}
        {interpretation.detectedActivity != null &&
          typeof interpretation.detectedActivity === 'object' &&
          Object.keys(interpretation.detectedActivity as object).length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Detected Activity</p>
            <div className="space-y-1">
              {Object.entries(interpretation.detectedActivity as Record<string, string>).map(
                ([resolutionId, level]) => (
                  <div key={resolutionId} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{resolutionId.substring(0, 8)}...</span>
                    <Badge
                      variant={
                        level === 'FULL' ? 'default' : level === 'PARTIAL' ? 'secondary' : 'outline'
                      }
                    >
                      {level}
                    </Badge>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Risk flags */}
        {interpretation.riskFlags && interpretation.riskFlags.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Signals Detected</p>
            <div className="flex flex-wrap gap-1">
              {interpretation.riskFlags.map((flag, index) => (
                <Badge key={index} variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                  {flag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Suggested adjustments */}
        {interpretation.suggestedAdjustments && (
          <div className="rounded-md border bg-accent/50 p-3">
            <p className="text-sm font-medium mb-1">Optional Adjustments</p>
            <p className="text-sm text-muted-foreground">{interpretation.suggestedAdjustments}</p>
          </div>
        )}

        {/* Reframe indicator */}
        {interpretation.reframeType && (
          <div className="rounded-md border bg-purple-50 border-purple-200 p-3">
            <p className="text-sm font-medium text-purple-900">
              ⚠️ Strategic reframe detected: {interpretation.reframeType.replace(/_/g, ' ')}
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
