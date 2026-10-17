import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { Tone } from '@/lib/display';
import { dotClasses, toneClasses } from '@/lib/display';

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  className,
  title,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none',
        toneClasses[tone],
        className,
      )}
    >
      {dot ? <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[tone])} /> : null}
      {children}
    </span>
  );
}

export function Pill({
  children,
  className,
  tone = 'neutral',
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
