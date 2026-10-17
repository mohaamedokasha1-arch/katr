import { STATIONS, STATION_MAP } from '@/lib/data/stations';

/** Short, human-readable slugs used by programmatic route URLs. */
export const STATION_SLUGS: Record<string, string> = {
  'cairo-ramses': 'cairo',
  'alexandria-misr': 'alexandria',
  'alexandria-sidi-gaber': 'sidi-gaber',
  banha: 'banha',
  tanta: 'tanta',
  damanhour: 'damanhour',
  'kafr-el-zayat': 'kafr-el-zayat',
  zagazig: 'zagazig',
  mansoura: 'mansoura',
  giza: 'giza',
  'beni-suef': 'beni-suef',
  minya: 'minya',
  'abu-qurqas': 'abu-qurqas',
  mallawi: 'mallawi',
  manfalut: 'manfalut',
  asyut: 'asyut',
  sohag: 'sohag',
  girga: 'girga',
  farshut: 'farshut',
  qena: 'qena',
  qift: 'qift',
  luxor: 'luxor',
  edfu: 'edfu',
  'kom-ombo': 'kom-ombo',
  daraw: 'daraw',
  aswan: 'aswan',
  waraq: 'al-warraq',
  fayoum: 'fayoum',
  'abu-kabir': 'abu-kabir',
  faqous: 'faqous',
  ismailia: 'ismailia',
  'port-said': 'port-said',
  'abu-hammad': 'abu-hammad',
  suez: 'suez',
  talkha: 'talkha',
  damietta: 'damietta',
  samannoud: 'samannoud',
  mahalla: 'mahalla',
  'kafr-el-sheikh': 'kafr-el-sheikh',
  desouk: 'desouk',
  'el-alamein': 'el-alamein',
  'sidi-abdel-rahman': 'sidi-abdel-rahman',
  'el-dabaa': 'el-dabaa',
  matrouh: 'matrouh',
};

const SLUG_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(STATION_SLUGS).map(([id, slug]) => [slug, id]),
);

export function stationSlug(stationId: string): string {
  return STATION_SLUGS[stationId] ?? stationId;
}

export function stationIdFromSlug(slug: string): string | undefined {
  return SLUG_TO_ID[slug];
}

export function routePairPath(fromId: string, toId: string): string {
  return `/route/${stationSlug(fromId)}-to-${stationSlug(toId)}`;
}

export function parseRoutePair(pair: string): { fromId: string; toId: string } | null {
  const [fromSlug, toSlug, ...rest] = pair.split('-to-');
  if (!fromSlug || !toSlug || rest.length > 0) return null;
  const fromId = stationIdFromSlug(fromSlug);
  const toId = stationIdFromSlug(toSlug);
  if (!fromId || !toId || fromId === toId) return null;
  if (!STATION_MAP[fromId] || !STATION_MAP[toId]) return null;
  return { fromId, toId };
}

export function allRoutePairPaths(): string[] {
  const paths: string[] = [];
  for (const from of STATIONS) {
    if (!from.searchable) continue;
    for (const to of STATIONS) {
      if (!to.searchable || to.id === from.id) continue;
      paths.push(
        `${stationSlug(from.id)}-to-${stationSlug(to.id)}`,
      );
    }
  }
  return paths;
}
