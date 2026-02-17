'use client';

import React, { useState } from 'react';
import { updateSettings } from '@/actions/settings';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, Eye, EyeOff, Loader2 } from 'lucide-react';
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
    } catch {
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
        <Brain className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          AI Configuration
        </h3>
      </div>
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Primary Model */}
          <div className="space-y-2">
            <Label htmlFor="ai-model">Primary Model</Label>
            <select
              id="ai-model"
              value={provider}
              onChange={(e) => setProvider(e.target.value as AIProviderType)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            >
              <option value="CLAUDE">Claude Sonnet 4.5 (Recommended)</option>
              <option value="OPENAI">GPT-5.2</option>
              <option value="GEMINI">Gemini 3 Pro</option>
            </select>
          </div>

          {/* API Keys */}
          <div className="space-y-4">
            <ApiKeyField
              id="anthropic-key"
              label="Anthropic API Key"
              placeholder="sk-ant-..."
              value={anthropicKey}
              onChange={setAnthropicKey}
              visible={showKeys}
              onToggleVisibility={() => setShowKeys(!showKeys)}
            />

            <ApiKeyField
              id="openai-key"
              label="OpenAI API Key"
              placeholder="sk-..."
              value={openaiKey}
              onChange={setOpenaiKey}
              visible={showKeys}
              onToggleVisibility={() => setShowKeys(!showKeys)}
            />

            <ApiKeyField
              id="gemini-key"
              label="Google AI API Key"
              placeholder="AIza..."
              value={geminiKey}
              onChange={setGeminiKey}
              visible={showKeys}
              onToggleVisibility={() => setShowKeys(!showKeys)}
            />

            <p className="text-xs text-muted-foreground">
              API keys are stored locally and used for journal analysis. You only need to provide a key for your selected provider.
            </p>
          </div>

          {/* Save Button */}
          {hasChanges && (
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={isSaving} size="sm">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              {saveMessage && (
                <p className={`text-sm ${saveMessage.includes('success') ? 'text-green-600' : 'text-destructive'}`}>
                  {saveMessage}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function ApiKeyField({
  id,
  label,
  placeholder,
  value,
  onChange,
  visible,
  onToggleVisibility,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleVisibility}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
