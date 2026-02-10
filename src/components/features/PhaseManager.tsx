'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { createPhase, activatePhase, deactivatePhase } from '@/actions/phases';
import type { ResolutionPhase } from '@prisma/client';

export interface PhaseManagerProps {
  resolutionId: string;
  currentPhase?: ResolutionPhase | null;
  phases?: ResolutionPhase[];
  onUpdate?: () => void;
}

/**
 * Phase Manager Component
 *
 * Create and manage resolution phases for seasonality support
 * - Define phase name, date range, expected frequency, intensity
 * - Activate/deactivate phases
 * - Visual timeline of phases
 */
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
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        expectedFrequency: formData.expectedFrequency || undefined,
        intensityLevel: formData.intensityLevel,
      });

      if (result.success) {
        // Reset form
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
          <CardTitle>Phases & Seasonality</CardTitle>
          <Button size="sm" onClick={() => setIsCreating(!isCreating)} variant="secondary">
            {isCreating ? 'Cancel' : '+ New Phase'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current phase display */}
        {currentPhase && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-blue-900">Current Phase: {currentPhase.name}</p>
                {currentPhase.description && (
                  <p className="text-sm text-blue-800 mt-1">{currentPhase.description}</p>
                )}
                <div className="flex gap-4 mt-2 text-xs text-blue-700">
                  <span>
                    {new Date(currentPhase.startDate).toLocaleDateString()} -{' '}
                    {currentPhase.endDate ? new Date(currentPhase.endDate).toLocaleDateString() : 'Ongoing'}
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
          <form onSubmit={handleCreatePhase} className="space-y-3 border border-gray-200 rounded-md p-4">
            <Input
              label="Phase Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., French exam prep phase"
              required
            />

            <Textarea
              label="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What makes this phase different?"
              rows={2}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
              <Input
                label="End Date (optional)"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <Input
              label="Expected Frequency (optional)"
              value={formData.expectedFrequency}
              onChange={(e) => setFormData({ ...formData, expectedFrequency: e.target.value })}
              placeholder="e.g., daily, 3x/week"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intensity Level: {formData.intensityLevel}/5
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.intensityLevel}
                onChange={(e) => setFormData({ ...formData, intensityLevel: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Create Phase
            </Button>
          </form>
        )}

        {/* Phase list */}
        {phases.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">All Phases</p>
            <div className="space-y-2">
              {phases.map((phase) => {
                const isActive = currentPhase?.id === phase.id;
                return (
                  <div
                    key={phase.id}
                    className={`border rounded-md p-3 ${
                      isActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{phase.name}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(phase.startDate).toLocaleDateString()} -{' '}
                          {phase.endDate ? new Date(phase.endDate).toLocaleDateString() : 'Ongoing'}
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

        <p className="text-xs text-gray-500 italic">
          Phases help the system adapt expectations to your current reality (e.g., exam prep, vacation,
          normal routine)
        </p>
      </CardContent>
    </Card>
  );
}
