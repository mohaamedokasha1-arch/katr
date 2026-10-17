import type {
  AmenityId,
  ConfidenceLevel,
  ConfidenceReason,
  DataSource,
  Locale,
  LiveStatusKind,
  OperatingDays,
  ReportKind,
  SeasonWindow,
  TrainClassId,
  Weekday,
} from '@/types/rail';
import { TRAIN_CLASS_MAP } from '@/lib/data/train-classes';
import { formatSeason } from '@/lib/time';

export type Tone = 'success' | 'signal' | 'danger' | 'brand' | 'neutral' | 'violet';

export const classToneClasses: Record<string, string> = {
  gold: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/25',
  violet:
    'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-400/25',
  blue: 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/10 dark:text-brand-200 dark:border-brand-400/25',
  teal: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-400/25',
  slate:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/10',
};

export const toneClasses: Record<Tone, string> = {
  success:
    'bg-success-soft text-success-ink border-success/20 dark:bg-success/10 dark:text-emerald-300 dark:border-success/25',
  signal:
    'bg-signal-soft text-signal-ink border-signal/25 dark:bg-signal/10 dark:text-orange-300 dark:border-signal/30',
  danger:
    'bg-danger-soft text-danger-ink border-danger/20 dark:bg-danger/10 dark:text-red-300 dark:border-danger/30',
  brand:
    'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/10 dark:text-brand-200 dark:border-brand-400/25',
  neutral:
    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/10',
  violet:
    'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-400/25',
};

export const dotClasses: Record<Tone, string> = {
  success: 'bg-success dark:bg-emerald-400',
  signal: 'bg-signal dark:bg-orange-400',
  danger: 'bg-danger dark:bg-red-400',
  brand: 'bg-brand-500 dark:bg-brand-300',
  neutral: 'bg-slate-400 dark:bg-slate-500',
  violet: 'bg-violet-500 dark:bg-violet-300',
};

export interface StatusMeta {
  label: string;
  description: string;
  tone: Tone;
  pulse: boolean;
}

export function statusMeta(
  locale: Locale,
  kind: LiveStatusKind,
  delayMinutes = 0,
): StatusMeta {
  const ar = locale === 'ar';
  switch (kind) {
    case 'on_time':
      return {
        label: ar ? 'في الموعد' : 'On time',
        description: ar
          ? 'لا يوجد تأخير مُسجل على هذه الرحلة حتى آخر تحديث.'
          : 'No delay recorded for this service at the last update.',
        tone: 'success',
        pulse: false,
      };
    case 'boarding':
      return {
        label: ar ? 'على الرصيف' : 'Boarding',
        description: ar
          ? 'القطار موجود بالمحطة، والركوب جارٍ الآن.'
          : 'The train is at the station and boarding is underway.',
        tone: 'brand',
        pulse: true,
      };
    case 'delayed':
      return {
        label: ar ? `متأخر ${delayMinutes} د` : `${delayMinutes} min late`,
        description: ar
          ? `الرحلة متأخرة عن موعدها بنحو ${delayMinutes} دقيقة حسب آخر مصدر متاح.`
          : `The service is running about ${delayMinutes} minutes behind schedule.`,
        tone: 'signal',
        pulse: false,
      };
    case 'in_transit':
      return {
        label: ar ? 'في الطريق' : 'In transit',
        description: ar ? 'الرحلة انطلقت بالفعل وهي الآن بين المحطات.' : 'The service has departed and is en route.',
        tone: 'brand',
        pulse: true,
      };
    case 'arrived':
      return {
        label: ar ? 'وصل' : 'Arrived',
        description: ar ? 'انتهت الرحلة ووصل القطار إلى محطته.' : 'The service has reached its final station.',
        tone: 'neutral',
        pulse: false,
      };
    case 'cancelled':
      return {
        label: ar ? 'ملغى' : 'Cancelled',
        description: ar
          ? 'هذه الرحلة ملغاة حسب تعديل منشور. جرّب الأقرب بديلًا في نفس اليوم.'
          : 'This service is cancelled by a published change. Check the closest alternative.',
        tone: 'danger',
        pulse: false,
      };
    case 'scheduled':
    default:
      return {
        label: ar ? 'مجدول' : 'Scheduled',
        description: ar ? 'الرحلة مدرجة في الجدول ولم تبدأ بعد.' : 'The service is on the timetable and has not started yet.',
        tone: 'neutral',
        pulse: false,
      };
  }
}

