'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Menu, X } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/journal', label: 'Journal' },
  { href: '/resolutions', label: 'Resolutions' },
  { href: '/review', label: 'Reflections' },
];

export function AppHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Compass className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <span className="text-lg font-medium tracking-tight text-slate-900">Compass</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 -mr-2 rounded-md hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-slate-600" />
            ) : (
              <Menu className="h-5 w-5 text-slate-600" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-20 sm:hidden backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl z-30 sm:hidden">
            <div className="p-4">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="ml-auto flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-4 pt-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-3 text-base rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'bg-slate-100 text-slate-900 font-medium'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
