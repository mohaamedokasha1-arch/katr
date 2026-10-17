import type {
  FareEstimate,
  TrainClassId,
  TripResult,
} from '@/types/rail';
import { toUtcDate } from '@/lib/time';

/**
 * Small, typed localStorage layer. No account required — favourites and
 * reminders live on the device, exactly as the product spec asks.
 */

const KEYS = {
  trips: 'rakeb:savedTrips:v1',
  reminders: 'rakeb:reminders:v1',
  itineraries: 'rakeb:itineraries:v1',
  recent: 'rakeb:recentSearches:v1',
} as const;

export const STORAGE_EVENT = 'rakeb:storage';

export interface TripSnapshot {
  tripId: string;
  serviceNumber: string;
  titleAr: string;
  titleEn: string;
  date: string;
  fromId: string;
  fromNameAr: string;
  fromNameEn: string;
  toId: string;
  toNameAr: string;
  toNameEn: string;
  departMinutes: number;
  arriveMinutes: number;
  durationMinutes: number;
  lowestFare: number | null;
}

export interface SavedTripSummary extends TripSnapshot {
  savedAt: string;
}

export interface SavedItinerary extends TripSnapshot {
  lineId: string;
  classes: TrainClassId[];
  fares: FareEstimate[];
  stops: Array<{
    stationId: string;
    nameAr: string;
    nameEn: string;
    arrivalMinutes: number | null;
    departureMinutes: number;
    distanceKm: number;
  }>;
  savedAt: string;
}

export interface SavedReminder extends TripSnapshot {
  id: string;
  minutesBefore: number;
  remindAtIso: string;
  createdAt: string;
  notified?: boolean;
}

export interface RecentSearch {
  fromId: string;
  toId: string;
  fromNameAr: string;
  fromNameEn: string;
  toNameAr: string;
  toNameEn: string;
  date: string;
  at: string;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch {
    // Storage can be unavailable (private mode / quota).
  }
}

export function tripToSnapshot(trip: TripResult): TripSnapshot {
  return {
    tripId: trip.tripId,
    serviceNumber: trip.serviceNumber,
    titleAr: trip.titleAr,
    titleEn: trip.titleEn,
    date: trip.date,
    fromId: trip.from.id,
    fromNameAr: trip.from.nameAr,
    fromNameEn: trip.from.nameEn,
    toId: trip.to.id,
    toNameAr: trip.to.nameAr,
    toNameEn: trip.to.nameEn,
    departMinutes: trip.departMinutes,
    arriveMinutes: trip.arriveMinutes,
    durationMinutes: trip.durationMinutes,
    lowestFare: trip.fares.length ? Math.min(...trip.fares.map((fare) => fare.min)) : null,
  };
}

export function tripToItinerary(trip: TripResult): SavedItinerary {
  return {
    ...tripToSnapshot(trip),
    lineId: trip.lineId,
    classes: trip.classes,
    fares: trip.fares,
    stops: trip.stops.map((stop) => ({
      stationId: stop.station.id,
      nameAr: stop.station.nameAr,
      nameEn: stop.station.nameEn,
      arrivalMinutes: stop.arrivalMinutes,
      departureMinutes: stop.departureMinutes,
      distanceKm: stop.distanceKm,
    })),
    savedAt: new Date().toISOString(),
  };
}

export function getSavedTrips(): SavedTripSummary[] {
  return read<SavedTripSummary[]>(KEYS.trips, []);
}

export function isTripSaved(tripId: string): boolean {
  return getSavedTrips().some((trip) => trip.tripId === tripId);
}

export function toggleSavedTrip(snapshot: TripSnapshot): boolean {
  const current = getSavedTrips();
  const exists = current.some((trip) => trip.tripId === snapshot.tripId);
  if (exists) {
    write(
      KEYS.trips,
      current.filter((trip) => trip.tripId !== snapshot.tripId),
    );
    removeReminderByTrip(snapshot.tripId);
    return false;
  }
  write(KEYS.trips, [{ ...snapshot, savedAt: new Date().toISOString() }, ...current].slice(0, 50));
  return true;
}

export function removeSavedTrip(tripId: string): void {
  write(
    KEYS.trips,
    getSavedTrips().filter((trip) => trip.tripId !== tripId),
  );
  removeReminderByTrip(tripId);
}

export function getItineraries(): SavedItinerary[] {
  return read<SavedItinerary[]>(KEYS.itineraries, []);
}

export function isItinerarySaved(tripId: string): boolean {
  return getItineraries().some((trip) => trip.tripId === tripId);
}

export function saveItinerary(itinerary: SavedItinerary): void {
  const current = getItineraries().filter((item) => item.tripId !== itinerary.tripId);
  write(KEYS.itineraries, [itinerary, ...current].slice(0, 30));
}

export function removeItinerary(tripId: string): void {
  write(
    KEYS.itineraries,
    getItineraries().filter((item) => item.tripId !== tripId),
  );
}

export function getReminders(): SavedReminder[] {
  return read<SavedReminder[]>(KEYS.reminders, []).sort((a, b) =>
    a.remindAtIso < b.remindAtIso ? -1 : 1,
  );
}

export function addReminder(snapshot: TripSnapshot, minutesBefore: number): SavedReminder {
  const departure = toUtcDate(snapshot.date, snapshot.departMinutes);
  const remindAt = new Date(departure.getTime() - minutesBefore * 60_000);
  const reminder: SavedReminder = {
    ...snapshot,
    id: `${snapshot.tripId}:${minutesBefore}`,
    minutesBefore,
    remindAtIso: remindAt.toISOString(),
    createdAt: new Date().toISOString(),
  };
  const current = getReminders().filter(
    (item) => !(item.tripId === snapshot.tripId && item.minutesBefore === minutesBefore),
  );
  write(KEYS.reminders, [reminder, ...current].slice(0, 50));
  return reminder;
}

export function removeReminder(id: string): void {
  write(
    KEYS.reminders,
    getReminders().filter((reminder) => reminder.id !== id),
  );
}

export function removeReminderByTrip(tripId: string): void {
  write(
    KEYS.reminders,
    getReminders().filter((reminder) => reminder.tripId !== tripId),
  );
}

export function markReminderNotified(id: string): void {
  write(
    KEYS.reminders,
    getReminders().map((reminder) =>
      reminder.id === id ? { ...reminder, notified: true } : reminder,
    ),
  );
}

export function getAlertsCount(): number {
  return getSavedTrips().length + getReminders().length;
}

export function getRecentSearches(): RecentSearch[] {
  return read<RecentSearch[]>(KEYS.recent, []);
}

export function addRecentSearch(entry: Omit<RecentSearch, 'at'>): void {
  const current = getRecentSearches().filter(
    (item) => !(item.fromId === entry.fromId && item.toId === entry.toId),
  );
  write(KEYS.recent, [{ ...entry, at: new Date().toISOString() }, ...current].slice(0, 5));
}

export function subscribeStorage(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(STORAGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(STORAGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}