export interface ConfidenceMeta {
  label: string;
  short: string;
  description: string;
  tone: Tone;
  icon: 'check' | 'schedule' | 'users' | 'alert';
}

export function confidenceMeta(locale: Locale, level: ConfidenceLevel): ConfidenceMeta {
  const ar = locale === 'ar';
  switch (level) {
    case 'official':
      return {
        label: ar ? 'مؤكد رسميًا' : 'Officially verified',
        short: ar ? 'رسمي' : 'Official',
        description: ar
          ? 'هذه المعلومة معتمدة من مصدر رسمي أو تمت مراجعتها ونشرها من فريق العمليات بعد تدقيق بشري.'
          : 'This information comes from an official source or was human-reviewed and published by our ops team.',
        tone: 'success',
        icon: 'check',
      };
    case 'community':
      return {
        label: ar ? 'مؤكد من الركاب' : 'Rider verified',
        short: ar ? 'مجتمعي' : 'Community',
        description: ar
          ? 'هناك بلاغات مستقلة متطابقة من ركاب اليوم بلغت حد الثقة المطلوب.'
          : 'Multiple independent rider reports today reached our confirmation threshold.',
        tone: 'signal',
        icon: 'users',
      };
    case 'stale':
      return {
        label: ar ? 'يحتاج إعادة تحقق' : 'Needs verification',
        short: ar ? 'قديم' : 'Stale',
        description: ar
          ? 'لم يُعد التحقق من هذا الجدول منذ مدة. تأكد من الهيئة أو من لوحة المحطة قبل السفر.'
          : 'This timetable has not been verified recently. Double-check before travelling.',
        tone: 'neutral',
        icon: 'alert',
      };
    case 'standard':
    default:
      return {
        label: ar ? 'الجدول القياسي' : 'Standard timetable',
        short: ar ? 'قياسي' : 'Standard',
        description: ar
          ? 'هذا هو الموعد المعتاد للقطار، ولم يُرصد تغيير لهذا اليوم.'
          : 'This is the regular timetable; no change has been detected for this day.',
        tone: 'brand',
        icon: 'schedule',
      };
  }
}

export function confidenceReasonText(locale: Locale, reason: ConfidenceReason): string {
  const ar = locale === 'ar';
  switch (reason) {
    case 'partner_feed':
      return ar ? 'خلاصة مباشرة من شريك بيانات رسمي.' : 'Direct feed from an official data partner.';
    case 'admin_published':
      return ar
        ? 'تعديل منشور بعد مراجعة بشرية وفق مبدأ الأربع عيون.'
        : 'A published change that passed a four-eyes human review.';
    case 'base_timetable':
      return ar ? 'الجدول الأساسي المعتاد لهذا القطار.' : 'The base timetable for this service.';
    case 'crowd_confirmed':
      return ar
        ? 'ثلاثة بلاغات مستقلة أو أكثر متطابقة خلال نافذة زمنية قصيرة.'
        : 'Three or more matching independent reports in a short window.';
    case 'crowd_partial':
      return ar ? 'بلاغات مجتمعية لم تصل بعد إلى نصاب التأكيد.' : 'Rider reports that have not reached the threshold yet.';
    case 'stale_verification':
      return ar ? 'آخر تحقق بشري مرّ عليه أكثر من 30 يومًا.' : 'Last verification was more than 30 days ago.';
    case 'live_scraper':
      return ar ? 'رصد آلي حديث من طبقة التزامن.' : 'A recent automated observation from the sync layer.';
    default:
      return '';
  }
}

