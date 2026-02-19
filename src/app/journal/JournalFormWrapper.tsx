'use client';

import { useRouter } from 'next/navigation';
import { JournalEntryForm } from '@/components/features/JournalEntryForm';
import type { AIProvider } from '@/lib/ai/providers';

interface JournalFormWrapperProps {
  linkedResolutionIds: string[];
  provider?: AIProvider;
}

/**
 * Client wrapper for JournalEntryForm
 * Handles page refresh after successful submission
 */
export function JournalFormWrapper({
  linkedResolutionIds,
  provider,
}: JournalFormWrapperProps) {
  const router = useRouter();

  const handleSuccess = () => {
    // Refresh server component data to show new entry
    router.refresh();
  };

  return (
    <JournalEntryForm
      linkedResolutionIds={linkedResolutionIds}
      provider={provider}
      onSuccess={handleSuccess}
    />
  );
}
