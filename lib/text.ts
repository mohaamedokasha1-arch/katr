/**
 * Arabic-aware search normalisation.
 *
 * Riders type "اسيوط", "أسيوط", "الاسكندريه" and "محطة مصر" interchangeably.
 * We normalise diacritics, hamza variants, ta-marbuta, alef maqsura and
 * whitespace on both the query and the indexed aliases.
 */

const DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
const ARABIC_INDIC = /[\u0660-\u0669]/g;
const EXTENDED_ARABIC_INDIC = /[\u06F0-\u06F9]/g;

const digitMap: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
};

export function normalizeArabic(input: string): string {
  return input
    .toLowerCase()
    .replace(DIACRITICS, '')
    .replace(ARABIC_INDIC, (d) => digitMap[d] ?? d)
    .replace(EXTENDED_ARABIC_INDIC, (d) => digitMap[d] ?? d)
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeEnglish(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeSearchText(input: string): string {
  return normalizeArabic(normalizeEnglish(input));
}

export interface MatchableStation {
  nameAr: string;
  nameEn: string;
  code: string;
  aliasesAr: string[];
  aliasesEn: string[];
  governorateAr: string;
  governorateEn: string;
}

/**
 * Relevance score for a normalised query against a station's names.
 * Higher is better; 0 means no match.
 */
export function stationMatchScore(station: MatchableStation, query: string): number {
  const q = normalizeSearchText(query);
  if (!q) return 0;

  const candidates = [
    { text: normalizeSearchText(station.nameAr), weight: 100 },
    { text: normalizeSearchText(station.nameEn), weight: 95 },
    { text: normalizeSearchText(station.code), weight: 90 },
    ...station.aliasesAr.map((a) => ({ text: normalizeSearchText(a), weight: 80 })),
    ...station.aliasesEn.map((a) => ({ text: normalizeSearchText(a), weight: 75 })),
    { text: normalizeSearchText(station.governorateAr), weight: 40 },
    { text: normalizeSearchText(station.governorateEn), weight: 35 },
  ];

  let best = 0;
  for (const candidate of candidates) {
    if (!candidate.text) continue;
    if (candidate.text === q) best = Math.max(best, candidate.weight + 30);
    else if (candidate.text.startsWith(q)) best = Math.max(best, candidate.weight + 15);
    else if (candidate.text.includes(q)) best = Math.max(best, candidate.weight);
    else {
      const tokens = candidate.text.split(' ');
      if (q.split(' ').every((part) => tokens.some((token) => token.startsWith(part)))) {
        best = Math.max(best, candidate.weight - 10);
      }
    }
  }
  return best;
}

export function slugify(input: string): string {
  return normalizeEnglish(input).replace(/\s+/g, '-').replace(/-+/g, '-');
}

export function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
