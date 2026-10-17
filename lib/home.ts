import type {
  ConfidenceLevel,
  LiveStatusView,
  Locale,
  Override,
  TripResult,
} from '@/types/rail';
import { SERVICES } from '@/lib/data/services';
import { STATION_MAP } from '@/lib/data/stations';
import { getTripStatus } from '@/lib/live';
import { getRunDecision, overrideOnDate, serviceTitle } from '@/lib/schedule';
import { getPublishedOverrides } from '@/lib/store';
import { addDays, formatClock, minutesDayOffset, todayCairo } from '@/lib/time';

export interface TickerRow {
  serviceNumber: string;
  titleAr: string;
  titleEn: string;
  destinationId: string;
  destinationAr: string;
  destinationEn: string;
  departureMinutes: number;
  status: LiveStatusView;
  confidence: ConfidenceLevel;
  tripId: string;
}

export interface AlertItem {
  id: string;
  type: Override['type'];
  serviceNumber?: string;
  titleAr: string;
  titleEn: string;
  reasonAr: string;
  reasonEn: string;
  fromDate: string;
  toDate: string;
  delayMinutes?: number;
  source: Override['source'];
}

export interface HomeLiveData {
  date: string;
  ticker: TickerRow[];
  alerts: AlertItem[];
  counts: {
    services: number;
    delayed: number;
    cancelled: number;
    changed: number;
  };
}

function serviceAlertTitle(override: Override): { ar: string; en: string } {
  if (!override.serviceNumber) {
    return { ar: 'تعديل على مستوى الخط', en: 'Line-wide change' };
  }
  const service = SERVICES.find((item) => item.number === override.serviceNumber);
  if (!service) return { ar: `قطار ${override.serviceNumber}`, en: `Train ${override.serviceNumber}` };
  return {
    ar: `قطار ${service.number} — ${serviceTitle(service, 'ar')}`,
    en: `Train ${service.number} — ${serviceTitle(service, 'en')}`,
  };
}

export function getHomeLiveData(now: Date = new Date()): HomeLiveData {
  const today = todayCairo(now);
  const overrides = getPublishedOverrides();
  const ticker: TickerRow[] = [];
  let delayed = 0;
  let cancelled = 0;
  let changed = 0;

  for (const service of SERVICES) {
    const decision = getRunDecision(service, today, overrides);
    if (!decision.runs) continue;
    const destination = STATION_MAP[service.stops[service.stops.length - 1].stationId];
    const { status, confidence } = getTripStatus({
      service,
      originDate: today,
      fromIndex: 0,
      toIndex: service.stops.length - 1,
      now,
      overrides,
    });
    if (decision.cancelled) cancelled += 1;
    else if (status.delayMinutes > 0) delayed += 1;
    if (decision.extraRun || overrides.some(
      (override) =>
        override.type === 'schedule_change' &&
        overrideOnDate(override, today) &&
        override.serviceNumber === service.number,
    )) {
      changed += 1;
    }

    if (
      decision.cancelled ||
      status.delayMinutes > 0 ||
      status.kind === 'boarding' ||
      decision.extraRun
    ) {
      ticker.push({
        serviceNumber: service.number,
        titleAr: serviceTitle(service, 'ar'),
        titleEn: serviceTitle(service, 'en'),
        destinationId: destination.id,
        destinationAr: destination.nameAr,
        destinationEn: destination.nameEn,
        departureMinutes: status.expectedDepartureMinutes,
        status,
        confidence: confidence.level,
        tripId: `${service.number}-${today}`,
      });
    }
  }

  ticker.sort((a, b) => {
    const aBad = a.status.kind === 'cancelled' ? 0 : a.status.delayMinutes > 0 ? 1 : 2;
    const bBad = b.status.kind === 'cancelled' ? 0 : b.status.delayMinutes > 0 ? 1 : 2;
    if (aBad !== bBad) return aBad - bBad;
    return a.departureMinutes - b.departureMinutes;
  });

  const tomorrow = addDays(today, 1);
  const alerts: AlertItem[] = overrides
    .filter(
      (override) =>
        overrideOnDate(override, today) ||
        overrideOnDate(override, tomorrow) ||
        (override.fromDate <= today && override.toDate >= today),
    )
    .sort((a, b) => (a.fromDate < b.fromDate ? -1 : 1))
    .slice(0, 4)
    .map((override) => {
      const title = serviceAlertTitle(override);
      return {
        id: override.id,
        type: override.type,
        serviceNumber: override.serviceNumber,
        titleAr: title.ar,
        titleEn: title.en,
        reasonAr: override.reasonAr,
        reasonEn: override.reasonEn,
        fromDate: override.fromDate,
        toDate: override.toDate,
        delayMinutes: override.delayMinutes,
        source: override.source,
      };
    });

  return {
    date: today,
    ticker,
    alerts,
    counts: {
      services: SERVICES.filter((service) => getRunDecision(service, today, overrides).runs).length,
      delayed,
      cancelled,
      changed,
    },
  };
}

export function findConfidenceExamples(trips: TripResult[]): Array<{
  level: ConfidenceLevel;
  trip: TripResult | null;
}> {
  const pick = (predicate: (trip: TripResult) => boolean) =>
    trips.find(predicate) ?? null;
  const used = new Set<string>();
  const choose = (level: ConfidenceLevel, predicate: (trip: TripResult) => boolean) => {
    const trip = trips.find((candidate) => !used.has(candidate.tripId) && predicate(candidate)) ?? null;
    if (trip) used.add(trip.tripId);
    return { level, trip };
  };
  return [
    choose('official', (trip) => trip.confidence.level === 'official'),
    choose('standard', (trip) => trip.confidence.level === 'standard'),
    choose('community', (trip) => trip.confidence.level === 'community'),
    choose('stale', (trip) => trip.confidence.level === 'stale'),
  ];
}

export function statusForTicker(status: LiveStatusView, locale: Locale): string {
  const ar = locale === 'ar';
  if (status.kind === 'cancelled') return ar ? 'ملغى' : 'Cancelled';
  if (status.delayMinutes > 0) return ar ? `+${status.delayMinutes} د` : `+${status.delayMinutes}m`;
  if (status.kind === 'boarding') return ar ? 'على الرصيف' : 'Boarding';
  return ar ? 'في الموعد' : 'On time';
}

export function tickerClock(status: LiveStatusView): string {
  return formatClock(status.expectedDepartureMinutes);
}

export function dayBadge(totalMinutes: number): string | null {
  const offset = minutesDayOffset(totalMinutes);
  return offset > 0 ? `+${offset}` : null;
}
