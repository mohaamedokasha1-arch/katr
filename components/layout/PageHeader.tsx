import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { cn } from '@/lib/utils';

export function PageHeader({
  locale,
  eyebrow,
  title,
  description,
  breadcrumbs,
  children,
  tone = 'light',
  accentColor,
  meta,
}: {
  locale: 'ar' | 'en';
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  children?: ReactNode;
  tone?: 'light' | 'dark';
  accentColor?: string;
  meta?: ReactNode;
}) {
  const dark = tone === 'dark';
  return (
    <section
      className={cn(
        'relative overflow-hidden border-b',
        dark
          ? 'border-white/10 bg-[#051838] text-white'
          : 'border-slate-200/80 bg-white dark:border-white/10 dark:bg-night-800',
      )}
    >
      {dark ? (
        <>
          <div className="pointer-events-none absolute inset-0 hero-glow opacity-80" aria-hidden />
          <div className="pointer-events-none absolute inset-0 hero-grid opacity-40" aria-hidden />
        </>
      ) : (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-[0.35] dark:opacity-[0.5]"
          style={{
            background: accentColor
              ? `linear-gradient(to bottom, ${accentColor}14, transparent)`
              : 'linear-gradient(to bottom, rgba(21,101,192,0.07), transparent)',
          }}
          aria-hidden
        />
      )}
      <div className="page-shell relative py-6 sm:py-8">
        <Breadcrumbs items={breadcrumbs} locale={locale} light={dark} />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className={cn('eyebrow mb-1.5', dark && 'text-brand-300')}>{eyebrow}</p>
            ) : null}
            <h1
              className={cn(
                'text-2xl font-bold tracking-tight sm:text-3xl',
                dark ? 'text-white' : 'text-ink dark:text-white',
              )}
            >
              {title}
            </h1>
            {description ? (
              <p
                className={cn(
                  'mt-2 text-sm leading-7',
                  dark ? 'text-brand-100/75' : 'text-slate-500 dark:text-slate-400',
                )}
              >
                {description}
              </p>
            ) : null}
            {meta ? (
              <div
                className={cn(
                  'mt-3 flex flex-wrap items-center gap-2',
                  dark ? 'text-brand-200/80' : 'text-slate-500 dark:text-slate-400',
                )}
              >
                {meta}
              </div>
            ) : null}
          </div>
          {children ? <div className="shrink-0">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
