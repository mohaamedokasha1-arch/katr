import type {
  FareEstimate,
  Locale,
  Override,
  RouteSummary,
  SearchResponse,
  SearchSort,
  Service,
  Station,
  TrainClassId,
  TripResult,
} from '@/types/rail';
import { SERVICES, SERVICE_BY_NUMBER } from '@/lib/data/services';
import { STATION_MAP } from '@/lib/data/stations';
import { TRAIN_CLASS_IDS } from '@/lib/data/train-classes';
import { getTripStatus } from '@/lib/live';
import {
  getActiveOverrides,
  getRunDecision,
  scheduleShiftMinutes,
  serviceTitle,
} from '@/lib/schedule';
import { getPublishedOverrides } from '@/lib/store';
import {
  addDays,
  cairoClock,
  epochDay,
  isValidDateString,
  todayCairo,
} from '@/lib/time';
import { clamp, hashString } from '@/lib/utils';

export interface SearchQuery {
  from: string;
  to: string;
  date: string;
  directOnly?: boolean;
  classes?: TrainClassId[];
  sort?: SearchSort;
}

const SORT_VALUES: SearchSort[] = ['departure', 'arrival', 'duration', 'price'];

export function normaliseSearchQuery(input: {
  from?: string | null;
  to?: string | null;
  date?: string | null;
  direct?: string | null;
  classes?: string | null;
  sort?: string | null;
}): SearchQuery | null {
  const from = input.from?.trim();
  const to = input.to?.trim();
  if (!from || !to || from === to) return null;
  if (!STATION_MAP[from] || !STATION_MAP[to]) return null;
  const date =
    input.date && isValidDateString(input.date) ? input.date : todayCairo();
  const classes =
    input.classes
      ?.split(',')
      .map((item) => item.trim())
      .filter((item): item is TrainClassId =>
        (TRAIN_CLASS_IDS as string[]).includes(item),
      ) ?? [];
  const sort = SORT_VALUES.includes((input.sort ?? '') as SearchSort)
    ? ((input.sort ?? 'departure') as SearchSort)
    : 'departure';
  return {
    from,
    to,
    date,
    directOnly: input.direct === '1' || input.direct === 'true',
    classes,
    sort,
  };
}

function estimateFare(
  service: Service,
  classId: TrainClassId,
  ratio: number,
): FareEstimate {
  const fare = service.fares.find((item) => item.classId === classId);
  if (!fare) return { classId, min: 0, max: 0 };
  if (ratio >= 0.999) return { classId, min: fare.min, max: fare.max };
  const floors: Partial<Record<TrainClassId, number>> = {
    sleeping: 250,
    talgo: 40,
    haya: 30,
    russian: 25,
    ac1: 25,
    ac2: 20,
    third_ac: 15,
    third: 10,
  };
  const scale = Math.pow(clamp(ratio, 0.06, 1), 0.86);
  const floor = floors[classId] ?? 10;
  const min = Math.max(floor, Math.round((fare.min * scale) / 5) * 5);
  const max = Math.max(min, Math.round((fare.max * scale) / 5) * 5);
  return { classId, min, max };
}

