import React from 'react';
import Link from 'next/link';
import { ExportDataButton } from './ExportDataButton';

export default async function SettingsPage() {
  return (
    <>
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-slate-500 hover:text-slate-700 transition-colors">
              <span className="material-icons text-xl">arrow_back</span>
            </Link>
            <h1 className="text-base font-semibold text-slate-800">Settings</h1>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 uppercase tracking-wider">System Status:</span>
            <span className="text-green-600 font-semibold uppercase tracking-wider">Nominal</span>
          </div>
        </div>
      </nav>

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

        {/* AI Configuration */}
        <section className="mb-12">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="material-icons text-slate-400 text-xl">psychology</span>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              AI Configuration
            </h3>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="sk-..."
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-colors"
                  disabled
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <span className="material-icons text-lg">visibility</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Used for honest feedback generation and semantic analysis of reflections.
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Primary Model
              </label>
              <div className="flex items-center gap-3">
                <select className="px-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:border-primary outline-none transition-colors">
                  <option>GPT-4o (Recommended)</option>
                  <option>Claude 3.5 Sonnet</option>
                  <option>Claude 3 Opus</option>
                </select>
                <button className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:border-slate-400 transition-colors flex items-center gap-1.5">
                  <span className="material-icons text-sm">refresh</span>
                  Test Connection
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* System Preferences */}
        <section className="mb-12">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="material-icons text-slate-400 text-xl">settings</span>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              System Preferences
            </h3>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl divide-y divide-slate-200/60">
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Experimental Phases</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enable quarterly season-based tracking shifts and momentum decaying.
                </p>
              </div>
              <div className="w-11 h-6 bg-primary rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
              </div>
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Hard Mode</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stricter feedback loops. No missed days allowed without a full reflection reset.
                </p>
              </div>
              <div className="w-11 h-6 bg-slate-300 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm" />
              </div>
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Reflective Reminders</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Receive gentle nudges at 9:00 PM to close your daily loop.
                </p>
              </div>
              <div className="w-11 h-6 bg-primary rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
              </div>
            </div>
          </div>
        </section>

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
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
              <span className="material-icons text-white text-sm">explore</span>
            </div>
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
