import type { Locale, TripResult } from '@/types/rail';
import { TRAIN_CLASS_MAP } from '@/lib/data/train-classes';
import { featureLabel, formatFareRange } from '@/lib/display';
import { TrainClassIcon } from '@/components/ui/TrainClassIcon';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export function FareTable({ trip, locale }: { trip: TripResult; locale: Locale }) {
  const ar = locale === 'ar';
  const lowest = trip.fares.length ? Math.min(...trip.fares.map((fare) => fare.min)) : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
      <div className="hidden grid-cols-[1.4fr_1fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:grid dark:border-white/10 dark:bg-white/[0.03]">
        <span>{ar ? 'الدرجة' : 'Class'}</span>
        <span>{ar ? 'المزايا' : 'Included'}</span>
        <span className="text-end">{ar ? 'السعر التقديري' : 'Est. fare'}</span>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-white/5">
        {trip.fares.map((fare) => {
          const trainClass = TRAIN_CLASS_MAP[fare.classId];
          const isLowest = fare.min === lowest;
          return (
            <li
              key={fare.classId}
              className={cn(
                'grid gap-2 px-4 py-3.5 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center sm:gap-4',
                isLowest && 'bg-brand-50/40 dark:bg-brand-500/[0.06]',
              )}
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-white/5">
                  <TrainClassIcon classId={fare.classId} size={18} />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-bold text-ink dark:text-white">
                      {ar ? trainClass.nameAr : trainClass.nameEn}
                    </span>
                    {isLowest ? (
                      <Badge tone="brand" className="py-0.5 text-[9px]">
                        {ar ? 'الأقل سعرًا' : 'Lowest'}
                      </Badge>
                    ) : null}
                    {trainClass.hasAC ? (
                      <span className="text-[9px] font-semibold text-slate-400">AC</span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                    {ar ? trainClass.descriptionAr : trainClass.descriptionEn}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 ps-10 sm:ps-0">
                {trip.features.slice(0, 4).map((feature) => (
                  <span
                    key={feature}
                    className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 dark:bg-white/5 dark:text-slate-400"
                  >
                    {featureLabel(locale, feature)}
                  </span>
                ))}
              </div>
              <div className="ps-10 text-start sm:ps-0 sm:text-end">
                <span className="num text-sm font-bold text-ink dark:text-white">
                  {formatFareRange(fare.min, fare.max, locale)}
                </span>
                <p className="text-[9px] text-slate-400">{ar ? 'يُرجى التأكيد عند الحجز' : 'confirm at booking'}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
