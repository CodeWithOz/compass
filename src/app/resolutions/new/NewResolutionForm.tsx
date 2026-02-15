'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createResolution } from '@/actions/resolutions';
import type { ResolutionType } from '@prisma/client';

export function NewResolutionForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    purpose: '',
    type: 'EXPLORATORY_TRACK' as ResolutionType,
    constraints: '',
    successSignals: '',
    targetDate: '',
    exitCriteria: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await createResolution({
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

      // Navigate to the resolutions list
      router.push('/resolutions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resolution');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/resolutions');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Working name */}
      <div>
        <label htmlFor="name" className="block text-sm text-slate-600 mb-2">
          Working name
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary transition-colors"
          placeholder="Professional visibility"
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Why this matters - LARGEST ELEMENT */}
      <div>
        <label htmlFor="purpose" className="block text-sm text-slate-600 mb-2">
          Why this matters to you
        </label>
        <textarea
          id="purpose"
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          rows={8}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 leading-relaxed focus:outline-none focus:border-primary transition-colors resize-none"
          placeholder="I want to build a public record of the kinds of things I can do and care about. Without this, my work stays invisible and I miss opportunities."
          disabled={isSubmitting}
        />
      </div>

      {/* Type selection - Radio buttons */}
      <div>
        <label className="block text-sm text-slate-600 mb-3">
          What kind of resolution is this?
        </label>
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="MEASURABLE_OUTCOME"
              checked={formData.type === 'MEASURABLE_OUTCOME'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ResolutionType })}
              className="w-4 h-4 text-primary focus:ring-primary"
              disabled={isSubmitting}
            />
            <span className="text-sm text-slate-700">Outcome-oriented</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="HABIT_BUNDLE"
              checked={formData.type === 'HABIT_BUNDLE'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ResolutionType })}
              className="w-4 h-4 text-primary focus:ring-primary"
              disabled={isSubmitting}
            />
            <span className="text-sm text-slate-700">Habit-oriented</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="EXPLORATORY_TRACK"
              checked={formData.type === 'EXPLORATORY_TRACK'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ResolutionType })}
              className="w-4 h-4 text-primary focus:ring-primary"
              disabled={isSubmitting}
            />
            <span className="text-sm text-slate-700">Exploratory</span>
          </label>
        </div>
      </div>

      {/* Constraints */}
      <div>
        <label htmlFor="constraints" className="block text-sm text-slate-600 mb-2">
          Constraints you're working within
        </label>
        <textarea
          id="constraints"
          value={formData.constraints}
          onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 leading-relaxed focus:outline-none focus:border-primary transition-colors resize-none"
          placeholder="French study takes up most weekdays for now. I realistically have 1–2 hours/day until the exam is done."
          disabled={isSubmitting}
        />
      </div>

      {/* Success signals */}
      <div>
        <label htmlFor="successSignals" className="block text-sm text-slate-600 mb-2">
          What would make this feel worthwhile?
        </label>
        <textarea
          id="successSignals"
          value={formData.successSignals}
          onChange={(e) => setFormData({ ...formData, successSignals: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 leading-relaxed focus:outline-none focus:border-primary transition-colors resize-none"
          placeholder="Feeling like I have real material to share and conversations starting because of it."
          disabled={isSubmitting}
        />
      </div>

      {/* Target date - Only for MEASURABLE_OUTCOME */}
      {formData.type === 'MEASURABLE_OUTCOME' && (
        <div>
          <label htmlFor="targetDate" className="block text-sm text-slate-600 mb-2">
            Target date <span className="text-red-500">*</span>
          </label>
          <input
            id="targetDate"
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-primary transition-colors"
            required={formData.type === 'MEASURABLE_OUTCOME'}
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-slate-500">
            When do you aim to achieve this outcome?
          </p>
        </div>
      )}

      {/* Exit criteria - Optional for EXPLORATORY_TRACK */}
      {formData.type === 'EXPLORATORY_TRACK' && (
        <div>
          <label htmlFor="exitCriteria" className="block text-sm text-slate-600 mb-2">
            Exit criteria (optional)
          </label>
          <textarea
            id="exitCriteria"
            value={formData.exitCriteria}
            onChange={(e) => setFormData({ ...formData, exitCriteria: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 leading-relaxed focus:outline-none focus:border-primary transition-colors resize-none"
            placeholder="How will you know when it's time to move on from this exploration?"
            disabled={isSubmitting}
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !formData.name.trim()}
          className="flex-1 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Begin this resolution'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="sm:flex-none px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