export function dataSourceLabel(locale: Locale, source: DataSource | 'schedule'): string {
  const ar = locale === 'ar';
  switch (source) {
    case 'official':
      return ar ? 'مصدر رسمي' : 'Official source';
    case 'partner':
      return ar ? 'شريك بيانات' : 'Data partner';
    case 'ops':
      return ar ? 'فريق العمليات' : 'Operations team';
    case 'community':
      return ar ? 'بلاغات الركاب' : 'Rider reports';
    default:
      return ar ? 'الجدول الأساسي' : 'Base timetable';
  }
}

export function classLabel(locale: Locale, classId: TrainClassId): string {
  const trainClass = TRAIN_CLASS_MAP[classId];
  return locale === 'ar' ? trainClass.nameAr : trainClass.nameEn;
}

export function reportKindLabel(locale: Locale, kind: ReportKind): string {
  const ar = locale === 'ar';
  switch (kind) {
    case 'still_waiting':
      return ar ? 'لسه مستني' : 'Still waiting';
    case 'delayed':
      return ar ? 'متأخر' : 'Delayed';
    case 'moving':
      return ar ? 'القطار اتحرك' : 'Train left';
    case 'arrived':
      return ar ? 'وصل' : 'Arrived';
    case 'cancelled':
      return ar ? 'ملغي' : 'Cancelled';
    default:
      return '';
  }
}

export function reportKindTone(kind: ReportKind): Tone {
  switch (kind) {
    case 'moving':
    case 'arrived':
      return 'success';
    case 'delayed':
      return 'signal';
    case 'cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function amenityLabel(locale: Locale, amenity: AmenityId): string {
  const ar = locale === 'ar';
  const labels: Record<AmenityId, { ar: string; en: string }> = {
    tickets: { ar: 'شباك تذاكر', en: 'Ticket counters' },
    machine: { ar: 'ماكينة تذاكر', en: 'Ticket machine' },
    waiting: { ar: 'صالة انتظار', en: 'Waiting lounge' },
    cafe: { ar: 'كافيهات', en: 'Cafés' },
    taxi: { ar: 'تاكسي خارجي', en: 'Taxi rank' },
    atm: { ar: 'ماكينة صراف', en: 'ATM' },
    accessible: { ar: 'منحدر وصول', en: 'Step-free access' },
    parking: { ar: 'انتظار سيارات', en: 'Parking' },
  };
  return ar ? labels[amenity].ar : labels[amenity].en;
}

export function featureLabel(
  locale: Locale,
  feature: 'buffet' | 'power' | 'wifi' | 'beds' | 'luggage' | 'family',
): string {
  const ar = locale === 'ar';
  const labels = {
    buffet: { ar: 'عربة بوفيه', en: 'Buffet car' },
    power: { ar: 'مقابس كهرباء', en: 'Power sockets' },
    wifi: { ar: 'واي فاي', en: 'Wi-Fi' },
    beds: { ar: 'أسرّة', en: 'Beds' },
    luggage: { ar: 'مساحة أمتعة', en: 'Luggage space' },
    family: { ar: 'مناسب للعائلات', en: 'Family friendly' },
  };
  return ar ? labels[feature].ar : labels[feature].en;
}

export function tierLabel(locale: Locale, tier: 1 | 2 | 3 | 4): string {
  const ar = locale === 'ar';
  const labels = {
    1: { ar: 'محور رئيسي', en: 'Major hub' },
    2: { ar: 'محطة رئيسية', en: 'Main station' },
    3: { ar: 'محطة فرعية', en: 'District station' },
    4: { ar: 'توقف بالطلب', en: 'Request stop' },
  };
  return ar ? labels[tier].ar : labels[tier].en;
}

export function formatFare(value: number, locale: Locale): string {
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB').format(
    Math.round(value),
  );
  return locale === 'ar' ? `${formatted} ج.م` : `EGP ${formatted}`;
}

