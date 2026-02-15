'use client';

import React, { useState } from 'react';
import { updateSettings } from '@/actions/settings';

interface SystemPreferencesSectionProps {
  initialExperimentalPhases: boolean;
  initialHardMode: boolean;
  initialReflectiveReminders: boolean;
}

export function SystemPreferencesSection({
  initialExperimentalPhases,
  initialHardMode,
  initialReflectiveReminders,
}: SystemPreferencesSectionProps) {
  const [experimentalPhases, setExperimentalPhases] = useState(initialExperimentalPhases);
  const [hardMode, setHardMode] = useState(initialHardMode);
  const [reflectiveReminders, setReflectiveReminders] = useState(initialReflectiveReminders);

  const handleToggle = async (
    setting: 'experimentalPhases' | 'hardMode' | 'reflectiveReminders',
    value: boolean
  ) => {
    // Update local state immediately for responsive UI
    if (setting === 'experimentalPhases') setExperimentalPhases(value);
    if (setting === 'hardMode') setHardMode(value);
    if (setting === 'reflectiveReminders') setReflectiveReminders(value);

    // Save to database
    await updateSettings({ [setting]: value });
  };

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="material-icons text-slate-400 text-xl">settings</span>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          System Preferences
        </h3>
      </div>
      <div className="bg-white border border-slate-200/80 rounded-xl divide-y divide-slate-200/60">
        {/* Experimental Phases */}
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Experimental Phases</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Enable quarterly season-based tracking shifts and momentum decaying.
            </p>
          </div>
          <button
            onClick={() => handleToggle('experimentalPhases', !experimentalPhases)}
            className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${
              experimentalPhases ? 'bg-primary' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${
                experimentalPhases ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Hard Mode */}
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Hard Mode</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Stricter feedback loops. No missed days allowed without a full reflection reset.
            </p>
          </div>
          <button
            onClick={() => handleToggle('hardMode', !hardMode)}
            className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${
              hardMode ? 'bg-primary' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${
                hardMode ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Reflective Reminders */}
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Reflective Reminders</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Receive gentle nudges at 9:00 PM to close your daily loop.
            </p>
          </div>
          <button
            onClick={() => handleToggle('reflectiveReminders', !reflectiveReminders)}
            className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${
              reflectiveReminders ? 'bg-primary' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${
                reflectiveReminders ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
