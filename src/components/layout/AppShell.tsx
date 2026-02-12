import Link from 'next/link';
import { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

/**
 * AppShell Component
 *
 * Provides consistent navigation and footer across all pages.
 * Follows Compass principle: quiet, non-judgmental, trustworthy.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-baseline gap-6">
            <Link href="/" className="text-lg font-medium text-neutral-900">
              Compass
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/"
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/journal"
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Journal
              </Link>
              <Link
                href="/resolutions"
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Resolutions
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <p className="text-sm text-neutral-500 text-center">
            Data is yours • <Link href="/settings" className="hover:text-neutral-900">Export anytime</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