export function formatFareRange(min: number, max: number, locale: Locale): string {
  if (Math.round(min) === Math.round(max)) return formatFare(min, locale);
  return locale === 'ar'
    ? `${new Intl.NumberFormat('ar-EG-u-nu-latn').format(Math.round(min))}–${formatFare(max, locale)}`
    : `EGP ${Math.round(min)}–${Math.round(max)}`;
}

export function formatDuration(minutes: number, locale: Locale): string {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (locale === 'en') {
    if (h === 0) return `${m}m`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }
  if (h === 0) return `${m} د`;
  return m === 0 ? `${h} س` : `${h} س ${m} د`;
}

function arHourPhrase(n: number): string {
  if (n === 1) return 'ساعة واحدة';
  if (n === 2) return 'ساعتان';
  if (n >= 3 && n <= 10) return `${n} ساعات`;
  return `${n} ساعة`;
}

function arMinutePhrase(n: number): string {
  if (n === 1) return 'دقيقة واحدة';
  if (n === 2) return 'دقيقتان';
  if (n >= 3 && n <= 10) return `${n} دقائق`;
  return `${n} دقيقة`;
}

export function formatDurationLong(minutes: number, locale: Locale): string {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (locale === 'en') {
    const hourPart = h > 0 ? `${h} ${h === 1 ? 'hour' : 'hours'}` : '';
    const minutePart = m > 0 ? `${m} ${m === 1 ? 'minute' : 'minutes'}` : '';
    return [hourPart, minutePart].filter(Boolean).join(' and ') || '0 minutes';
  }
  if (h === 0) return arMinutePhrase(m);
  if (m === 0) return arHourPhrase(h);
  return `${arHourPhrase(h)} و${arMinutePhrase(m)}`;
}

export interface CountForms {
  arOne: string;
  arTwo: string;
  arFew: string;
  arMany: string;
  enOne: string;
  enMany: string;
}

export const COUNT_FORMS = {
  trips: {
    arOne: 'رحلة واحدة',
    arTwo: 'رحلتان',
    arFew: (n: number) => `${n} رحلات`,
    arMany: (n: number) => `${n} رحلة`,
    enOne: '1 trip',
    enMany: (n: number) => `${n} trips`,
  },
  stations: {
    arOne: 'محطة واحدة',
    arTwo: 'محطتان',
    arFew: (n: number) => `${n} محطات`,
    arMany: (n: number) => `${n} محطة`,
    enOne: '1 station',
    enMany: (n: number) => `${n} stations`,
  },
  lines: {
    arOne: 'خط واحد',
    arTwo: 'خطان',
    arFew: (n: number) => `${n} خطوط`,
    arMany: (n: number) => `${n} خط`,
    enOne: '1 line',
    enMany: (n: number) => `${n} lines`,
  },
  reports: {
    arOne: 'بلاغ واحد',
    arTwo: 'بلاغان',
    arFew: (n: number) => `${n} بلاغات`,
    arMany: (n: number) => `${n} بلاغ`,
    enOne: '1 report',
    enMany: (n: number) => `${n} reports`,
  },
  confirmations: {
    arOne: 'تأكيد واحد',
    arTwo: 'تأكيدان',
    arFew: (n: number) => `${n} تأكيدات`,
    arMany: (n: number) => `${n} تأكيد`,
    enOne: '1 confirmation',
    enMany: (n: number) => `${n} confirmations`,
  },
  stops: {
    arOne: 'محطة واحدة',
    arTwo: 'محطتان',
    arFew: (n: number) => `${n} محطات`,
    arMany: (n: number) => `${n} محطة`,
    enOne: '1 stop',
    enMany: (n: number) => `${n} stops`,
  },
  changes: {
    arOne: 'تغيير واحد',
    arTwo: 'تغييران',
    arFew: (n: number) => `${n} تغييرات`,
    arMany: (n: number) => `${n} تغيير`,
    enOne: '1 change',
    enMany: (n: number) => `${n} changes`,
  },
  days: {
    arOne: 'يوم واحد',
    arTwo: 'يومان',
    arFew: (n: number) => `${n} أيام`,
    arMany: (n: number) => `${n} يوم`,
    enOne: '1 day',
    enMany: (n: number) => `${n} days`,
  },
} as const;

