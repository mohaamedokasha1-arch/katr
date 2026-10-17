/**
 * Core domain types for Rakeb.
 *
 * The model is intentionally relational and date-aware:
 * - a `Service` is a repeating timetable definition (the base schedule);
 * - a trip is a Service *instance* on a concrete date (`905-2026-10-17`);
 * - dates are always stored as Cairo-local `YYYY-MM-DD` strings and times as
 *   "minutes after midnight" so that overnight trains stay trivial to reason
 *   about (`minutes >= 1440` means the next calendar day).
 */

export type Locale = 'ar' | 'en';

/** 0 = Sunday … 6 = Saturday (matching JavaScript's getUTCDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type StationTier = 1 | 2 | 3 | 4;

export type AmenityId =
  | 'tickets'
  | 'machine'
  | 'waiting'
  | 'cafe'
  | 'taxi'
  | 'atm'
  | 'accessible'
  | 'parking';

export interface Station {
  /** Stable internal id used in URLs — never translated. */
  id: string;
  /** Human-facing station code, e.g. CAI-RAM. */
  code: string;
  nameAr: string;
  nameEn: string;
  /** Common colloquial names used by the smart search normaliser. */
  aliasesAr: string[];
  aliasesEn: string[];
  governorateAr: string;
  governorateEn: string;
  lat: number;
  lng: number;
  tier: StationTier;
  lineIds: string[];
  amenities: AmenityId[];
  /** Tier 4 request stops are searchable only inside a trip, not as endpoints. */
  searchable: boolean;
  /** Runtime-overridable operational status. */
  status: 'active' | 'maintenance';
  descriptionAr: string;
  descriptionEn: string;
}

export type TrainClassId =
  | 'talgo'
  | 'sleeping'
  | 'haya'
  | 'russian'
  | 'ac1'
  | 'ac2'
  | 'third_ac'
  | 'third';

export interface TrainClass {
  id: TrainClassId;
  nameAr: string;
  nameEn: string;
  shortAr: string;
  shortEn: string;
  descriptionAr: string;
  descriptionEn: string;
  /** Visual tone used by the little seat glyph. */
  tone: 'gold' | 'violet' | 'blue' | 'teal' | 'slate';
  hasAC: boolean;
  order: number;
}

