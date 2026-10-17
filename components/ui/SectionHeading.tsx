import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  locale = 'ar',
  className,
  align = 'start',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  locale?: 'ar' | 'en';
  className?: string;
  align?: 'start' | 'center';
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px] dark:text-white">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-7 text-slate-500 sm:text-[15px] dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-700 transition hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
        >
          {action.label}
          {locale === 'ar' ? (
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          ) : (
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          )}
        </Link>
      ) : null}
    </div>
  );
}

export function StatBlock({
  value,
  label,
  hint,
  className,
}: {
  value: ReactNode;
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="display-num text-2xl font-semibold text-ink dark:text-white">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-slate-400">{hint}</div> : null}
    </div>
  );
}
