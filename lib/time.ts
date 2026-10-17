import type { Locale, SeasonWindow, Weekday } from '@/types/rail';

export const CAIRO_TZ = 'Africa/Cairo';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const dayMs = 86_400_000;

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
}

/** Minutes that `timeZone` is ahead of UTC at the given instant. */
export function timeZoneOffsetMs(instant: Date, timeZone = CAIRO_TZ): number {
  const parts = partsFormatter(timeZone).formatToParts(instant);
  const map: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(
    map.year,
    (map.month ?? 1) - 1,
    map.day ?? 1,
    map.hour ?? 0,
    map.minute ?? 0,
    map.second ?? 0,
  );
  return asUtc - instant.getTime();
}

export function isValidDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && formatDateISO(parsed) === value;
}

export function parseDate(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00Z`);
}

export function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function epochDay(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / dayMs);
}

export function addDays(dateStr: string, days: number): string {
  return new Date((epochDay(dateStr) + days) * dayMs).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return epochDay(to) - epochDay(from);
}

export function dayOfWeek(dateStr: string): Weekday {
  return new Date(epochDay(dateStr) * dayMs).getUTCDay() as Weekday;
}

export function todayCairo(now: Date = new Date()): string {
  const parts = partsFormatter(CAIRO_TZ).formatToParts(now);
  const map: Record<string, string> = {};
  for (const part of parts) if (part.type !== 'literal') map[part.type] = part.value;
  return `${map.year}-${map.month}-${map.day}`;
}

export function cairoClock(now: Date = new Date()): { date: string; minutes: number } {
  const parts = partsFormatter(CAIRO_TZ).formatToParts(now);
  const map: Record<string, string> = {};
  for (const part of parts) if (part.type !== 'literal') map[part.type] = part.value;
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    minutes: Number(map.hour) * 60 + Number(map.minute),
  };
}

export function nowEpochMinutes(now: Date = new Date()): number {
  const { date, minutes } = cairoClock(now);
  return epochDay(date) * 1440 + minutes;
}

export function dateEpochMinutes(dateStr: string, minutes: number): number {
  return epochDay(dateStr) * 1440 + minutes;
}

/** Wall-clock "HH:MM" (24h). Values above 1440 roll over visually. */
export function formatClock(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatClock12(
  totalMinutes: number,
  locale: Locale = 'ar',
): { time: string; suffix: string } {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(normalized / 60);
  const m = normalized % 60;
  const suffix =
    h24 < 12
      ? locale === 'ar'
        ? 'ص'
        : 'AM'
      : locale === 'ar'
        ? 'م'
        : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { time: `${h12}:${String(m).padStart(2, '0')}`, suffix };
}

export function minutesDayOffset(minutes: number): number {
  return Math.floor(minutes / 1440);
}

/**
 * Convert a Cairo wall-clock date + minute value into a real UTC instant.
 * The offset is resolved twice so DST transitions are handled correctly.
 */
export function toUtcDate(dateStr: string, minutes: number): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const normalized = minutes;
  const dayShift = Math.floor(normalized / 1440);
  const minuteOfDay = ((normalized % 1440) + 1440) % 1440;
  const wallMs = Date.UTC(
    y,
    m - 1,
    d + dayShift,
    Math.floor(minuteOfDay / 60),
    minuteOfDay % 60,
    0,
  );
  // Start from the standard offset, then refine twice.
  let guess = wallMs - 2 * 3_600_000;
  for (let i = 0; i < 3; i += 1) {
    const offset = timeZoneOffsetMs(new Date(guess));
    const next = wallMs - offset;
    if (Math.abs(next - guess) < 30_000) {
      guess = next;
      break;
    }
    guess = next;
  }
  return new Date(guess);
}

export function toIso(dateStr: string, minutes: number): string {
  return toUtcDate(dateStr, minutes).toISOString();
}

export function isoToCairo(dateIso: string): { date: string; minutes: number } {
  const clock = cairoClock(new Date(dateIso));
  return clock;
}

export function dateEpoch(dateStr: string): number {
  return epochDay(dateStr);
}

export function dateRange(from: string, to: string): string[] {
  const count = Math.max(0, daysBetween(from, to));
  return Array.from({ length: count + 1 }, (_, i) => addDays(from, i));
}

export function isDateInRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

export function monthDayValue(month: number, day: number): number {
  return month * 100 + day;
}

export function isDateInSeason(dateStr: string, season: SeasonWindow): boolean {
  const [, m, d] = dateStr.split('-').map(Number);
  const value = monthDayValue(m, d);
  const start = monthDayValue(season.startMonth, season.startDay);
  const end = monthDayValue(season.endMonth, season.endDay);
  if (start <= end) return value >= start && value <= end;
  // Wrap-around window, e.g. 1 Nov → 28 Feb.
  return value >= start || value <= end;
}

const AR_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function monthName(month: number, locale: Locale): string {
  return locale === 'ar' ? AR_MONTHS[month - 1] : EN_MONTHS[month - 1];
}

export function formatMonthDay(month: number, day: number, locale: Locale): string {
  return locale === 'ar' ? `${day} ${monthName(month, locale)}` : `${day} ${monthName(month, locale)}`;
}

export function formatSeason(season: SeasonWindow, locale: Locale): string {
  return `${formatMonthDay(season.startMonth, season.startDay, locale)} – ${formatMonthDay(
    season.endMonth,
    season.endDay,
    locale,
  )}`;
}

export function formatDateFull(dateStr: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parseDate(dateStr));
}

export function formatDateMedium(dateStr: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(parseDate(dateStr));
}

export function formatDateShort(dateStr: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(parseDate(dateStr));
}

export function formatWeekday(dateStr: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(parseDate(dateStr));
}

export function formatDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: CAIRO_TZ,
  }).format(new Date(iso));
}

const AR_WEEKDAYS_SHORT = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const EN_WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function weekdayShort(day: Weekday, locale: Locale): string {
  return locale === 'ar' ? AR_WEEKDAYS_SHORT[day] : EN_WEEKDAYS_SHORT[day];
}