function buildTrip(args: {
  service: Service;
  originDate: string;
  fromIndex: number;
  toIndex: number;
  now: Date;
  overrides: Override[];
}): TripResult {
  const { service, originDate, fromIndex, toIndex, now, overrides } = args;
  const fromStop = service.stops[fromIndex];
  const toStop = service.stops[toIndex];
  const from = STATION_MAP[fromStop.stationId];
  const to = STATION_MAP[toStop.stationId];
  const active = getActiveOverrides(service, originDate, overrides);
  const shift = scheduleShiftMinutes(active, service);

  const departMinutes = service.departureMinutes + shift + fromStop.departureOffset;
  const arrivalOffset = toStop.arrivalOffset ?? toStop.departureOffset;
  const arriveMinutes = service.departureMinutes + shift + arrivalOffset;
  const durationMinutes = arriveMinutes - departMinutes;
  const distanceKm = Math.max(1, toStop.distanceKm - fromStop.distanceKm);
  const fullKm = Math.max(1, service.stops[service.stops.length - 1].distanceKm);
  const ratio = distanceKm / fullKm;

  const { status, confidence } = getTripStatus({
    service,
    originDate,
    fromIndex,
    toIndex,
    now,
    overrides,
  });

  const stops = service.stops.map((stop, index) => {
    const station = STATION_MAP[stop.stationId];
    const arrival =
      stop.arrivalOffset === null ? null : service.departureMinutes + shift + stop.arrivalOffset;
    return {
      station,
      arrivalMinutes: arrival,
      departureMinutes: service.departureMinutes + shift + stop.departureOffset,
      distanceKm: stop.distanceKm,
      isBoardPoint: index === fromIndex,
      isAlightPoint: index === toIndex,
      isIntermediate: index > fromIndex && index < toIndex,
    };
  });

  const fares = service.classes.map((classId) => estimateFare(service, classId, ratio));

  return {
    tripId: `${service.number}-${originDate}`,
    serviceNumber: service.number,
    titleAr: serviceTitle(service, 'ar'),
    titleEn: serviceTitle(service, 'en'),
    lineId: service.lineId,
    date: originDate,
    direction: service.direction,
    from,
    to,
    departMinutes,
    arriveMinutes,
    departDayOffset: Math.floor(departMinutes / 1440),
    arriveDayOffset: Math.floor(arriveMinutes / 1440),
    durationMinutes,
    distanceKm,
    classes: service.classes,
    fares,
    status,
    confidence,
    platformDeparture: status.platform,
    operatingDays: service.operatingDays,
    features: service.features,
    isDirect: toIndex === fromIndex + 1,
    stops,
  };
}

interface CollectOptions {
  withStatus?: boolean;
}

function collectTrips(
  query: SearchQuery,
  now: Date,
  overrides: Override[],
  options: CollectOptions = {},
): TripResult[] {
  const from = STATION_MAP[query.from];
  const to = STATION_MAP[query.to];
  if (!from || !to || from.id === to.id) return [];

  const originCandidates = [addDays(query.date, -1), query.date];
  const results = new Map<string, TripResult>();

  for (const service of SERVICES) {
    const fromIndex = service.stops.findIndex((stop) => stop.stationId === from.id);
    const toIndex = service.stops.findIndex((stop) => stop.stationId === to.id);
    if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) continue;

    for (const originDate of originCandidates) {
      const decision = getRunDecision(service, originDate, overrides);
      if (!decision.runs) continue;
      const active = getActiveOverrides(service, originDate, overrides);
      const shift = scheduleShiftMinutes(active, service);
      const boardingWall =
        service.departureMinutes + shift + service.stops[fromIndex].departureOffset;
      const boardingDate = addDays(originDate, Math.floor(boardingWall / 1440));
      if (boardingDate !== query.date) continue;

      const trip = buildTrip({ service, originDate, fromIndex, toIndex, now, overrides });
      if (!options.withStatus) {
        // For date probing we only need existence; clear expensive bits later.
        results.set(trip.tripId, trip);
        continue;
      }
      if (query.directOnly && !trip.isDirect) continue;
      if (query.classes && query.classes.length > 0) {
        if (!trip.classes.some((classId) => query.classes?.includes(classId))) continue;
      }
      results.set(trip.tripId, trip);
    }
  }

  const trips = Array.from(results.values());
  const sort = query.sort ?? 'departure';
  const absoluteDeparture = (trip: TripResult) =>
    epochDay(trip.date) * 1440 + trip.departMinutes;
  const absoluteArrival = (trip: TripResult) =>
    epochDay(trip.date) * 1440 + trip.arriveMinutes;
  const minFare = (trip: TripResult) =>
    trip.fares.length > 0 ? Math.min(...trip.fares.map((fare) => fare.min)) : Number.MAX_SAFE_INTEGER;

  trips.sort((a, b) => {
    if (sort === 'arrival') return absoluteArrival(a) - absoluteArrival(b);
    if (sort === 'duration') return a.durationMinutes - b.durationMinutes;
    if (sort === 'price') return minFare(a) - minFare(b);
    return absoluteDeparture(a) - absoluteDeparture(b);
  });

  return trips;
}

