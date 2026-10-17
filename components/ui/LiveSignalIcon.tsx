import { cn } from '@/lib/utils';

/**
 * Rakeb's satellite glyph. Used wherever a value is refreshed from the live
 * layer rather than the printed timetable: the board, ticker and refreshers.
 */
export function LiveSignalIcon({
  className,
  animated = true,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('h-4 w-4', className)}
    >
      <path
        d="M9.2 5.4 5.4 9.2a1.6 1.6 0 0 0 0 2.3l7.1 7.1a1.6 1.6 0 0 0 2.3 0l3.8-3.8a1.6 1.6 0 0 0 0-2.3L11.5 5.4a1.6 1.6 0 0 0-2.3 0Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="1.9" fill="currentColor" />
      <path
        d="M15.8 8.2 18 6M6 18l2.2-2.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M17.5 4.2a5.6 5.6 0 0 1 2.3 2.3M18.6 1.8a8.9 8.9 0 0 1 3.6 3.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        className={animated ? 'animate-pulse-soft' : undefined}
        opacity="0.65"
      />
    </svg>
  );
}
