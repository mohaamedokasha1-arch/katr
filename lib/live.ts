import type {
  BoardRow,
  Confidence,
  ConfidenceReason,
  CrowdReport,
  LiveStatusKind,
  LiveStatusView,
  Override,
  Service,
  Station,
  StationBoard,
} from '@/types/rail';
import { STATION_MAP } from '@/lib/data/stations';
import { SERVICES } from '@/lib/data/services';
import { computeConsensus, getConsensus } from '@/lib/reports';
import {
  getActiveOverrides,
  getRunDecision,
  publishedDelayMinutes,
  scheduleShiftMinutes,
  serviceTitle,
  type RunDecision,
} from '@/lib/schedule';
import { getPublishedOverrides, listReports } from '@/lib/store';
import {
  addDays,
  cairoClock,
  epochDay,
  formatClock,
  formatClock12,
  minutesDayOffset,
  todayCairo,
  toIso,
} from '@/lib/time';
import { hashString } from '@/lib/utils';

interface StatusResult {
  status: LiveStatusView;
  confidence: Confidence;
  decision: RunDecision;
  shift: number;
}

export interface TripStatusArgs {
  service: Service;
  originDate: string;
  fromIndex: number;
  toIndex: number;
  now: Date;
  overrides?: Override[];
  reports?: CrowdReport[];
}

// NOTE: platform numbers are NOT fabricated. No verified platform source
// exists yet, so BoardRow.platform stays undefined and the UI shows '—'
// until a real source/admin entry provides one.

// NOTE: there is intentionally NO synthetic/'sensor' delay. Delays come
// only from (a) human-reviewed published overrides or (b) confirmed rider
// consensus. A hash of the train number is not an observation.

function buildConfidence(args: {
  service: Service;
  now: Date;
  official: Override | null;
  communityConfirmed: boolean;
  communityTotal: number;
  communityLatestIso: string | null;
  sensorApplied: boolean;
}): Confidence {
  const {
    service,
    now,
    official,
    communityConfirmed,
    communityTotal,
    communityLatestIso,
    sensorApplied,
  } = args;
  const reasons: ConfidenceReason[] = [];
  let level: Confidence['level'] = 'standard';
  let score = 84;
  let lastUpdated = new Date(
    now.getTime() - service.lastVerifiedDaysAgo * 86_400_000,
  ).toISOString();

  if (official) {
    level = 'official';
    score = 97;
    reasons.push('admin_published');
    if (official.source === 'official' || official.source === 'partner') {
      reasons.push('partner_feed');
    }
    lastUpdated = official.reviewedAt ?? official.createdAt;
  } else if (communityConfirmed) {
    level = 'community';
    score = 76;
    reasons.push('crowd_confirmed');
    lastUpdated = communityLatestIso ?? now.toISOString();
  } else if (service.lastVerifiedDaysAgo > 30) {
    level = 'stale';
    score = 45;
    reasons.push('stale_verification', 'base_timetable');
  } else {
    level = 'standard';
    score = 85;
    reasons.push('base_timetable');
  }

  if (sensorApplied && level !== 'official') reasons.push('live_scraper');
  if (communityTotal > 0 && !communityConfirmed) reasons.push('crowd_partial');

  return {
    level,
    score,
    lastUpdatedIso: lastUpdated,
    communityConfirmations: communityTotal,
    reasonKeys: Array.from(new Set(reasons)),
  };
}

/**
 * Resolve the live state of one segment of a trip.
 *
 * Source precedence is intentional: a human-reviewed published change beats
 * crowd consensus, which beats an automated observation. This hierarchy is
 * shown to the rider through the confidence badge rather than hidden.
 */