export function summariseTrips(trips: TripResult[]): RouteSummary | null {
  if (trips.length === 0) return null;
  const first = trips[0];
  const departures = trips.map((trip) => ((trip.departMinutes % 1440) + 1440) % 1440);
  const durations = trips.map((trip) => trip.durationMinutes);
  const fares = trips.flatMap((trip) => trip.fares).filter((fare) => fare.min > 0);
  return {
    from: first.from,
    to: first.to,
    distanceKm: first.distanceKm,
    tripCount: trips.length,
    firstDepartureMinutes: Math.min(...departures),
    lastDepartureMinutes: Math.max(...departures),
    minDurationMinutes: Math.min(...durations),
    maxDurationMinutes: Math.max(...durations),
    minFare: fares.length ? Math.min(...fares.map((fare) => fare.min)) : null,
    maxFare: fares.length ? Math.max(...fares.map((fare) => fare.max)) : null,
    classIds: Array.from(new Set(trips.flatMap((trip) => trip.classes))),
    lineIds: Array.from(new Set(trips.map((trip) => trip.lineId))),
  };
}

function probeDates(
  query: SearchQuery,
  now: Date,
  overrides: Override[],
  count: number,
): string[] {
  const dates: string[] = [];
  for (let i = 1; i <= 10 && dates.length < count; i += 1) {
    const date = addDays(query.date, i);
    const probe: SearchQuery = { ...query, date, directOnly: false, classes: [] };
    const trips = collectTrips(probe, now, overrides, { withStatus: false });
    if (trips.some((trip) => trip.status.kind !== 'cancelled')) dates.push(date);
  }
  return dates;
}

export function searchTrips(query: SearchQuery, now: Date = new Date()): SearchResponse {
  const overrides = getPublishedOverrides();
  const trips = collectTrips(query, now, overrides);
  const summary = summariseTrips(trips);
  const nextDates =
    trips.length === 0 ? probeDates(query, now, overrides, 4) : [];
  return {
    query: {
      from: query.from,
      to: query.to,
      date: query.date,
      directOnly: Boolean(query.directOnly),
      classes: query.classes ?? [],
      sort: query.sort ?? 'departure',
    },
    count: trips.length,
    trips,
    summary,
    nextDates,
  };
}

export function getTripById(
  tripId: string,
  options: { fromId?: string; toId?: string; now?: Date } = {},
): TripResult | null {
  const match = /^(\d{3,4})-(\d{4}-\d{2}-\d{2})$/.exec(tripId);
  if (!match) return null;
  const [, number, date] = match;
  const service = SERVICE_BY_NUMBER[number];
  if (!service || !isValidDateString(date)) return null;

  const now = options.now ?? new Date();
  const overrides = getPublishedOverrides();
  const decision = getRunDecision(service, date, overrides);
  if (!decision.runs) return null;

  const fromIndex = options.fromId
    ? service.stops.findIndex((stop) => stop.stationId === options.fromId)
    : 0;
  const toIndex = options.toId
    ? service.stops.findIndex((stop) => stop.stationId === options.toId)
    : service.stops.length - 1;
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= toIndex) return null;

  return buildTrip({ service, originDate: date, fromIndex, toIndex, now, overrides });
}

export function getTripForServiceDate(
  serviceNumber: string,
  date: string,
  now: Date = new Date(),
): TripResult | null {
  return getTripById(`${serviceNumber}-${date}`, { now });
}

export function getServiceTripsOnDate(
  service: Service,
  date: string,
  now: Date = new Date(),
): TripResult | null {
  const overrides = getPublishedOverrides();
  const decision = getRunDecision(service, date, overrides);
  if (!decision.runs) return null;
  return buildTrip({
    service,
    originDate: date,
    fromIndex: 0,
    toIndex: service.stops.length - 1,
    now,
    overrides,
  });
}

export interface PopularRoutePair {
  fromId: string;
  toId: string;
}

