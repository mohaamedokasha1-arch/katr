import Link from 'next/link';
import { cn } from '@/lib/utils';

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Rakeb"
      className={cn('h-9 w-9 shrink-0', className)}
    >
      <rect width="64" height="64" rx="15" fill="#0B3D91" />
      <path
        d="M13.5 46.5h6.2c6.4 0 6.4-12.8 13.2-12.8h4.6c6.1 0 6.1-11.2 13.1-11.2"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4.6"
        strokeLinecap="round"
      />
      <circle cx="13.5" cy="46.5" r="4" fill="#FFFFFF" />
      <circle cx="33.3" cy="33.7" r="3.1" fill="#FFFFFF" />
      <circle cx="50.6" cy="22.5" r="5.4" fill="#F4511E" stroke="#FFFFFF" strokeWidth="2.6" />
    </svg>
  );
}

export function Brand({
  locale,
  light = false,
  compact = false,
}: {
  locale: 'ar' | 'en';
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label={locale === 'ar' ? 'راكب — الصفحة الرئيسية' : 'Rakeb — home'}
      className="group inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-none"
    >
      <BrandMark className="h-9 w-9 transition-transform duration-200 group-hover:-rotate-3" />
      {compact ? null : (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'text-[22px] font-bold tracking-tight',
              light ? 'text-white' : 'text-ink dark:text-white',
            )}
          >
            راكب
          </span>
          <span
            className={cn(
              'num mt-1 text-[9px] font-medium tracking-[0.34em]',
              light ? 'text-brand-200/80' : 'text-slate-400 dark:text-slate-500',
            )}
          >
            RAKEB
          </span>
        </span>
      )}
    </Link>
  );
}
