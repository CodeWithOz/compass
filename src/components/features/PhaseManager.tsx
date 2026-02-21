'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';
import { createPhase, activatePhase, deactivatePhase } from '@/actions/phases';
import type { ResolutionPhase } from '@prisma/client';

export interface PhaseManagerProps {
  resolutionId: string;
  currentPhase?: ResolutionPhase | null;
  phases?: ResolutionPhase[];
  onUpdate?: () => void;
}

export function PhaseManager({
  resolutionId,
  currentPhase,
  phases = [],
  onUpdate,
}: PhaseManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    expectedFrequency: '',
    intensityLevel: 3,
  });

  const handleCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createPhase({
        resolutionId,
        name: formData.name,
        description: formData.description || undefined,
        startDate: (() => { const [y, m, d] = formData.startDate.split('-').map(Number); return new Date(y, m - 1, d); })(),
        endDate: formData.endDate ? (() => { const [y, m, d] = formData.endDate.split('-').map(Number); return new Date(y, m - 1, d); })() : undefined,
        expectedFrequency: formData.expectedFrequency || undefined,
        intensityLevel: formData.intensityLevel,
      });

      if (result.success) {
        setFormData({
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          expectedFrequency: '',
          intensityLevel: 3,
        });
        setIsCreating(false);
        if (onUpdate) onUpdate();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error creating phase:', error);
      alert('Failed to create phase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivatePhase = async (phaseId: string) => {
    try {
      const result = await activatePhase(resolutionId, phaseId);
      if (result.success) {
        if (onUpdate) onUpdate();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error activating phase:', error);
      alert('Failed to activate phase');
    }
  };

  const handleDeactivatePhase = async () => {
    try {
      const result = await deactivatePhase(resolutionId);
      if (result.success) {
        if (onUpdate) onUpdate();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error deactivating phase:', error);
      alert('Failed to deactivate phase');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold leading-none tracking-tight">
            Phases &amp; Seasonality
          </h3>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsCreating(!isCreating)}
          >
            {isCreating ? 'Cancel' : '+ New Phase'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current phase display */}
        {currentPhase && (
          <div className="rounded-md border bg-accent/50 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium">Current Phase: {currentPhase.name}</p>
                {currentPhase.description && (
                  <p className="text-sm text-muted-foreground mt-1">{currentPhase.description}</p>
                )}
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>
                    {new Date(currentPhase.startDate).toLocaleDateString(undefined, { timeZone: 'UTC' })} -{' '}
                    {currentPhase.endDate ? new Date(currentPhase.endDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'Ongoing'}
                  </span>
                  {currentPhase.expectedFrequency && (
                    <span>• {currentPhase.expectedFrequency}</span>
                  )}
                  {currentPhase.intensityLevel && (
                    <span>• Intensity: {currentPhase.intensityLevel}/5</span>
                  )}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={handleDeactivatePhase}>
                Deactivate
              </Button>
            </div>
          </div>
        )}

        {/* Create phase form */}
        {isCreating && (
          <form onSubmit={handleCreatePhase} className="space-y-4 rounded-md border p-4">
            <div className="space-y-2">
              <Label htmlFor="phase-name">Phase Name</Label>
              <Input
                id="phase-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., French exam prep phase"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phase-desc">Description (optional)</Label>
              <Textarea
                id="phase-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What makes this phase different?"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="phase-start">Start Date</Label>
                <Input
                  id="phase-start"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phase-end">End Date (optional)</Label>
                <Input
                  id="phase-end"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phase-freq">Expected Frequency (optional)</Label>
              <Input
                id="phase-freq"
                value={formData.expectedFrequency}
                onChange={(e) => setFormData({ ...formData, expectedFrequency: e.target.value })}
                placeholder="e.g., daily, 3x/week"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Intensity Level: {formData.intensityLevel}/5
              </Label>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[formData.intensityLevel]}
                onValueChange={([val]) => setFormData({ ...formData, intensityLevel: val })}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Phase'
              )}
            </Button>
          </form>
        )}

        {/* Phase list */}
        {phases.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">All Phases</p>
            <div className="space-y-2">
              {phases.map((phase) => {
                const isActive = currentPhase?.id === phase.id;
                return (
                  <div
                    key={phase.id}
                    className={`rounded-md border p-3 ${
                      isActive ? 'border-primary bg-accent/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{phase.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(phase.startDate).toLocaleDateString(undefined, { timeZone: 'UTC' })} -{' '}
                          {phase.endDate ? new Date(phase.endDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'Ongoing'}
                        </p>
                      </div>
                      {!isActive && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleActivatePhase(phase.id)}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground italic">
          Phases help the system adapt expectations to your current reality (e.g., exam prep, vacation,
          normal routine)
        </p>
      </CardContent>
    </Card>
  );
}
