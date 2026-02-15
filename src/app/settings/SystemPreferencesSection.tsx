'use client';

import React, { useState } from 'react';
import { updateSettings } from '@/actions/settings';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';

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
    if (setting === 'experimentalPhases') setExperimentalPhases(value);
    if (setting === 'hardMode') setHardMode(value);
    if (setting === 'reflectiveReminders') setReflectiveReminders(value);

    await updateSettings({ [setting]: value });
  };

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2.5 mb-5">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          System Preferences
        </h3>
      </div>
      <Card>
        <CardContent className="p-0 divide-y">
          {/* Experimental Phases */}
          <div className="p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="experimental-phases" className="text-sm font-semibold cursor-pointer">
                Experimental Phases
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable quarterly season-based tracking shifts and momentum decaying.
              </p>
            </div>
            <Switch
              id="experimental-phases"
              checked={experimentalPhases}
              onCheckedChange={(checked) => handleToggle('experimentalPhases', checked)}
            />
          </div>

          {/* Hard Mode */}
          <div className="p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hard-mode" className="text-sm font-semibold cursor-pointer">
                Hard Mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Stricter feedback loops. No missed days allowed without a full reflection reset.
              </p>
            </div>
            <Switch
              id="hard-mode"
              checked={hardMode}
              onCheckedChange={(checked) => handleToggle('hardMode', checked)}
            />
          </div>

          {/* Reflective Reminders */}
          <div className="p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reflective-reminders" className="text-sm font-semibold cursor-pointer">
                Reflective Reminders
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive gentle nudges at 9:00 PM to close your daily loop.
              </p>
            </div>
            <Switch
              id="reflective-reminders"
              checked={reflectiveReminders}
              onCheckedChange={(checked) => handleToggle('reflectiveReminders', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
