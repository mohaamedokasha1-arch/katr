'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { FaqItem, Locale } from '@/types/rail';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'all', ar: 'الكل', en: 'All' },
  { id: 'trust', ar: 'الثقة في البيانات', en: 'Data trust' },
  { id: 'search', ar: 'البحث والمواعيد', en: 'Search & times' },
  { id: 'alerts', ar: 'التنبيهات', en: 'Alerts' },
  { id: 'booking', ar: 'الحجز والتذاكر', en: 'Booking' },
  { id: 'access', ar: 'الوصول والموبايل', en: 'Access & mobile' },
] as const;

export function FaqAccordion({ items, locale }: { items: FaqItem[]; locale: Locale }) {
  const ar = locale === 'ar';
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!needle) return true;
      const haystack = ar
        ? `${item.qAr} ${item.aAr}`.toLowerCase()
        : `${item.qEn} ${item.aEn}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [items, category, query, ar]);

  return (
    <div>
      <div className="panel p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ar ? 'دوّر على سؤالك…' : 'Search your question…'}
            className="field-input h-10 ps-9 text-xs"
            aria-label={ar ? 'ابحث في الأسئلة الشائعة' : 'Search the FAQ'}
          />
        </div>
        <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
          {categories.map((item) => {
            const active = category === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                aria-pressed={active}
                className={cn('chip shrink-0', active && 'chip-active')}
              >
                {ar ? item.ar : item.en}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="panel mt-4 p-8 text-center text-xs text-slate-500 dark:text-slate-400">
          {ar ? 'مفيش سؤال مطابق. جرّب كلمة أبسط أو ابعتلنا سؤالك.' : 'No matching question. Try a simpler word or send us yours.'}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {filtered.map((item) => {
            const expanded = open === item.id;
            return (
              <li key={item.id} className="panel overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : item.id)}
                  aria-expanded={expanded}
                  aria-controls={`faq-${item.id}`}
                  className="flex w-full items-start justify-between gap-3 p-4 text-start"
                >
                  <span className="text-[13px] font-semibold leading-6 text-ink dark:text-white">
                    {ar ? item.qAr : item.qEn}
                  </span>
                  <ChevronDown
                    className={cn('mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition', expanded && 'rotate-180 text-brand-600 dark:text-brand-300')}
                    aria-hidden
                  />
                </button>
                <div
                  id={`faq-${item.id}`}
                  hidden={!expanded}
                  className="border-t border-slate-100 px-4 py-3 text-[12px] leading-7 text-slate-600 dark:border-white/5 dark:text-slate-300"
                >
                  {ar ? item.aAr : item.aEn}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