export type CountKind = keyof typeof COUNT_FORMS;

type CountFormSet = {
  arOne: string;
  arTwo: string;
  arFew: (n: number) => string;
  arMany: (n: number) => string;
  enOne: string;
  enMany: (n: number) => string;
};

export function countLabel(count: number, locale: Locale, kind: CountKind): string {
  const forms = COUNT_FORMS[kind] as CountFormSet;
  if (locale === 'en') return count === 1 ? forms.enOne : forms.enMany(count);
  if (count === 1) return forms.arOne;
  if (count === 2) return forms.arTwo;
  if (count >= 3 && count <= 10) return forms.arFew(count);
  return forms.arMany(count);
}

export function operatingDaysLabel(
  locale: Locale,
  operatingDays: OperatingDays,
  weekdayFormatter: (day: Weekday) => string,
): string {
  const ar = locale === 'ar';
  if (operatingDays.type === 'daily') return ar ? 'يوميًا' : 'Daily';
  const days = [...operatingDays.days].sort((a, b) => a - b).map(weekdayFormatter);
  if (operatingDays.type === 'weekdays') {
    return ar ? days.join('، ') : days.join(', ');
  }
  return ar ? `يوميًا ما عدا ${days.join('، ')}` : `Daily except ${days.join(', ')}`;
}

export function seasonNote(locale: Locale, season: SeasonWindow): string {
  return locale === 'ar'
    ? `خط موسمي يعمل من ${formatSeason(season, locale)}`
    : `Seasonal service operating ${formatSeason(season, locale)}`;
}

export function relativeTime(
  iso: string,
  locale: Locale,
  now: Date = new Date(),
): string {
  const diffMs = new Date(iso).getTime() - now.getTime();
  const future = diffMs > 0;
  const absMinutes = Math.round(Math.abs(diffMs) / 60_000);
  const ar = locale === 'ar';
  const prefix = future ? (ar ? 'بعد ' : 'in ') : ar ? 'منذ ' : '';
  const suffix = future && !ar ? '' : !future && !ar ? ' ago' : '';

  if (absMinutes < 1) return ar ? 'الآن' : 'just now';

  let phrase: string;
  if (absMinutes < 60) {
    phrase = ar
      ? arMinutePhrase(absMinutes)
      : `${absMinutes} min`;
  } else if (absMinutes < 1440) {
    const hours = Math.round(absMinutes / 60);
    phrase = ar ? arHourPhrase(hours) : `${hours} hr`;
  } else if (absMinutes < 43_200) {
    const days = Math.round(absMinutes / 1440);
    phrase = ar
      ? days === 1
        ? 'يوم واحد'
        : days === 2
          ? 'يومان'
          : days <= 10
            ? `${days} أيام`
            : `${days} يومًا`
      : `${days} days`;
  } else if (absMinutes < 525_600) {
    const months = Math.round(absMinutes / 43_200);
    phrase = ar
      ? months === 1
        ? 'شهر'
        : months === 2
          ? 'شهران'
          : months <= 10
            ? `${months} أشهر`
            : `${months} شهرًا`
      : `${months} months`;
  } else {
    const years = Math.round(absMinutes / 525_600);
    phrase = ar
      ? years === 1
        ? 'سنة'
        : years === 2
          ? 'سنتان'
          : `${years} سنوات`
      : `${years} years`;
  }

  if (ar) return `${prefix}${phrase}`;
  if (!future) return `${phrase}${suffix}`;
  return `${prefix}${phrase}`;
}

export function platformLabel(locale: Locale, platform?: string): string {
  if (!platform) return locale === 'ar' ? '—' : '—';
  return locale === 'ar' ? `رصيف ${platform}` : `Platform ${platform}`;
}

export const EGYPT_WEEK_ORDER: Weekday[] = [6, 0, 1, 2, 3, 4, 5];
