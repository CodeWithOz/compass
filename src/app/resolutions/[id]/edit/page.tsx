import React from 'react';
import { notFound } from 'next/navigation';
import { getResolution } from '@/actions/resolutions';
import { AppHeader } from '@/components/layout/AppHeader';
import { EditResolutionForm } from './EditResolutionForm';

export default async function EditResolutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resolutionResult = await getResolution(id);

  if (!resolutionResult.success || !resolutionResult.data) {
    notFound();
  }

  const resolution = resolutionResult.data;

  return (
    <>
      <AppHeader />

      <main className="max-w-xl mx-auto px-6 py-8 pb-20">
        <div className="mb-8">
          <h1 className="text-2xl font-medium tracking-tight mb-2">
            Edit Resolution
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Update the details of your resolution as it evolves.
          </p>
        </div>

        <EditResolutionForm resolution={resolution} />
      </main>
    </>
  );
}