export interface SeasonWindow {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

export interface RailLine {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  shortAr: string;
  shortEn: string;
  color: string;
  regionAr: string;
  regionEn: string;
  descriptionAr: string;
  descriptionEn: string;
  stationIds: string[];
  seasonal: boolean;
  season?: SeasonWindow;
  sortOrder: number;
}

export interface ServiceStop {
  stationId: string;
  /** Offset from the train's origin departure. First stop = null. */
  arrivalOffset: number | null;
  departureOffset: number;
  distanceKm: number;
}

export type OperatingDays =
  | { type: 'daily' }
  | { type: 'weekdays'; days: Weekday[] }
  | { type: 'except'; days: Weekday[] };

export type ServiceFeature =
  | 'buffet'
  | 'power'
  | 'wifi'
  | 'beds'
  | 'luggage'
  | 'family';

export interface FareRange {
  classId: TrainClassId;
  min: number;
  max: number;
}

export interface Service {
  /** Official-ish train number, also the public share id. */
  number: string;
  lineId: string;
  /** Optional branded name, e.g. "قطار النوم". */
  titleAr?: string;
  titleEn?: string;
  /** Cairo-local wall clock at the origin station. */
  departureMinutes: number;
  direction: 'outbound' | 'inbound';
  patternId: string;
  stops: ServiceStop[];
  classes: TrainClassId[];
  fares: FareRange[];
  operatingDays: OperatingDays;
  season?: SeasonWindow;
  features: ServiceFeature[];
  /** How many days ago the timetable was last human/automated verified. */
  lastVerifiedDaysAgo: number;
  popularity: number;
  notesAr?: string;
  notesEn?: string;
}

export type OverrideType =
  | 'delay'
  | 'cancellation'
  | 'schedule_change'
  | 'extra_run'
  | 'maintenance';

export type OverrideStatus = 'pending' | 'published' | 'rejected';

export type DataSource = 'official' | 'ops' | 'partner' | 'community';

export interface Override {
  id: string;
  type: OverrideType;
  serviceNumber?: string;
  lineId?: string;
  fromDate: string;
  toDate: string;
  delayMinutes?: number;
  newDepartureMinutes?: number;
  reasonAr: string;
  reasonEn: string;
  source: DataSource;
  status: OverrideStatus;
  createdBy: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export type ReportKind =
  | 'still_waiting'
  | 'delayed'
  | 'moving'
  | 'arrived'
  | 'cancelled';

export type ReportStatus = 'pending' | 'confirmed' | 'rejected';

export interface CrowdReport {
  id: string;
  serviceNumber: string;
  date: string;
  stationId: string;
  kind: ReportKind;
  delayMinutes?: number;
  note?: string;
  status: ReportStatus;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  /** Coarse fingerprint; the API never stores raw IPs. */
  reporterHash: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  actorRole: UserRole | 'system';
  action: string;
  entity: string;
  entityId: string;
  summaryAr: string;
  summaryEn: string;
}

export type UserRole = 'admin' | 'editor';

export interface AdminSession {
  name: string;
  email: string;
  role: UserRole;
  exp: number;
}

export interface NotificationSubscription {
  id: string;
  tripId: string;
  minutesBefore: number;
  channel: 'web-push' | 'email';
  contact?: string;
  createdAt: string;
}

export type SyncRunStatus = 'ok' | 'warning' | 'failed';

export interface SyncRun {
  id: string;
  source: string;
  startedAt: string;
  durationMs: number;
  fetched: number;
  accepted: number;
  rejected: number;
  status: SyncRunStatus;
  messageAr: string;
  messageEn: string;
}

/** The four public trust levels described in the product spec. */
export type ConfidenceLevel = 'official' | 'standard' | 'community' | 'stale';

export interface Confidence {
  level: ConfidenceLevel;
  /** 0–100, used for admin analytics only; always shipped with an explanation. */
  score: number;
  lastUpdatedIso: string;
  communityConfirmations: number;
  /** Structured reasons, rendered bilingually by the UI. */
  reasonKeys: ConfidenceReason[];
}

export type ConfidenceReason =
  | 'partner_feed'
  | 'admin_published'
  | 'base_timetable'
  | 'crowd_confirmed'
  | 'crowd_partial'
  | 'stale_verification'
  | 'live_scraper';

export type LiveStatusKind =
  | 'scheduled'
  | 'on_time'
  | 'boarding'
  | 'delayed'
  | 'in_transit'
  | 'arrived'
  | 'cancelled';

export interface LiveStatusView {
  kind: LiveStatusKind;
  delayMinutes: number;
  /** Minutes since midnight, Cairo, after applying any delay. */
  expectedDepartureMinutes: number;
  expectedArrivalMinutes: number;
  platform?: string;
  updatedAtIso: string;
  source: DataSource | 'schedule';
  noteAr?: string;
  noteEn?: string;
}

export interface FareEstimate {
  classId: TrainClassId;
  min: number;
  max: number;
}

export interface TripResult {
  tripId: string;
  serviceNumber: string;
  titleAr: string;
  titleEn: string;
  lineId: string;
  date: string;
  direction: 'outbound' | 'inbound';
  from: Station;
  to: Station;
  /** Minutes since Cairo midnight, including day overflow. */
  departMinutes: number;
  arriveMinutes: number;
  departDayOffset: number;
  arriveDayOffset: number;
  durationMinutes: number;
  distanceKm: number;
  classes: TrainClassId[];
  fares: FareEstimate[];
  status: LiveStatusView;
  confidence: Confidence;
  platformDeparture?: string;
  operatingDays: OperatingDays;
  features: ServiceFeature[];
  isDirect: boolean;
  stops: Array<{
    station: Station;
    arrivalMinutes: number | null;
    departureMinutes: number;
    distanceKm: number;
    isBoardPoint: boolean;
    isAlightPoint: boolean;
    isIntermediate: boolean;
  }>;
}

export interface StationSearchOption {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  governorateAr: string;
  governorateEn: string;
  tier: StationTier;
  lineIds: string[];
  lat: number;
  lng: number;
  searchable: boolean;
  aliasesAr: string[];
  aliasesEn: string[];
}

export interface BoardRow {
  tripId: string;
  serviceNumber: string;
  titleAr: string;
  titleEn: string;
  lineId: string;
  kind: 'departure' | 'arrival';
  /** The other end of the trip (destination for departures, origin for arrivals). */
  counterpart: Pick<Station, 'id' | 'nameAr' | 'nameEn'>;
  scheduledMinutes: number;
  dayOffset: number;
  expectedMinutes: number;
  status: LiveStatusView;
  confidence: Confidence;
  platform?: string;
}

export interface StationBoard {
  station: Pick<Station, 'id' | 'nameAr' | 'nameEn' | 'code'>;
  generatedAtIso: string;
  windowStartIso: string;
  windowEndIso: string;
  departures: BoardRow[];
  arrivals: BoardRow[];
}

export interface SearchResponse {
  query: {
    from: string;
    to: string;
    date: string;
    directOnly: boolean;
    classes: TrainClassId[];
    sort: SearchSort;
  };
  count: number;
  trips: TripResult[];
  summary: RouteSummary | null;
  nextDates: string[];
}

export type SearchSort = 'departure' | 'arrival' | 'duration' | 'price';

export interface RouteSummary {
  from: Station;
  to: Station;
  distanceKm: number;
  tripCount: number;
  firstDepartureMinutes: number;
  lastDepartureMinutes: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  minFare: number | null;
  maxFare: number | null;
  classIds: TrainClassId[];
  lineIds: string[];
}

export interface RoutePair {
  fromId: string;
  toId: string;
  tripCount: number;
}

export interface GuideBlock {
  type: 'paragraph' | 'heading' | 'list' | 'callout';
  textAr?: string;
  textEn?: string;
  itemsAr?: string[];
  itemsEn?: string[];
  tone?: 'info' | 'warning' | 'success';
}

export interface GuideArticle {
  slug: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  categoryAr: string;
  categoryEn: string;
  readingMinutes: number;
  updatedAt: string;
  heroAccent: string;
  blocks: GuideBlock[];
  relatedRoutes: Array<{ fromId: string; toId: string }>;
}

export interface FaqItem {
  id: string;
  qAr: string;
  qEn: string;
  aAr: string;
  aEn: string;
  category: 'trust' | 'search' | 'alerts' | 'booking' | 'access';
}
