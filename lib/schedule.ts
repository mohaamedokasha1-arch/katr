import type {
  Locale,
  OperatingDays,
  Override,
  Service,
  ServiceStop,
  Weekday,
} from '@/types/rail';
import { STATION_MAP } from '@/lib/data/stations';
import { TRAIN_CLASS_MAP } from '@/lib/data/train-classes';
import { addDays, dayOfWeek, isDateInSeason } from '@/lib/time';

export interface RunDecision {
  /** A trip instance exists on this origin date (even if cancelled). */
  runs: boolean;
  cancelled: boolean;
  extraRun: boolean;
  seasonalOff: boolean;
  cancellationReasonAr?: string;
  cancellationReasonEn?: string;
  cancellationSource?: Override;
}

function baseRunsOn(service: Service, date: string): boolean {
  if (service.season && !isDateInSeason(date, service.season)) return false;
  const weekday = dayOfWeek(date);
  const days = service.operatingDays;
  if (days.type === 'daily') return true;
  if (days.type === 'weekdays') return days.days.includes(weekday);
  return !days.days.includes(weekday);
}

export function overrideTargetsService(override: Override, service: Service): boolean {
  if (override.serviceNumber) return override.serviceNumber === service.number;
  if (override.lineId) return override.lineId === service.lineId;
  return false;
}

export function overrideOnDate(override: Override, date: string): boolean {
  return date >= override.fromDate && date <= override.toDate;
}

export function publishedOverridesForService(
  service: Service,
  date: string,
  overrides: Override[],
): Override[] {
  return overrides.filter(
    (override) =>
      override.status === 'published' &&
      overrideOnDate(override, date) &&
      overrideTargetsService(override, service),
  );
}

/**
 * Resolve whether a service has a trip instance on a given origin date,
 * applying the documented order: Base → Seasonal → Event (extra runs) →
 * Emergency (cancellations / maintenance).
 */
export function getRunDecision(
  service: Service,
  date: string,
  overrides: Override[],
): RunDecision {
  const seasonalOff = Boolean(service.season && !isDateInSeason(date, service.season));
  const base = baseRunsOn(service, date);
  const active = publishedOverridesForService(service, date, overrides);

  const extra = active.find((override) => override.type === 'extra_run');
  const cancellation = active.find(
    (override) => override.type === 'cancellation' || override.type === 'maintenance',
  );

  const scheduled = base || Boolean(extra);
  if (!scheduled) {
    return { runs: false, cancelled: false, extraRun: Boolean(extra), seasonalOff };
  }

  return {
    runs: true,
    cancelled: Boolean(cancellation),
    extraRun: !base && Boolean(extra),
    seasonalOff,
    cancellationReasonAr: cancellation?.reasonAr,
    cancellationReasonEn: cancellation?.reasonEn,
    cancellationSource: cancellation,
  };
}

export function getActiveOverrides(
  service: Service,
  date: string,
  overrides: Override[],
): Override[] {
  return publishedOverridesForService(service, date, overrides);
}

/** Number of minutes the whole timetable shifts due to a published schedule change. */
export function scheduleShiftMinutes(activeOverrides: Override[], service: Service): number {
  const changes = activeOverrides
    .filter((override) => override.type === 'schedule_change' && typeof override.newDepartureMinutes === 'number')
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  if (changes.length === 0) return 0;
  return (changes[0].newDepartureMinutes ?? service.departureMinutes) - service.departureMinutes;
}

export function publishedDelayMinutes(activeOverrides: Override[]): number {
  return activeOverrides
    .filter((override) => override.type === 'delay')
    .reduce((max, override) => Math.max(max, override.delayMinutes ?? 0), 0);
}

export function serviceTitle(service: Service, locale: Locale): string {
  if (locale === 'ar' && service.titleAr) return service.titleAr;
  if (locale === 'en' && service.titleEn) return service.titleEn;
  const primary = TRAIN_CLASS_MAP[service.classes[0]];
  return locale === 'ar' ? primary.nameAr : primary.nameEn;
}

export function servicePrimaryClass(service: Service) {
  return TRAIN_CLASS_MAP[service.classes[0]];
}

export function stopIndex(service: Service, stationId: string): number {
  return service.stops.findIndex((stop) => stop.stationId === stationId);
}

export function getStop(service: Service, stationId: string): ServiceStop | undefined {
  return service.stops.find((stop) => stop.stationId === stationId);
}

export function serviceOrigin(service: Service) {
  return STATION_MAP[service.stops[0].stationId];
}

export function serviceDestination(service: Service) {
  return STATION_MAP[service.stops[service.stops.length - 1].stationId];
}

export function fullDistance(service: Service): number {
  return service.stops[service.stops.length - 1].distanceKm;
}

export function getFullRouteShift(service: Service, overrides: Override[], date: string): number {
  return scheduleShiftMinutes(getActiveOverrides(service, date, overrides), service);
}

export function seasonStatus(
  service: Service,
  date: string,
): { state: 'none' | 'in' | 'before' | 'after'; nextStart?: string } {
  if (!service.season) return { state: 'none' };
  if (isDateInSeason(date, service.season)) return { state: 'in' };
  const [year] = date.split('-').map(Number);
  const start = (y: number) =>
    `${y}-${String(service.season!.startMonth).padStart(2, '0')}-${String(service.season!.startDay).padStart(2, '0')}`;
  const thisYearStart = start(year);
  const nextStart = date < thisYearStart ? thisYearStart : start(year + 1);
  return { state: date < thisYearStart ? 'before' : 'after', nextStart };
}

/** Upcoming dates (including today) on which the service is scheduled to run. */
export function nextOperatingDates(
  service: Service,
  fromDate: string,
  count: number,
  overrides: Override[],
  horizonDays = 120,
): string[] {
  const dates: string[] = [];
  for (let i = 0; i < horizonDays && dates.length < count; i += 1) {
    const date = addDays(fromDate, i);
    const decision = getRunDecision(service, date, overrides);
    if (decision.runs && !decision.cancelled) dates.push(date);
  }
  return dates;
}

export function operatingDaysForDisplay(
  operatingDays: OperatingDays,
): { labelAr: string; labelEn: string; days: Weekday[] } {
  if (operatingDays.type === 'daily') {
    return { labelAr: 'يوميًا', labelEn: 'Daily', days: [0, 1, 2, 3, 4, 5, 6] };
  }
  if (operatingDays.type === 'weekdays') {
    return { labelAr: 'أيام محددة', labelEn: 'Selected days', days: operatingDays.days };
  }
  const all: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
  return {
    labelAr: 'يوميًا ما عدا أيام محددة',
    labelEn: 'Daily except selected days',
    days: all.filter((day) => !operatingDays.days.includes(day)),
  };
}

export function runsAtStationOnDate(
  service: Service,
  originDate: string,
  stationId: string,
  shift: number,
): { date: string; departureMinutes: number; arrivalMinutes: number | null } | null {
  const stop = getStop(service, stationId);
  if (!stop) return null;
  const departure = service.departureMinutes + shift + stop.departureOffset;
  const arrival =
    stop.arrivalOffset === null
      ? null
      : service.departureMinutes + shift + stop.arrivalOffset;
  const boardingDate = addDays(originDate, Math.floor(departure / 1440));
  return { date: boardingDate, departureMinutes: departure, arrivalMinutes: arrival };
}