export interface PopularRouteCard {
  from: Station;
  to: Station;
  trip: TripResult | null;
  minFare: number | null;
  tripCountToday: number;
  date: string;
  seasonal: boolean;
}

export function getPopularRouteCards(
  pairs: PopularRoutePair[],
  now: Date = new Date(),
): PopularRouteCard[] {
  const overrides = getPublishedOverrides();
  const clock = cairoClock(now);
  const nowAbs = epochDay(clock.date) * 1440 + clock.minutes;

  return pairs.map((pair) => {
    const from = STATION_MAP[pair.fromId];
    const to = STATION_MAP[pair.toId];
    let chosen: TripResult | null = null;
    let chosenDate = clock.date;
    let tripCountToday = 0;
    let seasonal = false;

    for (let dayOffset = 0; dayOffset < 10 && !chosen; dayOffset += 1) {
      const date = addDays(clock.date, dayOffset);
      const query: SearchQuery = { from: pair.fromId, to: pair.toId, date, sort: 'departure' };
      const trips = collectTrips(query, now, overrides);
      if (dayOffset === 0) tripCountToday = trips.length;
      const upcoming = trips.filter((trip) => {
        if (trip.status.kind === 'cancelled') return false;
        return epochDay(trip.date) * 1440 + trip.departMinutes >= nowAbs;
      });
      const candidate =
        upcoming[0] ??
        (dayOffset > 0 ? trips.find((trip) => trip.status.kind !== 'cancelled') : undefined) ??
        null;
      if (candidate) {
        chosen = candidate;
        chosenDate = date;
      }
    }

    for (const service of SERVICES) {
      if (service.lineId !== 'matrouh') continue;
      const fromIndex = service.stops.findIndex((stop) => stop.stationId === pair.fromId);
      const toIndex = service.stops.findIndex((stop) => stop.stationId === pair.toId);
      if (fromIndex !== -1 && toIndex > fromIndex) {
        seasonal = true;
        break;
      }
    }

    const minFare =
      chosen && chosen.fares.length > 0
        ? Math.min(...chosen.fares.map((fare) => fare.min))
        : null;

    return {
      from,
      to,
      trip: chosen,
      minFare,
      tripCountToday,
      date: chosenDate,
      seasonal,
    };
  });
}

export interface RoutePairCount {
  fromId: string;
  toId: string;
  serviceCount: number;
}

/** All ordered station pairs with at least one direct service (for sitemap/SEO). */
export function getAllRoutePairs(): RoutePairCount[] {
  const counts = new Map<string, RoutePairCount>();
  for (const service of SERVICES) {
    const stops = service.stops;
    for (let i = 0; i < stops.length; i += 1) {
      for (let j = i + 1; j < stops.length; j += 1) {
        const from = STATION_MAP[stops[i].stationId];
        const to = STATION_MAP[stops[j].stationId];
        if (!from || !to || from.tier === 4 || to.tier === 4) continue;
        const key = `${from.id}>${to.id}`;
        const existing = counts.get(key);
        if (existing) existing.serviceCount += 1;
        else counts.set(key, { fromId: from.id, toId: to.id, serviceCount: 1 });
      }
    }
  }
  return Array.from(counts.values()).sort((a, b) => b.serviceCount - a.serviceCount);
}

/** Deterministic hash used by demos (platforms, pseudo sensors). */
export function stablePlatform(serviceNumber: string, stationId: string, date: string): string {
  return String(1 + (hashString(`${serviceNumber}:${stationId}:${date}`) % 8));
}

export function nextSevenDates(fromDate: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(fromDate, index));
}

export function describeSort(locale: Locale, sort: SearchSort): string {
  const labels: Record<SearchSort, { ar: string; en: string }> = {
    departure: { ar: 'وقت التحرك', en: 'Departure' },
    arrival: { ar: 'وقت الوصول', en: 'Arrival' },
    duration: { ar: 'مدة الرحلة', en: 'Duration' },
    price: { ar: 'الأقل سعرًا', en: 'Price' },
  };
  return locale === 'ar' ? labels[sort].ar : labels[sort].en;
}
