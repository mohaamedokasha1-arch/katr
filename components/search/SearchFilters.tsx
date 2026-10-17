'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { Locale, TrainClassId } from '@/types/rail';
import { TRAIN_CLASSES } from '@/lib/data/train-classes';
import { TrainClassIcon } from '@/components/ui/TrainClassIcon';
import { cn } from '@/lib/utils';

const SORTS: Array<{ value: string; ar: string; en: string }> = [
  { value: 'departure', ar: 'وقت التحرك', en: 'Departure' },
  { value: 'arrival', ar: 'وقت الوصول', en: 'Arrival' },
  { value: 'duration', ar: 'مدة الرحلة', en: 'Duration' },
  { value: 'price', ar: 'الأقل سعرًا', en: 'Price' },
];

const PRICE_CAPS = [
  { value: '', ar: 'أي سعر', en: 'Any fare' },
  { value: '150', ar: 'حتى ١٥٠ ج.م', en: 'up to 150 EGP' },
  { value: '250', ar: 'حتى ٢٥٠ ج.م', en: 'up to 250 EGP' },
  { value: '400', ar: 'حتى ٤٠٠ ج.م', en: 'up to 400 EGP' },
  { value: '700', ar: 'حتى ٧٠٠ ج.م', en: 'up to 700 EGP' },
  { value: '1200', ar: 'حتى ١٢٠٠ ج.م', en: 'up to 1200 EGP' },
];

const ARRIVE_BEFORE = [
  { value: '', ar: 'أي وقت', en: 'Any time' },
  { value: '360', ar: 'قبل ٦ ص', en: 'before 06:00' },
  { value: '540', ar: 'قبل ٩ ص', en: 'before 09:00' },
  { value: '720', ar: 'قبل ١٢ م', en: 'before 12:00' },
  { value: '900', ar: 'قبل ٣ م', en: 'before 15:00' },
  { value: '1080', ar: 'قبل ٦ م', en: 'before 18:00' },
  { value: '1260', ar: 'قبل ٩ م', en: 'before 21:00' },
];

export function SearchFilters({
  locale,
  selectedClasses,
  total,
  basePath = '/search',
}: {
  locale: Locale;
  selectedClasses: TrainClassId[];
  total: number;
  basePath?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const ar = locale === 'ar';

  function commit(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    startTransition(() => {
      router.replace(`${basePath}?${next.toString()}`, { scroll: false });
    });
  }

  function toggleClass(classId: TrainClassId) {
    const next = new Set(selectedClasses);
    if (next.has(classId)) next.delete(classId);
    else next.add(classId);
    commit({ classes: Array.from(next).join(',') || null });
  }

  const sort = params.get('sort') ?? 'departure';
  const direct = params.get('direct') === '1';
  const before = params.get('before') ?? '';
  const maxFare = params.get('maxFare') ?? '';

  return (
    <div className="panel p-3.5 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-ink dark:text-white">
          <SlidersHorizontal className="h-3.5 w-3.5 text-brand-600 dark:text-brand-300" aria-hidden />
          {ar ? 'فلترة وترتيب' : 'Filter & sort'}
          <span className="num rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
            {total}
          </span>
          {pending ? <Loader2 className="h-3 w-3 animate-spin text-brand-500" aria-hidden /> : null}
        </div>
        <span className="sr-only" aria-live="polite">
          {pending ? (ar ? 'جارٍ تحديث النتائج' : 'Updating results') : ''}
        </span>
        <button
          type="button"
          onClick={() => {
            const next = new URLSearchParams(params.toString());
            for (const key of ['sort', 'direct', 'classes', 'before', 'maxFare']) next.delete(key);
            startTransition(() => router.replace(`${basePath}?${next.toString()}`, { scroll: false }));
          }}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
        >
          <RotateCcw className="h-3 w-3" aria-hidden />
          {ar ? 'إعادة الضبط' : 'Reset'}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {ar ? 'ترتيب حسب' : 'Sort by'}
          <select
            value={sort}
            onChange={(event) => commit({ sort: event.target.value })}
            className="field-input h-8 w-32 px-2 text-[11px] font-medium"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {ar ? option.ar : option.en}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {ar ? 'الوصول' : 'Arrive'}
          <select
            value={before}
            onChange={(event) => commit({ before: event.target.value })}
            className="field-input h-8 w-32 px-2 text-[11px] font-medium"
          >
            {ARRIVE_BEFORE.map((option) => (
              <option key={option.value} value={option.value}>
                {ar ? option.ar : option.en}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {ar ? 'أعلى سعر' : 'Max fare'}
          <select
            value={maxFare}
            onChange={(event) => commit({ maxFare: event.target.value })}
            className="field-input h-8 w-32 px-2 text-[11px] font-medium"
          >
            {PRICE_CAPS.map((option) => (
              <option key={option.value} value={option.value}>
                {ar ? option.ar : option.en}
              </option>
            ))}
          </select>
        </label>

        <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <input
            type="checkbox"
            checked={direct}
            onChange={(event) => commit({ direct: event.target.checked ? '1' : null })}
            className="h-3.5 w-3.5 rounded accent-brand-600"
          />
          {ar ? 'مباشر فقط' : 'Direct only'}
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-dashed border-slate-200 pt-3 dark:border-white/10">
        <span className="me-1 text-[10px] font-semibold text-slate-400">{ar ? 'الدرجة:' : 'Class:'}</span>
        {TRAIN_CLASSES.map((trainClass) => {
          const active = selectedClasses.includes(trainClass.id);
          return (
            <button
              key={trainClass.id}
              type="button"
              onClick={() => toggleClass(trainClass.id)}
              aria-pressed={active}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition',
                active
                  ? 'border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-500/15 dark:text-brand-200'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-brand-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-400',
              )}
            >
              <TrainClassIcon classId={trainClass.id} size={12} />
              {ar ? trainClass.shortAr : trainClass.shortEn}
            </button>
          );
        })}
      </div>
    </div>
  );
}
