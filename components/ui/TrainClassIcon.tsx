import { BedDouble, Star, Snowflake } from 'lucide-react';
import type { TrainClassId } from '@/types/rail';
import { TRAIN_CLASS_MAP } from '@/lib/data/train-classes';
import { cn } from '@/lib/utils';

const iconTone: Record<string, string> = {
  gold: 'text-amber-600 dark:text-amber-400',
  violet: 'text-violet-600 dark:text-violet-400',
  blue: 'text-brand-600 dark:text-brand-300',
  teal: 'text-teal-600 dark:text-teal-400',
  slate: 'text-slate-500 dark:text-slate-400',
};

export function TrainClassIcon({
  classId,
  size = 18,
  className,
}: {
  classId: TrainClassId;
  size?: number;
  className?: string;
}) {
  const trainClass = TRAIN_CLASS_MAP[classId];
  const tone = iconTone[trainClass.tone] ?? iconTone.slate;
  if (classId === 'sleeping') {
    return <BedDouble className={cn(tone, className)} style={{ width: size, height: size }} aria-hidden />;
  }
  return (
    <span className={cn('relative inline-flex shrink-0', tone, className)} aria-hidden>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M7.5 4.5h9A2.5 2.5 0 0 1 19 7v7.5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V7a2.5 2.5 0 0 1 2.5-2.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path d="M7 17.5 5.8 20M17 17.5 18.2 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="12" cy="9" r="1.25" fill="currentColor" />
        {trainClass.tone === 'gold' ? (
          <Star className="absolute -end-1 -top-1 h-2.5 w-2.5 fill-amber-400 text-amber-500" />
        ) : null}
        {trainClass.hasAC && trainClass.tone !== 'gold' ? (
          <Snowflake className="absolute -end-1 -top-1 h-2.5 w-2.5 opacity-80" />
        ) : null}
      </svg>
    </span>
  );
}

export function TrainClassChip({
  classId,
  locale,
  fare,
  active = false,
  onClick,
}: {
  classId: TrainClassId;
  locale: 'ar' | 'en';
  fare?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const trainClass = TRAIN_CLASS_MAP[classId];
  const label = locale === 'ar' ? trainClass.shortAr : trainClass.shortEn;
  const Comp = onClick ? 'button' : 'span';
  return (
    <Comp
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold transition',
        active
          ? 'border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-500/15 dark:text-brand-200'
          : 'border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
        onClick && 'hover:border-brand-300',
      )}
    >
      <TrainClassIcon classId={classId} size={15} />
      <span>{label}</span>
      {fare ? <span className="num text-[10px] font-medium text-slate-400">{fare}</span> : null}
    </Comp>
  );
}
