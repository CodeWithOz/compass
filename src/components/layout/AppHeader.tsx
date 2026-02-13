import React from 'react';
import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Logo and Name */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <span className="material-icons text-white text-2xl">explore</span>
          </div>
          <span className="text-xl font-bold text-slate-900">Compass</span>
        </Link>

        {/* Right: Navigation Links */}
        <nav className="flex items-center gap-8">
          <Link
            href="/review"
            className="text-base text-slate-600 hover:text-slate-900 transition-colors font-medium"
          >
            History
          </Link>
          <Link
            href="/settings"
            className="text-base text-slate-600 hover:text-slate-900 transition-colors font-medium"
          >
            Settings
          </Link>
          <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
            <span className="material-icons text-primary text-xl">person</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
