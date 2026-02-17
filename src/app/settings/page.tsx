import React from 'react';
import { Compass } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ExportDataButton } from './ExportDataButton';
import { AIConfigSection } from './AIConfigSection';
import { getSettings } from '@/actions/settings';
import { FolderOpen, AlertTriangle } from 'lucide-react';

export default async function SettingsPage() {
  const { data: settings } = await getSettings();

  return (
    <>
      <AppHeader />

      <main className="max-w-3xl mx-auto px-6 py-10 pb-10">
        {/* Title */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Compass Configuration</h2>
          <p className="text-muted-foreground leading-relaxed">
            Manage your personal data and AI integrations.
            All data is processed locally where possible.
          </p>
        </div>

        {/* Data Management */}
        <section className="mb-12">
          <div className="flex items-center gap-2.5 mb-5">
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Data Management
            </h3>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export your momentum</CardTitle>
              <CardDescription>
                Download all your resolutions, reflections, and tracking logs in a machine-readable format.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <ExportDataButton format="csv" />
                <ExportDataButton format="json" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* AI Configuration */}
        {settings && (
          <AIConfigSection
            initialProvider={settings.aiProvider}
            initialAnthropicKey={settings.anthropicApiKey}
            initialOpenaiKey={settings.openaiApiKey}
            initialGeminiKey={settings.geminiApiKey}
          />
        )}

        {/* Danger Zone */}
        <section className="mb-8">
          <Separator className="mb-8" />
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="text-xs font-semibold text-destructive uppercase tracking-widest">
              Danger Zone
            </h3>
          </div>
          <Card className="border-destructive/20">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Purge All System Data</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently delete your entire history. This action cannot be undone.
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Delete Data
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="text-center pt-4 pb-6">
          <Separator className="mb-6" />
          <div className="flex items-center justify-center gap-2 mb-2">
            <Compass className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Compass v1.0.0
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Designed for honest momentum.
          </p>
        </footer>
      </main>
    </>
  );
}