export function getTripStatus(args: TripStatusArgs): StatusResult {
  const { service, originDate, fromIndex, toIndex, now } = args;
  const overrides = args.overrides ?? getPublishedOverrides();
  const active = getActiveOverrides(service, originDate, overrides);
  const decision = getRunDecision(service, originDate, overrides);
  const shift = scheduleShiftMinutes(active, service);

  const fromStop = service.stops[fromIndex];
  const toStop = service.stops[toIndex];
  const departureWall = service.departureMinutes + shift + fromStop.departureOffset;
  const arrivalOffset = toStop.arrivalOffset ?? toStop.departureOffset;
  const arrivalWall = service.departureMinutes + shift + arrivalOffset;

  const originEpoch = epochDay(originDate) * 1440;
  const departureAbs = originEpoch + departureWall;
  const arrivalAbs = originEpoch + arrivalWall;
  const clock = cairoClock(now);
  const nowAbs = epochDay(clock.date) * 1440 + clock.minutes;
  const today = clock.date;
  const boardingDate = addDays(originDate, minutesDayOffset(departureWall));

  const reports = args.reports ?? getConsensus(service.number, originDate).reports;
  const consensus = computeConsensus(reports);

  const cancellation = decision.cancelled;
  const delayOverride = active
    .filter((override) => override.type === 'delay')
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
  const officialDelay =
    !cancellation && active.some((override) => override.type === 'delay')
      ? publishedDelayMinutes(active)
      : 0;
  const communityDelay =
    !cancellation && !officialDelay && consensus.confirmed ? consensus.delayMinutes : 0;
  const sensor = 0; // kept for confidence-shape compatibility; always 0 (no fake live feed)
  const delayMinutes = cancellation ? 0 : officialDelay || communityDelay;

  let kind: LiveStatusKind;
  if (cancellation) {
    kind = 'cancelled';
  } else if (nowAbs >= arrivalAbs + delayMinutes) {
    kind = 'arrived';
  } else if (nowAbs >= departureAbs + delayMinutes) {
    kind = 'in_transit';
  } else if (nowAbs >= departureAbs - 30 + delayMinutes) {
    kind = delayMinutes > 0 ? 'delayed' : 'boarding';
  } else if (delayMinutes > 0) {
    kind = 'delayed';
  } else if (boardingDate === today) {
    kind = 'on_time';
  } else if (boardingDate > today) {
    kind = 'scheduled';
  } else {
    kind = 'arrived';
  }

  const official = cancellation
    ? (decision.cancellationSource ?? null)
    : (delayOverride ??
      active.find((override) => override.type === 'schedule_change') ??
      null);

  const platform: string | undefined = undefined; // no verified platform source yet

  const confidence = buildConfidence({
    service,
    now,
    official,
    communityConfirmed: consensus.confirmed,
    communityTotal: consensus.total,
    communityLatestIso: consensus.latestAtIso,
    sensorApplied: sensor > 0,
  });

  const noteAr = cancellation
    ? decision.cancellationReasonAr
    : officialDelay > 0
      ? delayOverride?.reasonAr
      : communityDelay > 0
        ? `تأكيد مجتمعي من ${consensus.uniqueReporters} ركاب على تأخير ${communityDelay} دقيقة.`
        : undefined;
  const noteEn = cancellation
    ? decision.cancellationReasonEn
    : officialDelay > 0
      ? delayOverride?.reasonEn
      : communityDelay > 0
        ? `Community confirmation from ${consensus.uniqueReporters} riders for a ${communityDelay}-minute delay.`
        : undefined;

  const updatedAtIso = cancellation || officialDelay > 0
    ? (official?.reviewedAt ?? official?.createdAt ?? now.toISOString())
    : communityDelay > 0
      ? (consensus.latestAtIso ?? now.toISOString())
      : now.toISOString();

  return {
    status: {
      kind,
      delayMinutes,
      expectedDepartureMinutes: departureWall + delayMinutes,
      expectedArrivalMinutes: arrivalWall + delayMinutes,
      platform,
      updatedAtIso,
      source: cancellation
        ? (decision.cancellationSource?.source ?? 'ops')
        : officialDelay > 0
          ? (delayOverride?.source ?? 'ops')
          : communityDelay > 0
            ? 'community'
            : sensor > 0
              ? 'official'
              : 'schedule',
      noteAr,
      noteEn,
    },
    confidence,
    decision,
    shift,
  };
}

/** Delay expressed for compact board rows. */
export function expectedClock(totalMinutes: number): string {
  return formatClock(totalMinutes);
}

export function expectedClock12(totalMinutes: number): { time: string; suffix: string } {
  return formatClock12(totalMinutes);
}

// ── Station boards ────────────────────────────────────────────────────────

interface BoardOptions {
  stationId: string;
  direction: 'departure' | 'arrival';
  now?: Date;
  windowBeforeMinutes?: number;
  windowAfterMinutes?: number;
  limit?: number;
}

