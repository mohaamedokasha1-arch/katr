'use client';

import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle({
  locale,
  className,
}: {
  locale: 'ar' | 'en';
  className?: string;
}) {
  function toggle() {
    const root = document.documentElement;
    const next = root.classList.contains('dark') ? 'light' : 'dark';
    root.classList.toggle('dark', next === 'dark');
    try {
      window.localStorage.setItem('rakeb-theme', next);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={locale === 'ar' ? 'تبديل الوضع الليلي' : 'Toggle dark mode'}
      title={locale === 'ar' ? 'الوضع الليلي / النهاري' : 'Dark / light mode'}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-ink dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white',
        className,
      )}
    >
      <Sun className="hidden h-[18px] w-[18px] dark:block" aria-hidden />
      <Moon className="h-[18px] w-[18px] dark:hidden" aria-hidden />
    </button>
  );
}
