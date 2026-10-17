import { STATIONS } from '@/lib/data/stations';
import { LINES } from '@/lib/data/lines';
import { SERVICES } from '@/lib/data/services';
import { searchTrips } from '@/lib/search';
import { getStationBoard } from '@/lib/live';
import { addDays, formatClock, todayCairo } from '@/lib/time';
import { getRunDecision } from '@/lib/schedule';
import { getPublishedOverrides } from '@/lib/store';

const errors: string[] = [];
const stationIds = new Set(STATIONS.map((s) => s.id));
const numbers = new Set<string>();

for (const s of STATIONS) {
  if (s.tier < 4 && !s.lineIds.length) errors.push(`Station ${s.id} has no line`);
}
for (const line of LINES) {
  for (const id of line.stationIds) if (!stationIds.has(id)) errors.push(`Line ${line.id} references ${id}`);
}
for (const service of SERVICES) {
  if (numbers.has(service.number)) errors.push(`Duplicate service ${service.number}`);
  numbers.add(service.number);
  if (!service.stops.length) errors.push(`Service ${service.number} has no stops`);
  let prev = -1;
  for (const stop of service.stops) {
    if (!stationIds.has(stop.stationId)) errors.push(`Service ${service.number} bad station ${stop.stationId}`);
    if (stop.arrivalOffset !== null && stop.arrivalOffset < prev) errors.push(`Service ${service.number} time order`);
    prev = stop.departureOffset;
  }
  for (const classId of service.classes) {
    if (!service.fares.some((f) => f.classId === classId)) errors.push(`Service ${service.number} missing fare ${classId}`);
  }
  if (service.stops[0].departureOffset !== 0) errors.push(`Service ${service.number} origin offset`);
}

const today = todayCairo();
const tomorrow = addDays(today, 1);
console.log('Counts', { stations: STATIONS.length, lines: LINES.length, services: SERVICES.length, today });
console.log('Search Cairo→Alex', searchTrips({ from: 'cairo-ramses', to: 'alexandria-misr', date: today }).count);
console.log('Search Cairo→Aswan', searchTrips({ from: 'cairo-ramses', to: 'aswan', date: today }).count);
console.log('Search Alex→Cairo', searchTrips({ from: 'alexandria-misr', to: 'cairo-ramses', date: today }).count);
console.log('Search Cairo→Fayoum', searchTrips({ from: 'cairo-ramses', to: 'fayoum', date: today }).count);
console.log('Search Cairo→Matrouh', searchTrips({ from: 'cairo-ramses', to: 'matrouh', date: today }).count);
const res = searchTrips({ from: 'cairo-ramses', to: 'alexandria-misr', date: today });
for (const t of res.trips.slice(0, 4)) {
  console.log(t.serviceNumber, formatClock(t.departMinutes), '→', formatClock(t.arriveMinutes), t.durationMinutes, t.status.kind, t.confidence.level, t.fares[0]);
}
console.log('summary', res.summary);
console.log('nextDates empty?', searchTrips({ from: 'cairo-ramses', to: 'matrouh', date: tomorrow }).nextDates);
const board = getStationBoard({ stationId: 'cairo-ramses', direction: 'departure' });
console.log('Board rows', board.departures.length, board.departures.slice(0, 3).map((r) => [r.serviceNumber, formatClock(r.scheduledMinutes), r.status.kind]));
console.log('Overrides', getPublishedOverrides().length, 'runs 1632', getRunDecision(SERVICES.find((s) => s.number === '1632')!, today, getPublishedOverrides()));
if (errors.length) {
  console.error('ERRORS', errors);
  process.exit(1);
}
console.log('Data valid ✔');
