/**
 * Central registry of external data sources for Rakeb.
 * Honesty rules: a source is only "official" when its owner is provable;
 * `access` describes what was actually verified, never an assumed API.
 * Last verified from this repo's audit on 2026-10-17 (sandbox network to
 * enr.gov.eg was unreachable, so ENR rows are marked needs_review, with the
 * public pages corroborated via web search results of the live site).
 */
export type SourceAccess = 'api' | 'download' | 'public_page' | 'manual';
export type SourceStatus = 'working' | 'down' | 'stale' | 'needs_review';

export interface DataSource {
  id: string;
  ownerAr: string;
  ownerEn: string;
  url: string;
  dataAr: string;
  dataEn: string;
  access: SourceAccess;
  licenseAr: string;
  licenseEn: string;
  coverageAr: string;
  coverageEn: string;
  official: boolean;
  status: SourceStatus;
  lastVerifiedIso: string | null;
  lastPublishedUpdateIso: string | null;
  lastSyncIso: string | null;
  knownIssuesAr: string;
  knownIssuesEn: string;
}

export const DATA_SOURCES: DataSource[] = [
  {
    id: 'enr-schedule-page',
    ownerAr: 'الهيئة القومية لسكك حديد مصر (ENR)',
    ownerEn: 'Egyptian National Railways (ENR)',
    url: 'https://www.enr.gov.eg/Ar/TrainSchedule.aspx',
    dataAr: 'مواعيد القطارات (بحث برقم القطار ومحطة القيام والوصول)',
    dataEn: 'Train schedules (search by train number / origin / destination)',
    access: 'public_page',
    licenseAr: 'صفحة عامة؛ لا توجد شروط API منشورة معروفة — لا كشط آلي دون إذن',
    licenseEn: 'Public page; no published API terms known — no automated scraping without permission',
    coverageAr: 'شبكة ENR (بحسب ما تنشره الهيئة)',
    coverageEn: 'ENR network (as published by the authority)',
    official: true,
    status: 'needs_review',
    lastVerifiedIso: '2026-10-17',
    lastPublishedUpdateIso: null,
    lastSyncIso: null,
    knownIssuesAr: 'لا توجد API عامة موثقة معروفة؛ التحقق المباشر من بيئة التطوير تعذّر (حظر شبكي)، فالحالة تحتاج مراجعة يدوية دورية.',
    knownIssuesEn: 'No documented public API is known; direct fetch from the dev sandbox was blocked, so status needs periodic manual review.',
  },
  {
    id: 'enr-booking',
    ownerAr: 'الهيئة القومية لسكك حديد مصر (ENR)',
    ownerEn: 'Egyptian National Railways (ENR)',
    url: 'https://obs.enr.gov.eg/o-city/obs/enr/railway/ar/booktickets',
    dataAr: 'رابط الحجز الرسمي الإلكتروني',
    dataEn: 'Official online booking link',
    access: 'public_page',
    licenseAr: 'رابط خارجي فقط — راكب لا يبيع تذاكر',
    licenseEn: 'External link only — Rakeb does not sell tickets',
    coverageAr: 'القطارات المكيفة والفاخرة القابلة للحجز إلكترونيًا',
    coverageEn: 'AC/premium trains bookable online',
    official: true,
    status: 'needs_review',
    lastVerifiedIso: '2026-10-17',
    lastPublishedUpdateIso: null,
    lastSyncIso: null,
    knownIssuesAr: 'يُستخدم كرابط خارجي فقط؛ لا توافر مقاعد أو أسعار حجز مباشرة داخل راكب.',
    knownIssuesEn: 'Used as an external link only; no live seat availability or booking fares inside Rakeb.',
  },
  {
    id: 'mot-portal',
    ownerAr: 'وزارة النقل المصرية',
    ownerEn: 'Egyptian Ministry of Transport',
    url: 'https://mot.gov.eg/',
    dataAr: 'أخبار وقرارات النقل (سياق تشغيلي عام)',
    dataEn: 'Transport news/decisions (general operational context)',
    access: 'public_page',
    licenseAr: 'صفحة عامة إخبارية — ليست مصدر مواعيد',
    licenseEn: 'Public news page — not a timetable source',
    coverageAr: 'عام',
    coverageEn: 'General',
    official: true,
    status: 'needs_review',
    lastVerifiedIso: '2026-10-17',
    lastPublishedUpdateIso: null,
    lastSyncIso: null,
    knownIssuesAr: 'لا يوفر جداول قطارات قابلة للاستهلاك الآلي.',
    knownIssuesEn: 'Does not provide machine-readable train timetables.',
  },
  {
    id: 'rakeb-manual-verified',
    ownerAr: 'فريق بيانات راكب (إدخال ومراجعة يدوية)',
    ownerEn: 'Rakeb data team (manual entry & review)',
    url: 'https://www.enr.gov.eg/',
    dataAr: 'جدول الرحلات الأساسي والأسعار التقديرية المعروضة حاليًا (يحتاج إعادة تحقق دوري)',
    dataEn: 'Current base timetable & estimated fares on display (needs periodic re-verification)',
    access: 'manual',
    licenseAr: 'بيانات مجمّعة يدويًا — ليست رسمية ولا مباشرة',
    licenseEn: 'Manually compiled data — neither official nor live',
    coverageAr: '44 محطة مسجّلة (40 قابلة للبحث) و9 خطوط و59 خدمة في الكود الحالي',
    coverageEn: '44 registered stations (40 searchable), 9 lines, 59 services in current code',
    official: false,
    status: 'needs_review',
    lastVerifiedIso: null,
    lastPublishedUpdateIso: null,
    lastSyncIso: null,
    knownIssuesAr: 'المواعيد والأسعار الحالية إدخال يدوي غير مرتبط بمزامنة آلية؛ يجب إعادة التحقق منها مقابل ENR قبل ادّعاء أي دقة رسمية. الأسعار تقديرية.',
    knownIssuesEn: 'Current times/fares are manual entries with no automated sync; re-verify against ENR before claiming official accuracy. Fares are estimates.',
  },
];

export const OFFICIAL_BOOKING_URL = DATA_SOURCES[1].url;
