'use client';

import { useState, useTransition } from 'react';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LocaleSwitch({
  locale,
  className,
}: {
  locale: 'ar' | 'en';
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const next = locale === 'ar' ? 'en' : 'ar';

  function switchLocale() {
    setLoading(true);
    startTransition(async () => {
      try {
        await fetch('/api/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale: next }),
        });
      } catch {
        // Refresh anyway; the default locale remains usable.
      }
      window.location.reload();
    });
  }

  return (
    <button
      type="button"
      onClick={switchLocale}
      disabled={loading || pending}
      aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      title={locale === 'ar' ? 'English' : 'العربية'}
      className={cn(
        'inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-ink disabled:opacity-60 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white',
        className,
      )}
    >
      <Languages className="h-[16px] w-[16px]" aria-hidden />
      <span className="num">{locale === 'ar' ? 'EN' : 'ع'}</span>
    </button>
  );
}
