import Link from 'next/link';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs({
  items,
  locale,
  light = false,
}: {
  items: Array<{ label: string; href?: string }>;
  locale: 'ar' | 'en';
  light?: boolean;
}) {
  return (
    <nav
      aria-label={locale === 'ar' ? 'مسار التنقل' : 'Breadcrumb'}
      className="flex flex-wrap items-center gap-1.5 text-xs"
    >
      <Link
        href="/"
        className={
          light
            ? 'text-brand-100/80 transition hover:text-white'
            : 'text-slate-400 transition hover:text-brand-700 dark:text-slate-500 dark:hover:text-brand-300'
        }
        aria-label={locale === 'ar' ? 'الرئيسية' : 'Home'}
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 ltr:block rtl:hidden" aria-hidden />
          <ChevronLeft className="hidden h-3 w-3 rtl:block" aria-hidden />
          {item.href ? (
            <Link
              href={item.href}
              className={
                light
                  ? 'text-brand-100/80 transition hover:text-white'
                  : 'text-slate-400 transition hover:text-brand-700 dark:text-slate-500 dark:hover:text-brand-300'
              }
            >
              {item.label}
            </Link>
          ) : (
            <span className={light ? 'text-white' : 'font-medium text-slate-600 dark:text-slate-300'}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
