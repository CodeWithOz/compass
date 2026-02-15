'use client';

import React, { useState, useEffect } from 'react';
import { updateSettings } from '@/actions/settings';
import type { AIProviderType } from '@prisma/client';

interface AIConfigSectionProps {
  initialProvider: AIProviderType;
  initialAnthropicKey?: string | null;
  initialOpenaiKey?: string | null;
  initialGeminiKey?: string | null;
}

export function AIConfigSection({
  initialProvider,
  initialAnthropicKey,
  initialOpenaiKey,
  initialGeminiKey,
}: AIConfigSectionProps) {
  const [provider, setProvider] = useState<AIProviderType>(initialProvider);
  const [anthropicKey, setAnthropicKey] = useState(initialAnthropicKey || '');
  const [openaiKey, setOpenaiKey] = useState(initialOpenaiKey || '');
  const [geminiKey, setGeminiKey] = useState(initialGeminiKey || '');
  const [showKeys, setShowKeys] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const result = await updateSettings({
        aiProvider: provider,
        anthropicApiKey: anthropicKey || undefined,
        openaiApiKey: openaiKey || undefined,
        geminiApiKey: geminiKey || undefined,
      });

      if (result.success) {
        setSaveMessage('Settings saved successfully');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage(result.error || 'Failed to save settings');
      }
    } catch (error) {
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    provider !== initialProvider ||
    anthropicKey !== (initialAnthropicKey || '') ||
    openaiKey !== (initialOpenaiKey || '') ||
    geminiKey !== (initialGeminiKey || '');

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="material-icons text-slate-400 text-xl">psychology</span>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          AI Configuration
        </h3>
      </div>
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 space-y-6">
        {/* Primary Model */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            Primary Model
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as AIProviderType)}
            className="px-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:border-primary outline-none transition-colors"
          >
            <option value="CLAUDE">Claude Sonnet 4.5 (Recommended)</option>
            <option value="OPENAI">GPT-5.2</option>
            <option value="GEMINI">Gemini 3 Pro</option>
          </select>
        </div>

        {/* API Keys */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Anthropic API Key
            </label>
            <div className="relative">
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="sk-ant-..."
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKeys(!showKeys)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-icons text-lg">
                  {showKeys ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              OpenAI API Key
            </label>
            <input
              type={showKeys ? 'text' : 'password'}
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Google AI API Key
            </label>
            <input
              type={showKeys ? 'text' : 'password'}
              placeholder="AIza..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-colors"
            />
          </div>

          <p className="text-xs text-slate-400">
            API keys are stored locally and used for journal analysis. You only need to provide a key for your selected provider.
          </p>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            {saveMessage && (
              <p className={`text-sm ${saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {saveMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
