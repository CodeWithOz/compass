import React from 'react';
import { Compass } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { ExportDataButton } from './ExportDataButton';
import { AIConfigSection } from './AIConfigSection';
import { SystemPreferencesSection } from './SystemPreferencesSection';
import { getSettings } from '@/actions/settings';

export default async function SettingsPage() {
  // Load user settings
  const { data: settings } = await getSettings();

  return (
    <>
      <AppHeader />

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Compass Configuration</h2>
          <p className="text-slate-500 leading-relaxed">
            Manage your personal data, AI integrations, and system-wide tracking preferences.
            All data is processed locally where possible.
          </p>
        </div>

        {/* Data Management */}
        <section className="mb-12">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="material-icons text-slate-400 text-xl">folder_open</span>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Data Management
            </h3>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-6">
            <h4 className="text-base font-semibold text-slate-800 mb-1">Export your momentum</h4>
            <p className="text-sm text-slate-500 mb-4">
              Download all your resolutions, reflections, and tracking logs in a machine-readable format.
            </p>
            <div className="flex items-center gap-3">
              <ExportDataButton />
              <button className="px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors">
                Export as JSON
              </button>
            </div>
          </div>
        </section>

        {/* AI Configuration - Now Interactive */}
        {settings && (
          <AIConfigSection
            initialProvider={settings.aiProvider}
            initialAnthropicKey={settings.anthropicApiKey}
            initialOpenaiKey={settings.openaiApiKey}
            initialGeminiKey={settings.geminiApiKey}
          />
        )}

        {/* System Preferences - Now Interactive */}
        {settings && (
          <SystemPreferencesSection
            initialExperimentalPhases={settings.experimentalPhases}
            initialHardMode={settings.hardMode}
            initialReflectiveReminders={settings.reflectiveReminders}
          />
        )}

        {/* Danger Zone */}
        <section className="mb-12">
          <div className="border-t border-slate-200/60 pt-8">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-icons text-red-500 text-xl">warning</span>
              <h3 className="text-xs font-semibold text-red-500 uppercase tracking-widest">
                Danger Zone
              </h3>
            </div>
            <div className="bg-red-50/50 border border-red-200/40 rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-red-700">Purge All System Data</p>
                <p className="text-xs text-red-500/80 mt-0.5">
                  Permanently delete your entire history. This action cannot be undone.
                </p>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
                Delete Data
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-slate-200/60">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Compass className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
            Compass v1.0.0
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Designed for honest momentum. Locally stored, globally focused.
          </p>
        </footer>
      </main>
    </>
  );
}
