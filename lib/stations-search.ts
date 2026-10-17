import type { StationSearchOption } from '@/types/rail';
import { STATION_OPTIONS } from '@/lib/data/stations';
import { normalizeSearchText, stationMatchScore } from '@/lib/text';
import { distanceKm } from '@/lib/utils';

const TIER_WEIGHT: Record<number, number> = { 1: 24, 2: 14, 3: 4, 4: 0 };

export interface RankedStation extends StationSearchOption {
  score: number;
  distance?: number;
}

export function searchStationOptions(
  query: string,
  options: { limit?: number; includeTier4?: boolean; prioritize?: string[]; lat?: number; lng?: number } = {},
): RankedStation[] {
  const limit = options.limit ?? 8;
  const normalized = normalizeSearchText(query);
  const ranked: RankedStation[] = [];

  for (const station of STATION_OPTIONS) {
    if (!options.includeTier4 && !station.searchable) continue;
    let score = normalized ? stationMatchScore(station, query) : 0;
    if (!normalized) score = 1;
    if (score <= 0) continue;
    score += TIER_WEIGHT[station.tier] ?? 0;
    if (options.prioritize?.includes(station.id)) score += 18;
    const distance =
      typeof options.lat === 'number' && typeof options.lng === 'number'
        ? distanceKm({ lat: options.lat, lng: options.lng }, { lat: station.lat, lng: station.lng })
        : undefined;
    if (distance !== undefined) score += Math.max(0, 22 - distance / 14);
    ranked.push({ ...station, score, distance });
  }

  ranked.sort((a, b) => b.score - a.score || a.nameAr.localeCompare(b.nameAr, 'ar'));
  return ranked.slice(0, limit);
}

export function nearestStations(lat: number, lng: number, limit = 3): RankedStation[] {
  return STATION_OPTIONS.filter((station) => station.searchable)
    .map((station) => ({
      ...station,
      score: 0,
      distance: distanceKm({ lat, lng }, { lat: station.lat, lng: station.lng }),
    }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
    .slice(0, limit);
}

export function getStationOption(id: string): StationSearchOption | undefined {
  return STATION_OPTIONS.find((station) => station.id === id);
}

export function stationDisplayName(
  station: Pick<StationSearchOption, 'nameAr' | 'nameEn'> | undefined,
  locale: 'ar' | 'en',
): string {
  if (!station) return '';
  return locale === 'ar' ? station.nameAr : station.nameEn;
}

export function groupSuggestions(stations: RankedStation[]): {
  hubs: RankedStation[];
  others: RankedStation[];
} {
  return {
    hubs: stations.filter((station) => station.tier <= 2),
    others: stations.filter((station) => station.tier > 2),
  };
}