export function getStationBoard(options: BoardOptions): StationBoard {
  const now = options.now ?? new Date();
  const station = STATION_MAP[options.stationId];
  if (!station) throw new Error(`Unknown station ${options.stationId}`);

  const nowDate = todayCairo(now);
  const clock = cairoClock(now);
  const todayEpoch = epochDay(nowDate);
  const nowAbs = todayEpoch * 1440 + clock.minutes;
  const before = options.windowBeforeMinutes ?? (options.direction === 'departure' ? 45 : 30);
  const after = options.windowAfterMinutes ?? (options.direction === 'departure' ? 240 : 210);

  const overrides = getPublishedOverrides();
  const allReports = listReports();
  const reportsIndex = new Map<string, CrowdReport[]>();
  for (const report of allReports) {
    const key = `${report.serviceNumber}:${report.date}`;
    const list = reportsIndex.get(key) ?? [];
    list.push(report);
    reportsIndex.set(key, list);
  }

  const rows: Array<BoardRow & { sortKey: number }> = [];
  const originCandidates = [addDays(nowDate, -1), nowDate, addDays(nowDate, 1)];

  for (const service of SERVICES) {
    const index = service.stops.findIndex((stop) => stop.stationId === station.id);
    if (index === -1) continue;
    if (options.direction === 'departure' && index === service.stops.length - 1) continue;
    if (options.direction === 'arrival' && index === 0) continue;

    for (const originDate of originCandidates) {
      const decision = getRunDecision(service, originDate, overrides);
      if (!decision.runs) continue;
      const active = getActiveOverrides(service, originDate, overrides);
      const shift = scheduleShiftMinutes(active, service);
      const stop = service.stops[index];
      const wall =
        options.direction === 'departure'
          ? service.departureMinutes + shift + stop.departureOffset
          : service.departureMinutes + shift + (stop.arrivalOffset ?? stop.departureOffset);
      const abs = epochDay(originDate) * 1440 + wall;
      if (abs < nowAbs - before || abs > nowAbs + after) continue;

      const fromIndex = options.direction === 'departure' ? index : 0;
      const toIndex = options.direction === 'departure' ? service.stops.length - 1 : index;
      const reports = reportsIndex.get(`${service.number}:${originDate}`) ?? [];
      const resolved = getTripStatus({
        service,
        originDate,
        fromIndex,
        toIndex,
        now,
        overrides,
        reports,
      });

      const counterpartId =
        options.direction === 'departure'
          ? service.stops[service.stops.length - 1].stationId
          : service.stops[0].stationId;
      const counterpart = STATION_MAP[counterpartId];

      const expected = wall + resolved.status.delayMinutes;
      const row: BoardRow & { sortKey: number } = {
        tripId: `${service.number}-${originDate}`,
        serviceNumber: service.number,
        titleAr: serviceTitle(service, 'ar'),
        titleEn: serviceTitle(service, 'en'),
        lineId: service.lineId,
        kind: options.direction,
        counterpart: {
          id: counterpart.id,
          nameAr: counterpart.nameAr,
          nameEn: counterpart.nameEn,
        },
        scheduledMinutes: abs - todayEpoch * 1440,
        dayOffset: Math.floor((abs - todayEpoch * 1440) / 1440),
        expectedMinutes: expected - todayEpoch * 1440,
        status: resolved.status,
        confidence: resolved.confidence,
        platform:
          resolved.status.platform ??
          undefined, // platform unknown — never fabricated
        sortKey: abs,
      };
      rows.push(row);
    }
  }

  rows.sort((a, b) => a.sortKey - b.sortKey);
  const limited = rows.slice(0, options.limit ?? 30);

  return {
    station: {
      id: station.id,
      nameAr: station.nameAr,
      nameEn: station.nameEn,
      code: station.code,
    },
    generatedAtIso: now.toISOString(),
    windowStartIso: toIso(nowDate, clock.minutes - before),
    windowEndIso: toIso(nowDate, clock.minutes + after),
    departures: limited.filter((row) => row.kind === 'departure'),
    arrivals: limited.filter((row) => row.kind === 'arrival'),
  };
}
// ── Network snapshot ──────────────────────────────────────────────────────

export interface NetworkSnapshot {
  date: string;
  generatedAtIso: string;
  total: number;
  onTime: number;
  delayed: number;
  cancelled: number;
  maxDelay: number;
}

export function getNetworkSnapshot(now: Date = new Date()): NetworkSnapshot {
  const today = todayCairo(now);
  const overrides = getPublishedOverrides();
  let onTime = 0;
  let delayed = 0;
  let cancelled = 0;
  let maxDelay = 0;
  let total = 0;

  for (const service of SERVICES) {
    const decision = getRunDecision(service, today, overrides);
    if (!decision.runs) continue;
    total += 1;
    if (decision.cancelled) {
      cancelled += 1;
      continue;
    }
    const reports = getConsensus(service.number, today).reports;
    const resolved = getTripStatus({
      service,
      originDate: today,
      fromIndex: 0,
      toIndex: service.stops.length - 1,
      now,
      overrides,
      reports,
    });
    if (resolved.status.delayMinutes > 0) {
      delayed += 1;
      maxDelay = Math.max(maxDelay, resolved.status.delayMinutes);
    } else if (
      resolved.status.kind === 'on_time' ||
      resolved.status.kind === 'boarding' ||
      resolved.status.kind === 'scheduled' ||
      resolved.status.kind === 'in_transit'
    ) {
      onTime += 1;
    }
  }

  return {
    date: today,
    generatedAtIso: now.toISOString(),
    total,
    onTime,
    delayed,
    cancelled,
    maxDelay,
  };
}

export function boardStationType(station: Station): 'hub' | 'main' | 'stop' {
  if (station.tier === 1) return 'hub';
  if (station.tier === 2) return 'main';
  return 'stop';
}
