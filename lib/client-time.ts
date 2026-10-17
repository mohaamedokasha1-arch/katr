/** Browser-safe Cairo date helpers (no Node APIs). */

export function cairoTodayClient(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const map: Record<string, string> = {};
  for (const part of parts) if (part.type !== 'literal') map[part.type] = part.value;
  return `${map.year}-${map.month}-${map.day}`;
}

export function addDaysClient(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function formatDateClient(dateStr: string, locale: 'ar' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${dateStr}T12:00:00Z`));
}

export function formatClockClient(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(
    normalized % 60,
  ).padStart(2, '0')}`;
}

export function countdownParts(targetIso: string, nowMs = Date.now()): {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
} {
  const totalMs = new Date(targetIso).getTime() - nowMs;
  const abs = Math.max(0, totalMs);
  const seconds = Math.floor(abs / 1000) % 60;
  const minutes = Math.floor(abs / 60_000) % 60;
  const hours = Math.floor(abs / 3_600_000) % 24;
  const days = Math.floor(abs / 86_400_000);
  return { totalMs, days, hours, minutes, seconds, expired: totalMs <= 0 };
}

export function formatRelativeClient(targetIso: string, nowMs = Date.now()): string {
  const parts = countdownParts(targetIso, nowMs);
  if (parts.expired) return 'expired';
  if (parts.days > 0) return `${parts.days}d ${parts.hours}h`;
  if (parts.hours > 0) return `${parts.hours}h ${parts.minutes}m`;
  return `${parts.minutes}m`;
}
