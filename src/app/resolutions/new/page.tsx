import React from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { NewResolutionForm } from './NewResolutionForm';

export default function NewResolutionPage() {
  return (
    <>
      <AppHeader />

      <main className="max-w-xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-slate-900 mb-2">
            New Resolution
          </h1>
          <p className="text-slate-500 leading-relaxed">
            This is a direction you intend to take seriously — not a promise to perform.
          </p>
        </div>

        <NewResolutionForm />
      </main>
    </>
  );
}
