'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Zap, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import AttractButton from '@/components/mvpblocks/attract-button';

// ─── Nav links ────────────────────────────────────────────────────────────────



const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Impact', href: '#workflow' },
  { label: 'Verification', href: '#security' },
  { label: 'FAQ', href: '#faq' },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Slightly deepen the shadow as the user scrolls so the navbar "lifts"
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    // Outer positioning wrapper – keeps the bar floating, never full-bleed
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:px-6">
      <nav
        aria-label="Main navigation"
        className={cn(
          // Floating card shell
          'w-full max-w-5xl rounded-2xl border border-surface-border',
          'bg-surface backdrop-blur-xl',
          'px-4 py-2.5 sm:px-6',
          'flex items-center justify-between gap-4',
          'transition-shadow duration-300',
          scrolled
            ? 'shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
            : 'shadow-[0_4px_16px_rgba(0,0,0,0.2)]',
        )}
      >
        {/* ── LEFT: Branding (Clicking redirects to page top) ──────────────── */}
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-3 shrink-0 group"
          aria-label="Niramoy AI – back to top"
        >
          {/* Brand bolt container */}
          <span
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl',
              'bg-brand-primary/10 ring-1 ring-brand-primary/20',
              'group-hover:bg-brand-primary/20 group-hover:ring-brand-primary/40',
              'transition-all duration-200',
            )}
          >
            <img width="64" height="64" src="https://img.icons8.com/nolan/64/cursor-ai.png" alt="cursor-ai" />
          </span>

          {/* Text stack */}
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight text-text-main group-hover:text-brand-primary transition-colors duration-150">
              ClassMind AI
            </span>
            <span className="text-[9px] font-medium tracking-[0.14em] text-text-main/60 uppercase">
              AI-Powered Classroom Platform
            </span>
          </span>
        </Link>

        {/* ── CENTER: Nav links (desktop) ──────────────────────────────────── */}
        <ul
          role="list"
          className="hidden md:flex items-center gap-1"
        >
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}>
              <Link
                href={href}
                className={cn(
                  'relative px-3.5 py-1.5 text-sm font-medium rounded-lg',
                  'text-text-main/70 hover:text-text-main',
                  'hover:bg-surface',
                  'transition-colors duration-150',
                  // Animated underline
                  'after:absolute after:bottom-0.5 after:left-3.5 after:right-3.5',
                  'after:h-px after:rounded-full after:bg-brand-primary',
                  'after:scale-x-0 after:origin-left',
                  'after:transition-transform after:duration-200',
                  'hover:after:scale-x-100',
                )}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* ── RIGHT: CTA + mobile toggle ───────────────────────────────────── */}
        <div className="flex items-center gap-2 shrink-0">
          {/* AttractButton – desktop only (Redirects to /login) */}
          <Link href="/login" className="hidden sm:block">
            <AttractButton
              particleCount={17}
              attractRadius={48}
              className={cn(
                '!bg-brand-primary hover:!bg-brand-primary/90 !text-bg-main font-black',
                '!border-brand-primary/40 !min-w-36',
                '[--primary:var(--color-brand-primary)]',
              )}
            >
              Portal Login →
            </AttractButton>
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className={cn(
              'md:hidden flex h-9 w-9 items-center justify-center rounded-xl',
              'border border-surface-border bg-surface',
              'text-text-main/70 hover:text-text-main hover:bg-surface',
              'transition-colors duration-150',
            )}
          >
            {mobileOpen
              ? <X className="h-4 w-4" aria-hidden="true" />
              : <Menu className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {/* ── MOBILE dropdown ─────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-label="Mobile navigation"
          className={cn(
            'absolute inset-x-4 top-[calc(100%+8px)]',
            'rounded-2xl border border-surface-border',
            'bg-surface backdrop-blur-xl',
            'shadow-[0_16px_48px_rgba(0,0,0,0.4)]',
            'py-3 px-2',
          )}
        >
          <ul role="list" className="flex flex-col gap-0.5">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'block w-full rounded-xl px-4 py-2.5',
                    'text-sm font-medium text-white/60 hover:text-white',
                    'hover:bg-white/[0.04]',
                    'transition-colors duration-150',
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}

            {/* Mobile CTA (Redirects to /login) */}
            <li className="mt-1 px-2 pb-1">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block w-full">
                <AttractButton
                  particleCount={17}
                  attractRadius={48}
                  className={cn(
                    'w-full justify-center font-black',
                    '!bg-brand-primary hover:!bg-brand-primary/90 !text-dark-bg-main',
                    '!border-brand-primary/40',
                    '[--primary:var(--color-brand-primary)]',
                  )}
                >
                  Portal Login →
                </AttractButton>
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default Navbar;
