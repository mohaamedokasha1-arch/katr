'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftRight,
  CalendarDays,
  Crosshair,
  Loader2,
  MapPin,
  Search,
  TrainFront,
  X,
} from 'lucide-react';
import type { Locale } from '@/types/rail';
import {
  getStationOption,
  nearestStations,
  searchStationOptions,
  stationDisplayName,
  type RankedStation,
} from '@/lib/stations-search';
import { addDaysClient, cairoTodayClient } from '@/lib/client-time';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export type SearchFormVariant = 'hero' | 'panel' | 'compact';

interface SearchFormProps {
  locale: Locale;
  variant?: SearchFormVariant;
  initialFrom?: string;
  initialTo?: string;
  initialDate?: string;
  initialDirect?: boolean;
  initialClasses?: string;
  className?: string;
  autoFocus?: boolean;
}

type FieldName = 'from' | 'to';

export function SearchForm({
  locale,
  variant = 'panel',
  initialFrom = '',
  initialTo = '',
  initialDate,
  initialDirect = false,
  initialClasses = '',
  className,
  autoFocus = false,
}: SearchFormProps) {
  const router = useRouter();
  const toast = useToast();
  const today = cairoTodayClient();
  const [fromId, setFromId] = useState(initialFrom);
  const [toId, setToId] = useState(initialTo);
  const [fromText, setFromText] = useState(
    stationDisplayName(getStationOption(initialFrom), locale),
  );
  const [toText, setToText] = useState(stationDisplayName(getStationOption(initialTo), locale));
  const [date, setDate] = useState(initialDate || today);
  const [directOnly, setDirectOnly] = useState(initialDirect);
  const [activeField, setActiveField] = useState<FieldName | null>(null);
  const [highlight, setHighlight] = useState(0);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const dateId = useId();

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) setActiveField(null);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    if (autoFocus) {
      const timer = window.setTimeout(() => fromInputRef.current?.focus(), 250);
      return () => window.clearTimeout(timer);
    }
  }, [autoFocus]);

  const query = activeField === 'from' ? fromText : toText;
  const suggestions = activeField
    ? searchStationOptions(activeField === 'from' ? fromText : toText, {
        limit: 7,
        prioritize: activeField === 'from' ? (toId ? [toId] : []) : fromId ? [fromId] : [],
      })
    : [];
  const showSuggestions = activeField !== null;

  function selectStation(field: FieldName, station: RankedStation) {
    if (field === 'from') {
      setFromId(station.id);
      setFromText(stationDisplayName(station, locale));
    } else {
      setToId(station.id);
      setToText(stationDisplayName(station, locale));
    }
    setActiveField(null);
    setHighlight(0);
    setError('');
  }

  function swap() {
    setFromId(toId);
    setToId(fromId);
    setFromText(toText);
    setToText(fromText);
    setActiveField(null);
    setError('');
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!fromId || !toId) {
      setError(
        locale === 'ar'
          ? 'اختر محطة الانطلاق ومحطة الوصول من الاقتراحات أولًا.'
          : 'Pick your origin and destination from the suggestions first.',
      );
      return;
    }
    if (fromId === toId) {
      setError(locale === 'ar' ? 'محطة الانطلاق والوصول لا يمكن أن تكونا نفس المحطة.' : 'Origin and destination cannot be the same station.');
      return;
    }
    setError('');
    setSubmitting(true);
    const params = new URLSearchParams({ from: fromId, to: toId, date });
    if (directOnly) params.set('direct', '1');
    if (initialClasses) params.set('classes', initialClasses);
    router.push(`/search?${params.toString()}`);
  }

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      toast(
        locale === 'ar' ? 'جهازك لا يدعم تحديد الموقع.' : 'Your device does not support geolocation.',
        'error',
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const [nearest] = nearestStations(position.coords.latitude, position.coords.longitude, 1);
        setLocating(false);
        if (!nearest) return;
        setFromId(nearest.id);
        setFromText(stationDisplayName(nearest, locale));
        setActiveField(null);
        toast(
          locale === 'ar'
            ? `اخترنا أقرب محطة: ${nearest.nameAr} (${Math.round(nearest.distance ?? 0)} كم)`
            : `Nearest station selected: ${nearest.nameEn} (${Math.round(nearest.distance ?? 0)} km)`,
          'success',
        );
      },
      () => {
        setLocating(false);
        toast(
          locale === 'ar'
            ? 'تعذر الوصول لموقعك. يمكنك كتابة اسم المحطة يدويًا.'
            : 'Could not access your location. You can type the station name instead.',
          'error',
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>, field: FieldName) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((current) => (current + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((current) => (current - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      selectStation(field, suggestions[highlight]);
    } else if (event.key === 'Escape') {
      setActiveField(null);
    }
  }

  const isHero = variant === 'hero';
  const inputBase = cn(
    'h-12 w-full rounded-xl border px-3.5 text-sm font-medium outline-none transition',
    isHero
      ? 'border-slate-200 bg-white text-ink placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-brand-200/50 dark:focus:border-brand-300'
      : 'border-slate-200 bg-white text-ink placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500',
  );

  function renderField(field: FieldName) {
    const isFrom = field === 'from';
    const id = isFrom ? fromId : toId;
    const text = isFrom ? fromText : toText;
    const setText = isFrom ? setFromText : setToText;
    const setId = isFrom ? setFromId : setToId;
    const value = activeField === field ? text : stationDisplayName(getStationOption(id), locale);
    const label = isFrom
      ? locale === 'ar'
        ? 'من'
        : 'From'
      : locale === 'ar'
        ? 'إلى'
        : 'To';

    return (
      <div className="relative flex-1">
        <label
          htmlFor={`search-${field}`}
          className={cn(
            'mb-1.5 block text-[11px] font-bold uppercase tracking-wider',
            isHero ? 'text-brand-200/70' : 'text-slate-400 dark:text-slate-500',
          )}
        >
          {label}
        </label>
        <div className="relative">
          <MapPin
            className={cn(
              'pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2',
              isHero ? 'text-brand-300' : 'text-slate-400',
            )}
            aria-hidden
          />
          <input
            id={`search-${field}`}
            ref={isFrom ? fromInputRef : undefined}
            role="combobox"
            aria-expanded={activeField === field}
            aria-controls={`station-list-${field}`}
            aria-autocomplete="list"
            aria-activedescendant={
              activeField === field && suggestions[highlight]
                ? `station-option-${field}-${suggestions[highlight].id}`
                : undefined
            }
            autoComplete="off"
            value={value}
            placeholder={
              locale === 'ar'
                ? isFrom
                  ? 'المحطة أو المدينة'
                  : 'إلى أين؟'
                : isFrom
                  ? 'Station or city'
                  : 'Where to?'
            }
            onChange={(event) => {
              setText(event.target.value);
              setId('');
              setActiveField(field);
              setHighlight(0);
            }}
            onFocus={() => {
              setActiveField(field);
              setHighlight(0);
            }}
            onKeyDown={(event) => handleKeyDown(event, field)}
            className={cn(inputBase, 'pe-9')}
            aria-invalid={error ? true : undefined}
          />
          {id ? (
            <button
              type="button"
              onClick={() => {
                setId('');
                setText('');
                setActiveField(field);
                if (isFrom) fromInputRef.current?.focus();
              }}
              aria-label={locale === 'ar' ? 'مسح المحطة' : 'Clear station'}
              className={cn(
                'absolute end-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 transition',
                isHero
                  ? 'text-brand-200/70 hover:bg-white/10 hover:text-white'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10',
              )}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {showSuggestions && activeField === field ? (
          <div
            id={`station-list-${field}`}
            role="listbox"
            className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift dark:border-white/10 dark:bg-night-700"
          >
            {suggestions.length === 0 ? (
              <p className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">
                {locale === 'ar'
                  ? 'لا توجد محطة مطابقة. جرّب اسمًا آخر أو اكتب "القاهرة".'
                  : 'No matching station. Try another name or type “Cairo”.'}
              </p>
            ) : (
              <ul className="max-h-72 overflow-y-auto py-1">
                {suggestions.map((station, index) => {
                  const selected = index === highlight;
                  return (
                    <li key={station.id}>
                      <button
                        type="button"
                        id={`station-option-${field}-${station.id}`}
                        role="option"
                        aria-selected={selected}
                        onMouseEnter={() => setHighlight(index)}
                        onClick={() => selectStation(field, station)}
                        className={cn(
                          'flex w-full items-center gap-3 px-3.5 py-2.5 text-start transition',
                          selected
                            ? 'bg-brand-50 dark:bg-brand-500/10'
                            : 'hover:bg-slate-50 dark:hover:bg-white/[0.04]',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                            station.tier === 1
                              ? 'bg-brand-700 text-white dark:bg-brand-500'
                              : station.tier === 2
                                ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200'
                                : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400',
                          )}
                        >
                          <TrainFront className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink dark:text-white">
                            {locale === 'ar' ? station.nameAr : station.nameEn}
                          </span>
                          <span className="block truncate text-[11px] text-slate-400">
                            {locale === 'ar' ? station.governorateAr : station.governorateEn}
                            {' · '}
                            <span className="num">{station.code}</span>
                          </span>
                        </span>
                        {typeof station.distance === 'number' ? (
                          <span className="num text-[10px] text-slate-400">
                            {Math.round(station.distance)} km
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="flex items-center justify-between border-t border-slate-100 px-3.5 py-2 dark:border-white/10">
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-700 transition hover:text-brand-800 disabled:opacity-60 dark:text-brand-300"
              >
                {locating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Crosshair className="h-3.5 w-3.5" aria-hidden />
                )}
                {locale === 'ar' ? 'استخدم موقعي' : 'Use my location'}
              </button>
              <span className="text-[10px] text-slate-400">
                {locale === 'ar' ? '↑↓ للتنقل · Enter للاختيار' : '↑↓ to move · Enter to pick'}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn(
        'relative',
        isHero
          ? 'rounded-2xl border border-white/10 bg-[#07224f]/70 p-4 shadow-board backdrop-blur-xl sm:p-5'
          : variant === 'compact'
            ? 'rounded-xl border border-slate-200 bg-white p-3 shadow-card dark:border-white/10 dark:bg-night-800'
            : 'panel p-4 sm:p-5',
        className,
      )}
      role="search"
      aria-label={locale === 'ar' ? 'البحث عن قطار' : 'Train search'}
    >
      <div ref={containerRef} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {renderField('from')}

        <div className="flex items-center justify-center sm:pb-1">
          <button
            type="button"
            onClick={swap}
            aria-label={locale === 'ar' ? 'تبديل الاتجاه' : 'Swap direction'}
            title={locale === 'ar' ? 'تبديل الاتجاه' : 'Swap direction'}
            className={cn(
              'group flex h-10 w-10 items-center justify-center rounded-full border transition active:scale-95',
              isHero
                ? 'border-white/15 bg-white/10 text-white hover:bg-white/20'
                : 'border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
            )}
          >
            <ArrowLeftRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180 rtl:group-hover:rotate-[-180deg]" />
          </button>
        </div>

        {renderField('to')}

        <div className="w-full sm:w-[168px]">
          <label
            htmlFor={dateId}
            className={cn(
              'mb-1.5 block text-[11px] font-bold uppercase tracking-wider',
              isHero ? 'text-brand-200/70' : 'text-slate-400 dark:text-slate-500',
            )}
          >
            {locale === 'ar' ? 'التاريخ' : 'Date'}
          </label>
          <div className="relative">
            <CalendarDays
              className={cn(
                'pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2',
                isHero ? 'text-brand-300' : 'text-slate-400',
              )}
              aria-hidden
            />
            <input
              id={dateId}
              type="date"
              value={date}
              min={today}
              max={addDaysClient(today, 365)}
              onChange={(event) => setDate(event.target.value || today)}
              className={cn(inputBase, 'ps-9 pe-2.5')}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={cn(
            'inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold shadow-sm transition active:scale-[0.99] disabled:opacity-70',
            isHero
              ? 'bg-signal text-white hover:bg-signal-dark'
              : 'bg-brand-700 text-white hover:bg-brand-800 dark:bg-brand-500 dark:hover:bg-brand-400',
          )}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Search className="h-4 w-4" aria-hidden />
          )}
          {locale === 'ar' ? 'ابحث' : 'Search'}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          {[0, 1].map((offset) => {
            const value = addDaysClient(today, offset);
            const active = date === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setDate(value)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition',
                  active
                    ? isHero
                      ? 'bg-white/15 text-white'
                      : 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
                    : isHero
                      ? 'text-brand-200/70 hover:bg-white/10 hover:text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5',
                )}
              >
                {offset === 0 ? (locale === 'ar' ? 'اليوم' : 'Today') : locale === 'ar' ? 'غدًا' : 'Tomorrow'}
              </button>
            );
          })}
        </div>

        <label
          className={cn(
            'inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold',
            isHero ? 'text-brand-200/80' : 'text-slate-500 dark:text-slate-400',
          )}
        >
          <input
            type="checkbox"
            checked={directOnly}
            onChange={(event) => setDirectOnly(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 accent-brand-600 dark:border-white/20"
          />
          {locale === 'ar' ? 'مباشر فقط' : 'Direct only'}
        </label>

        <span className={cn('ms-auto hidden text-[10px] sm:block', isHero ? 'text-brand-200/50' : 'text-slate-400')}>
          {locale === 'ar'
            ? 'الافتراضي: اليوم — لأن أغلب الرحلات تُبحث في نفس اليوم'
            : 'Defaults to today — most searches are same-day'}
        </span>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs font-medium text-danger-ink dark:bg-danger/10 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </form>
  );
}
