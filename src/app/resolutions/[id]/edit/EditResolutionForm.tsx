'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateResolution } from '@/actions/resolutions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import type { ResolutionType } from '@prisma/client';

interface Resolution {
  id: string;
  name: string;
  type: ResolutionType;
  purpose: string | null;
  constraints: string | null;
  successSignals: string | null;
  targetDate: Date | null;
  exitCriteria: string | null;
}

interface EditResolutionFormProps {
  resolution: Resolution;
}

export function EditResolutionForm({ resolution }: EditResolutionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: resolution.name,
    purpose: resolution.purpose || '',
    type: resolution.type,
    constraints: resolution.constraints || '',
    successSignals: resolution.successSignals || '',
    targetDate: (() => {
      if (!resolution.targetDate) return '';
      const d = new Date(resolution.targetDate);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })(),
    exitCriteria: resolution.exitCriteria || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await updateResolution({
        id: resolution.id,
        name: formData.name,
        purpose: formData.purpose || undefined,
        type: formData.type,
        constraints: formData.constraints || undefined,
        successSignals: formData.successSignals || undefined,
        targetDate: formData.targetDate ? new Date(formData.targetDate) : undefined,
        exitCriteria: formData.exitCriteria || undefined,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      router.push(`/resolutions/${resolution.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update resolution');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/resolutions/${resolution.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Working name */}
      <div className="space-y-2">
        <Label htmlFor="name">Working name</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Professional visibility"
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Why this matters */}
      <div className="space-y-2">
        <Label htmlFor="purpose">Why this matters to you</Label>
        <Textarea
          id="purpose"
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          rows={8}
          className="leading-relaxed resize-none"
          placeholder="I want to build a public record of the kinds of things I can do and care about."
          disabled={isSubmitting}
        />
      </div>

      {/* Type selection */}
      <div className="space-y-3">
        <Label>What kind of resolution is this?</Label>
        <RadioGroup
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value as ResolutionType })}
          disabled={isSubmitting}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="MEASURABLE_OUTCOME" id="edit-type-outcome" />
            <Label htmlFor="edit-type-outcome" className="font-normal cursor-pointer">Outcome-oriented</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="HABIT_BUNDLE" id="edit-type-habit" />
            <Label htmlFor="edit-type-habit" className="font-normal cursor-pointer">Habit-oriented</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="EXPLORATORY_TRACK" id="edit-type-explore" />
            <Label htmlFor="edit-type-explore" className="font-normal cursor-pointer">Exploratory</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Constraints */}
      <div className="space-y-2">
        <Label htmlFor="constraints">Constraints you&apos;re working within</Label>
        <Textarea
          id="constraints"
          value={formData.constraints}
          onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
          rows={4}
          className="leading-relaxed resize-none"
          placeholder="French study takes up most weekdays for now."
          disabled={isSubmitting}
        />
      </div>

      {/* Success signals */}
      <div className="space-y-2">
        <Label htmlFor="successSignals">What would make this feel worthwhile?</Label>
        <Textarea
          id="successSignals"
          value={formData.successSignals}
          onChange={(e) => setFormData({ ...formData, successSignals: e.target.value })}
          rows={4}
          className="leading-relaxed resize-none"
          placeholder="Feeling like I have real material to share."
          disabled={isSubmitting}
        />
      </div>

      {/* Target date */}
      {formData.type === 'MEASURABLE_OUTCOME' && (
        <div className="space-y-2">
          <Label htmlFor="targetDate">
            Target date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="targetDate"
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            required={formData.type === 'MEASURABLE_OUTCOME'}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            When do you aim to achieve this outcome?
          </p>
        </div>
      )}

      {/* Exit criteria */}
      {formData.type === 'EXPLORATORY_TRACK' && (
        <div className="space-y-2">
          <Label htmlFor="exitCriteria">Exit criteria (optional)</Label>
          <Textarea
            id="exitCriteria"
            value={formData.exitCriteria}
            onChange={(e) => setFormData({ ...formData, exitCriteria: e.target.value })}
            rows={3}
            className="leading-relaxed resize-none"
            placeholder="How will you know when it's time to move on from this exploration?"
            disabled={isSubmitting}
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || !formData.name.trim()}
          className="flex-1"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save changes'
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          disabled={isSubmitting}
          size="lg"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
