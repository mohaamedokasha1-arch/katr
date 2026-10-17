import type { FaqItem, GuideArticle } from '@/types/rail';

export const SITE = {
  nameAr: 'راكب',
  nameEn: 'Rakeb',
  taglineAr: 'اعرف ميعادك… قبل ما يفوتك',
  taglineEn: 'Know your train, before it leaves.',
  descriptionAr:
    'راكب منصة مستقلة لمواعيد قطارات السكك الحديدية المصرية، بدرجة ثقة واضحة لكل معلومة، ولوحات حركة مباشرة، وبلاغات من الركاب.',
  descriptionEn:
    'Rakeb is an independent Egyptian rail timetable platform with a confidence score for every data point, live station boards and rider reports.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  email: 'hello@rakeb.app',
  version: '1.0.0',
};

export const POPULAR_PAIRS = [
  { fromId: 'cairo-ramses', toId: 'alexandria-misr' },
  { fromId: 'alexandria-misr', toId: 'cairo-ramses' },
  { fromId: 'cairo-ramses', toId: 'aswan' },
  { fromId: 'aswan', toId: 'cairo-ramses' },
  { fromId: 'cairo-ramses', toId: 'luxor' },
  { fromId: 'cairo-ramses', toId: 'mansoura' },
  { fromId: 'cairo-ramses', toId: 'port-said' },
  { fromId: 'alexandria-misr', toId: 'matrouh' },
  { fromId: 'cairo-ramses', toId: 'fayoum' },
  { fromId: 'cairo-ramses', toId: 'suez' },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'official',
    category: 'trust',
    qAr: 'هل مواعيد راكب رسمية؟',
    qEn: 'Are Rakeb timetables official?',
    aAr: 'راكب منصة مستقلة وليست تابعة لهيئة السكك الحديدية. كل معلومة تحمل درجة ثقة توضح مصدرها: مؤكد رسميًا، جدول قياسي، تأكيد مجتمعي، أو بيانات تحتاج إعادة تحقق. عند وجود شراكة رسمية ستُعرض بياناتها بوسم "مؤكد رسميًا" وبوقت آخر تحديث.',
    aEn: 'Rakeb is independent and not affiliated with Egyptian National Railways. Every data point carries a confidence level showing its source: officially verified, standard timetable, rider-confirmed, or stale. If an official partnership is established, its feed will appear as officially verified with a timestamp.',
  },
  {
    id: 'confidence',
    category: 'trust',
    qAr: 'كيف تُحسب درجة الثقة في البيانات؟',
    qEn: 'How is the data confidence score calculated?',
    aAr: 'نبدأ بالجدول القياسي للقطار. إذا نُشر تعديل من فريق العمليات بعد مراجعة بشرية (مبدأ الأربع عيون) يصبح المصدر "مؤكدًا رسميًا". إذا لم يوجد تعديل رسمي وتوافقت ثلاثة بلاغات مستقلة من الركاب خلال 45 دقيقة يصبح التأخير "مؤكدًا مجتمعيًا". وإذا مر أكثر من 30 يومًا دون تحقق بشري يظهر الجدول كبيانات تحتاج إعادة تحقق.',
    aEn: 'We start with the base timetable. A published, four-eyes-reviewed ops change becomes officially verified. Without an official change, three independent rider reports within 45 minutes can confirm a delay as rider-verified. If a timetable has gone more than 30 days without human verification, it is flagged as needing verification.',
  },
  {
    id: 'changes',
    category: 'trust',
    qAr: 'لماذا يختلف موعد القطار عن الجدول المعتاد؟',
    qEn: 'Why does a train differ from the usual timetable?',
    aAr: 'هناك أربعة أسباب رئيسية: تأخير تشغيلي في نفس اليوم، تعديل جدول موسمي، رحلة إضافية في الأعياد والمناسبات، أو إلغاء لصيانة طارئة. راكب يعرض التغييرات المنشورة فقط، ولا ينشر بلاغًا مجتمعيًا كحقيقة إلا بعد اكتمال نصاب التأكيد.',
    aEn: 'There are four main reasons: same-day operational delays, seasonal timetable changes, extra holiday services, or emergency maintenance cancellations. Rakeb only publishes approved changes and does not present a crowd report as fact until the confirmation threshold is reached.',
  },
  {
    id: 'booking',
    category: 'booking',
    qAr: 'هل يمكنني حجز تذكرة من راكب؟',
    qEn: 'Can I book a ticket on Rakeb?',
    aAr: 'لا. راكب منصة معلومات ومواعيد، ولا تبيع تذاكر ولا تتقاضى رسوم حجز. استخدم القنوات الرسمية للحجز، وتأكد من القطارات والأسعار قبل السفر. نعمل على إضافة روابط مباشرة للقنوات الرسمية عند توفر شراكة.',
    aEn: 'No. Rakeb is an information and timetable platform; it does not sell tickets or charge booking fees. Use the official booking channels and confirm trains and prices before travelling. We plan to add direct official links when a partnership is available.',
  },
  {
    id: 'prices',
    category: 'booking',
    qAr: 'هل الأسعار المعروضة دقيقة؟',
    qEn: 'Are the displayed prices accurate?',
    aAr: 'الأسعار نطاقات تقديرية لكل درجة وليست سعرًا نهائيًا. تختلف الأسعار بحسب المسافة والدرجة والتعديلات الإدارية. يُحسب نطاق الرحلة الجزئية تقديريًا من نسبة المسافة، لذا راجع السعر عند الحجز الرسمي.',
    aEn: 'Prices are estimated ranges per class, not final fares. They vary by distance, class and administrative changes. Partial-journey ranges are estimated by distance ratio, so confirm the fare at the official booking channel.',
  },
  {
    id: 'community',
    category: 'trust',
    qAr: 'كيف تعمل بلاغات الركاب؟',
    qEn: 'How do rider reports work?',
    aAr: 'إذا كنت في المحطة أو على القطار، اضغط زر البلاغ المناسب: لسه مستني، متأخر، القطار اتحرك، وصل، أو ملغي. لا يُعتمد بلاغ واحد. نحتاج ثلاثة بلاغات مستقلة على الأقل ومتقاربة في الوقت قبل عرض التأخير كتأكيد مجتمعي. يمكنك أيضًا إضافة رقم دقائق التأخير.',
    aEn: 'If you are at the station or on the train, tap the relevant report: still waiting, delayed, train left, arrived or cancelled. A single report never changes the public status. We need at least three independent, time-close reports before showing a crowd confirmation. You can add the delay in minutes.',
  },
  {
    id: 'direct',
    category: 'search',
    qAr: 'ماذا يعني فلتر "مباشر فقط"؟',
    qEn: 'What does the “direct only” filter mean?',
    aAr: 'يعني ألا يتوقف القطار في أي محطة بين محطة الانطلاق ومحطة الوصول اللتين اخترتهما. قد يتوقف في محطات قبل الانطلاق أو بعد الوصول، لكنه لا يتوقف بينهما. الفلتر لا يعني أن الرحلة بلا أي توقف على مسارها الكامل.',
    aEn: 'It means the train makes no stop between your selected origin and destination. It may call before your origin or after your destination, but not in between. It does not mean the entire service is non-stop.',
  },
  {
    id: 'offline',
    category: 'access',
    qAr: 'هل تعمل المنصة بدون إنترنت؟',
    qEn: 'Does the platform work offline?',
    aAr: 'نعم جزئيًا. ثبّت راكب كتطبيق PWA وستظل الصفحات التي زرتها متاحة دون اتصال، بينما يظهر المشغل "وضع عدم الاتصال". يمكنك أيضًا حفظ رحلة محددة من صفحتها، وستظل تفاصيلها ومحطاتها ظاهرة في صفحة الاستخدام دون اتصال.',
    aEn: 'Partly. Install Rakeb as a PWA and previously visited pages remain available offline with an offline badge. You can also save a specific trip from its page; its details and stops remain visible on the offline page.',
  },
  {
    id: 'alerts',
    category: 'alerts',
    qAr: 'كيف أضيف تنبيهًا قبل موعد القطار؟',
    qEn: 'How do I add a reminder before departure?',
    aAr: 'من صفحة الرحلة أو من بطاقة النتيجة، اضغط "نبهني" واختر قبل الموعد بـ 30 أو 60 أو 120 دقيقة. تُحفظ التنبيهات على جهازك، وتظهر في صفحة "تنبيهاتي" مع عدّاد تنازلي. إشعارات الدفع الكاملة قيد التفعيل؛ في النسخة الحالية يعمل التنبيه أثناء فتح الموقع ويطلب إذن المتصفح.',
    aEn: 'From a trip page or result card, tap “Remind me” and choose 30, 60 or 120 minutes before departure. Reminders are stored on your device and appear in “My alerts” with a countdown. Full push notifications are being enabled; in this version alerts work while the site is open and request browser permission.',
  },
  {
    id: 'seasonal',
    category: 'search',
    qAr: 'لماذا لا أجد قطار مرسى مطروح في الشتاء؟',
    qEn: 'Why can’t I find the Marsa Matrouh train in winter?',
    aAr: 'خط الإسكندرية–مرسى مطروح موسمي ويعمل من 1 يونيو حتى 30 سبتمبر. خارج هذه الفترة لا تظهر رحلات منتظمة، وتُعرض صفحة الخط مع موعد عودة الموسم بدلًا من نتائج فارغة بلا تفسير.',
    aEn: 'The Alexandria–Marsa Matrouh line is seasonal, operating from 1 June to 30 September. Outside this window no regular trips appear; the line page explains the next season instead of showing an unexplained empty result.',
  },
  {
    id: 'report-issue',
    category: 'trust',
    qAr: 'وجدت موعدًا خاطئًا، كيف أبلّغ؟',
    qEn: 'I found a wrong time. How do I report it?',
    aAr: 'استخدم زر البلاغ في صفحة الرحلة إن كنت في المحطة، أو أرسل التفاصيل إلى فريق البيانات. كل تعديل يمر عبر تحقق ومراجعة ثانية قبل النشر، ويُسجل في سجل التدقيق مع هوية المراجع ووقت الاعتماد. لا نعدّل الجداول استجابةً لبلاغ واحد.',
    aEn: 'Use the report button on the trip page if you are at the station, or send details to the data team. Every change passes validation and a second review before publishing, and is logged with the reviewer and approval time. We never edit a timetable based on a single report.',
  },
  {
    id: 'api',
    category: 'search',
    qAr: 'هل توجد واجهة API؟',
    qEn: 'Is there an API?',
    aAr: 'نعم، توجد نقاط نهاية داخلية للبحث عن الرحلات والمحطات والحالة اللحظية وبلاغات الركاب، موثقة في مجلد docs داخل المشروع. لا توجد حاليًا واجهة عامة بأسعار أو حصص إنتاجية.',
    aEn: 'Yes, internal endpoints for search, stations, live status and rider reports are documented in the project’s docs folder. There is no public, rate-limited production API yet.',
  },
];

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: 'how-to-book-train-ticket-egypt',
    titleAr: 'كيف تحجز تذكرة قطار في مصر: دليل عملي',
    titleEn: 'How to book a train ticket in Egypt: a practical guide',
    excerptAr:
      'خطوات عملية من اختيار الدرجة إلى الوصول للمحطة في الوقت المناسب، وأخطاء شائعة تسبب تفويت القطار.',
    excerptEn:
      'A practical walkthrough from choosing a class to arriving at the station on time, plus common mistakes that make people miss trains.',
    categoryAr: 'قبل السفر',
    categoryEn: 'Before you travel',
    readingMinutes: 6,
    updatedAt: '2026-10-01',
    heroAccent: '#1565C0',
    relatedRoutes: [
      { fromId: 'cairo-ramses', toId: 'alexandria-misr' },
      { fromId: 'cairo-ramses', toId: 'aswan' },
    ],
    blocks: [
      {
        type: 'paragraph',
        textAr:
          'الحجز في مصر أسهل بكثير عندما تفصل بين قرارين: أي قطار يناسبك، وكيف تشتري التذكرة. معظم الإرباك يحدث لأن الناس يبحثون عن السعر قبل أن يحددوا الدرجة والموعد، أو يصلون للمحطة دون هامش أمان.',
        textEn:
          'Booking a train in Egypt gets much easier when you separate two decisions: which train suits you, and how to buy the ticket. Most confusion happens because people chase a price before choosing a class and a departure, or arrive at the station with no safety margin.',
      },
      {
        type: 'heading',
        textAr: 'قبل ما تحجز: أربعة أسئلة',
        textEn: 'Before booking: four questions',
      },
      {
        type: 'list',
        itemsAr: [
          'هل المسافة قصيرة أم طويلة؟ الرحلات أقل من ثلاث ساعات لا تحتاج عادةً أعلى درجة.',
          'هل تسافر ليلًا؟ قطارات النوم قد تكون أفضل من رحلة نهارية طويلة، لكنها تتطلب حجزًا مسبقًا.',
          'هل معك حقائب كثيرة أو أطفال؟ اختر درجة بها مساحة أمتعة واضحة، واذهب للمحطة أبكر.',
          'هل الوصول في وقت محدد مهم؟ اختر القطار الأقرب لموعدك مع هامش 30–45 دقيقة للتأخيرات المحتملة.',
        ],
        itemsEn: [
          'Is the journey short or long? Trips under three hours rarely need the highest class.',
          'Are you travelling overnight? Sleepers can beat a long daytime journey but need advance booking.',
          'Travelling with lots of luggage or children? Pick a class with clear luggage space and arrive earlier.',
          'Is arrival time critical? Pick the closest train with a 30–45 minute buffer for potential delays.',
        ],
      },
      {
        type: 'heading',
        textAr: 'خطوات الحجز',
        textEn: 'The booking steps',
      },
      {
        type: 'list',
        itemsAr: [
          'حدد محطة الانطلاق بدقة. في القاهرة محطة رمسيس هي الأكبر، وفي الإسكندرية هناك محطة مصر وسيدي جابر.',
          'ابحث عن الرحلات في يومك المطلوب وقارن بين الدرجات والمدد. راكب يعرض نطاق السعر التقديري، وليس السعر النهائي.',
          'اختر القطار ثم اضغط حفظ أو نبهني لمتابعة أي تغيير منشور قبل السفر.',
          'احجز من القناة الرسمية للهيئة أو شباك التذاكر. راكب لا يبيع التذاكر.',
          'احفظ رقم القطار وأسماء المحطات، والتقط صورة لتفاصيل الحجز.',
        ],
        itemsEn: [
          'Choose your departure station precisely. Cairo Ramses is the main hub; Alexandria has Misr and Sidi Gaber.',
          'Search your date and compare classes and durations. Rakeb displays estimated ranges, not final fares.',
          'Pick the train, then save it or set a reminder to follow published changes before travelling.',
          'Book through the official ENR channel or a ticket counter. Rakeb does not sell tickets.',
          'Save the train number and station names, and screenshot your booking details.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        textAr:
          'الأسعار في راكب تقديرية ومبنية على أنماط تاريخية. لا تعتمد عليها كسعر نهائي، خصوصًا في المواسم والأعياد.',
        textEn:
          'Rakeb fares are estimates based on historical patterns. Do not treat them as final prices, especially during seasons and holidays.',
      },
      {
        type: 'heading',
        textAr: 'يوم السفر: أخطاء نتجنبها',
        textEn: 'Travel day: mistakes to avoid',
      },
      {
        type: 'list',
        itemsAr: [
          'الوصول قبل الموعد بـ 45 دقيقة على الأقل في المحطات الكبيرة، و20 دقيقة في المحطات الفرعية.',
          'عدم الاعتماد على تطبيق واحد فقط. تحقق من لوحة المحطة ومن مصدر رسمي قبل التحرك.',
          'تجنب الانتظار داخل صالة مزدحمة بعيدًا عن رصيفك؛ راقب اللوحة كل 10–15 دقيقة.',
          'إذا أُلغي القطار، اسأل عن أقرب بديل في نفس الخط بدلًا من مغادرة المحطة فورًا.',
        ],
        itemsEn: [
          'Arrive at least 45 minutes early at major stations and 20 minutes at smaller ones.',
          'Never rely on a single app. Check the station board and an official source before leaving.',
          'Avoid waiting far from your platform in a crowded hall; watch the board every 10–15 minutes.',
          'If your train is cancelled, ask about the nearest alternative on the same line before leaving.',
        ],
      },
      {
        type: 'paragraph',
        textAr:
          'راكب يحاول تقليل المفاجآت بوسم واضح لمصدر كل معلومة، لكنه لا يستبدل الإعلان الرسمي داخل المحطة. القاعدة الذهبية: إذا تعارضت المعلومات، اتبع لوحة المحطة والموظف المختص.',
        textEn:
          'Rakeb tries to reduce surprises by clearly labelling the source of every data point, but it does not replace the official on-station announcement. Golden rule: if sources disagree, follow the station board and station staff.',
      },
    ],
  },
  {
    slug: 'talgo-vs-russian-ac',
    titleAr: 'تالجو ولا الروسي؟ مقارنة درجات القطارات في مصر',
    titleEn: 'Talgo vs Russian AC: comparing Egyptian train classes',
    excerptAr:
      'ما الفرق الحقيقي بين تالجو وروسي مكيف وتحيا مصر والثالثة، ومتى تستحق كل درجة سعرها؟',
    excerptEn:
      'The real difference between Talgo, Russian AC, Haya Masr and third class — and when each class is worth the price.',
    categoryAr: 'الدرجات',
    categoryEn: 'Classes',
    readingMinutes: 7,
    updatedAt: '2026-10-02',
    heroAccent: '#B45309',
    relatedRoutes: [
      { fromId: 'cairo-ramses', toId: 'aswan' },
      { fromId: 'cairo-ramses', toId: 'alexandria-misr' },
    ],
    blocks: [
      {
        type: 'paragraph',
        textAr:
          'السؤال ليس "أي قطار أفضل؟" بل "أي درجة تستحق الفرق في السعر لرحلتك تحديدًا؟". رحلة ساعتين على الدلتا تختلف عن ليلة كاملة إلى أسوان، والقيمة تتغير مع المسافة والوقت.',
        textEn:
          'The question is not “which train is best?” but “which class is worth the price difference for your journey?” A two-hour Delta hop is very different from a full night to Aswan, and value shifts with distance and timing.',
      },
      {
        type: 'heading',
        textAr: 'خريطة سريعة للدرجات',
        textEn: 'A quick class map',
      },
      {
        type: 'list',
        itemsAr: [
          'تالجو: الأعلى راحة والأعلى سعرًا، مناسب لرحلات العمل والمسافات الطويلة على خط الإسكندرية.',
          'قطار نوم: كوخ خاص وسرير، الأنسب لرحلات الصعيد الليلية الطويلة، ويتطلب حجزًا مسبقًا.',
          'تحيا مصر: عربات حديثة مكيفة وسرعة تشغيل جيدة، توازن قوي بين الراحة والسعر.',
          'روسي مكيف: مكيف وقوي على خط الصعيد، خيار عملي للمسافات الطويلة بميزانية متوسطة.',
          'ثالثة مكيفة: اقتصادية مع تكييف، مناسبة للرحلات المتوسطة والقصيرة.',
          'ثالثة عادي: الأرخص، وغالبًا بدون تكييف؛ مناسبة للرحلات القصيرة في الطقس المعتدل.',
        ],
        itemsEn: [
          'Talgo: the highest comfort and price, best for business trips and long Alexandria-line journeys.',
          'Sleeper: a private cabin and bed, ideal for long overnight Upper Egypt trips, with advance booking.',
          'Haya Masr: modern AC coaches and good running times — a strong comfort/price balance.',
          'Russian AC: robust air conditioning on Upper Egypt services, practical for long trips on a mid budget.',
          'Third AC: economical with air conditioning, good for medium and short journeys.',
          'Third class: the cheapest, usually without AC; suitable for short trips in mild weather.',
        ],
      },
      {
        type: 'heading',
        textAr: 'إمتى تدفع أكتر؟',
        textEn: 'When to pay more',
      },
      {
        type: 'paragraph',
        textAr:
          'ادفع أكثر إذا كانت الرحلة أطول من خمس ساعات، أو إن كنت ستصل متأخرًا وتحتاج نومًا حقيقيًا، أو إن كانت الرحلة مرتبطة بموعد عمل لا يحتمل الإجهاد. في الرحلات القصيرة، الفرق في الراحة أقل من الفرق في السعر غالبًا.',
        textEn:
          'Pay more if the journey exceeds five hours, if you will arrive late and need real sleep, or if work depends on you arriving fresh. On short trips, the comfort difference is usually smaller than the price difference.',
      },
      {
        type: 'heading',
        textAr: 'إمتى توفر؟',
        textEn: 'When to save',
      },
      {
        type: 'paragraph',
        textAr:
          'الدرجة الثالثة المكيفة خيار ممتاز للرحلات المتوسطة نهارًا. الدرجة الثالثة العادية قد تكون كافية لمسافة قصيرة، لكنها تصبح مرهقة في رحلات الصعيد الطويلة أو في حرارة الصيف. لا تشترِ الأرخص ثم تدفع الثمن في يوم كامل من التعب.',
        textEn:
          'Third AC is excellent for medium daytime journeys. Plain third class can work for a short hop but becomes exhausting on long Upper Egypt trips or in summer heat. Do not buy the cheapest ticket and pay for it with a wasted day.',
      },
      {
        type: 'callout',
        tone: 'warning',
        textAr:
          'أسماء الدرجات وقدرات التكييف قد تختلف من قطار لآخر وعلى نفس الخط. تحقق من نوع العربات عند الحجز، ولا تفترض أن كل "مكيف" بنفس المستوى.',
        textEn:
          'Class names and AC capabilities can differ between trains even on the same line. Confirm the coach type when booking and never assume every “AC” service is the same standard.',
      },
    ],
  },
  {
    slug: 'cheapest-cairo-luxor',
    titleAr: 'أرخص طريقة للسفر من القاهرة إلى الأقصر',
    titleEn: 'The cheapest way from Cairo to Luxor',
    excerptAr:
      'مقارنة عملية بين الثالثة المكيفة والثالثة العادية وقطار النوم، مع خطة توفير لا تضحي براحتك كلها.',
    excerptEn:
      'A practical comparison of third AC, plain third class and the sleeper, with a savings plan that does not sacrifice all comfort.',
    categoryAr: 'خطط التوفير',
    categoryEn: 'Budget travel',
    readingMinutes: 5,
    updatedAt: '2026-10-03',
    heroAccent: '#2E7D32',
    relatedRoutes: [
      { fromId: 'cairo-ramses', toId: 'luxor' },
      { fromId: 'cairo-ramses', toId: 'aswan' },
    ],
    blocks: [
      {
        type: 'paragraph',
        textAr:
          'القاهرة–الأقصر رحلة طويلة تتجاوز غالبًا تسع ساعات. التوفير الحقيقي لا يأتي من اختيار أرخص تذكرة فقط، بل من اختيار القطار الذي يقلل تكلفة ليلة الفندق أو يجنبك إجهادًا يفسد أول يوم.',
        textEn:
          'Cairo–Luxor is a long journey, usually over nine hours. Real savings come not only from the cheapest ticket but from choosing the train that removes a hotel night or avoids exhaustion that ruins your first day.',
      },
      {
        type: 'heading',
        textAr: 'الخيارات الثلاثة',
        textEn: 'The three options',
      },
      {
        type: 'list',
        itemsAr: [
          'الثالثة العادية: أرخص تذكرة، لكن الرحلة أطول وأقل راحة، خصوصًا في الصيف. مناسبة للميزانية الصارمة والمسافرين المعتادين.',
          'الثالثة المكيفة: يزيد السعر قليلًا مقابل تكييف ومقاعد أفضل، وغالبًا أفضل قيمة على هذه المسافة.',
          'قطار النوم: الأغلى، لكنه يوفر ليلة فندق ويوصلك صباحًا بحالة أفضل. احسبه مقابل تكلفة ليلة إقامة ووجبة.',
        ],
        itemsEn: [
          'Plain third: the cheapest ticket, but longer and less comfortable, especially in summer. Best for a strict budget or experienced regulars.',
          'Third AC: a small premium for air conditioning and better seats, often the best value over this distance.',
          'Sleeper: the most expensive, but it replaces a hotel night and arrives in better shape. Compare it with a hotel night plus dinner.',
        ],
      },
      {
        type: 'heading',
        textAr: 'خطة توفير عملية',
        textEn: 'A practical savings plan',
      },
      {
        type: 'list',
        itemsAr: [
          'سافر في قطار ليلي لتوفير ليلة إقامة، واحسب الفرق بين سعر النوم وفندق ليلة كاملة.',
          'احمل ماء ووجبة خفيفة بدلًا من الشراء داخل القطار أو المحطة بأسعار أعلى.',
          'احجز مبكرًا في المواسم، فالأسعار والإتاحة يتغيران بسرعة قبل الأعياد.',
          'اختر محطة الانطلاق الأقرب لك لتقليل تكلفة التاكسي، وليس فقط أرخص قطار.',
          'قارن الوصول إلى الأقصر مع إمكانية النزول في قنا أو إسنا إذا كان ذلك يخدم خطتك.',
        ],
        itemsEn: [
          'Take an overnight train to save a hotel night, and compare the sleeper fare with a full hotel night.',
          'Bring water and a light meal instead of buying at inflated on-board or station prices.',
          'Book early in peak seasons; prices and availability move quickly before holidays.',
          'Choose the departure station closest to you to cut taxi costs, not just the cheapest train.',
          'Compare arriving in Luxor with alighting in Qena or Esna if that fits your plan better.',
        ],
      },
      {
        type: 'callout',
        tone: 'success',
        textAr:
          'قاعدة سريعة: إذا كان فرق سعر الدرجة المكيفة أقل من 25% من تذكرة الثالثة، غالبًا تستحق الدفع على رحلة أطول من ست ساعات.',
        textEn:
          'Rule of thumb: if the AC premium is under 25% of a third-class ticket, it is usually worth paying on journeys over six hours.',
      },
      {
        type: 'paragraph',
        textAr:
          'تذكر أن الأسعار في هذا الدليل تقديرية، وأن الوصول إلى الأقصر قد يكون عبر قطارات تستمر حتى أسوان. راجع صفحة المسار لمعرفة كل الخيارات المتاحة في يومك.',
        textEn:
          'Remember that prices in this guide are estimates, and trains to Luxor may continue to Aswan. Check the route page for every option available on your day.',
      },
    ],
  },
  {
    slug: 'matrouh-summer-train',
    titleAr: 'قطار مرسى مطروح: دليل الساحل الصيفي',
    titleEn: 'The Marsa Matrouh train: a North Coast summer guide',
    excerptAr:
      'موسم التشغيل، المحطات على الطريق، وكيف تخطط لرحلة ساحلية بدون مفاجآت خارج الموسم.',
    excerptEn:
      'Operating season, stations along the way, and how to plan a coastal trip without off-season surprises.',
    categoryAr: 'موسمي',
    categoryEn: 'Seasonal',
    readingMinutes: 4,
    updatedAt: '2026-10-04',
    heroAccent: '#0E7490',
    relatedRoutes: [{ fromId: 'alexandria-misr', toId: 'matrouh' }],
    blocks: [
      {
        type: 'paragraph',
        textAr:
          'خط الإسكندرية–مرسى مطروح ليس خطًا يعمل طوال العام. الرحلات المنتظمة تظهر فقط داخل موسم الصيف، من 1 يونيو حتى 30 سبتمبر، ثم تتوقف حتى الموسم التالي. هذا مهم جدًا في التخطيط: البحث في أكتوبر عن رحلة مباشرة لن يعطيك نتيجة، وهذا سلوك صحيح وليس عطلًا.',
        textEn:
          'The Alexandria–Marsa Matrouh line does not run year-round. Regular services appear only during the summer season, from 1 June to 30 September, then pause until next year. This matters for planning: searching in October for a direct trip returns nothing, and that is correct behaviour, not a bug.',
      },
      {
        type: 'heading',
        textAr: 'المحطات على الطريق',
        textEn: 'Stations along the route',
      },
      {
        type: 'list',
        itemsAr: [
          'الإسكندرية – محطة مصر: نقطة الانطلاق داخل المدينة.',
          'سيدي جابر: أنسب لمن يسكن شرق الإسكندرية.',
          'العلمين: محطة قريبة من الساحل والمشروعات الجديدة.',
          'الضبعة: توقف وسطي على الساحل الشمالي.',
          'مرسى مطروح: نهاية الخط، وقريبة من الشواطئ الرئيسية.',
        ],
        itemsEn: [
          'Alexandria – Misr: the city-centre starting point.',
          'Sidi Gaber: more convenient for eastern Alexandria.',
          'El Alamein: close to the coast and newer developments.',
          'El Dabaa: a mid-coast stop.',
          'Marsa Matrouh: the terminus, close to the main beaches.',
        ],
      },
      {
        type: 'heading',
        textAr: 'نصائح للموسم',
        textEn: 'Season tips',
      },
      {
        type: 'list',
        itemsAr: [
          'تابع الإعلان عن أول رحلة في الموسم قبل أسبوع على الأقل، وليس في يوم السفر.',
          'أيام الذروة في يوليو وأغسطس تكون مزدحمة؛ احجز مبكرًا واذهب للمحطة أبكر.',
          'لا تفترض وجود قطار عودة متأخر؛ راجع الجدول كاملًا قبل حجز الإقامة.',
          'احفظ صفحة الخط دون اتصال، فالتغطية الشبكية على بعض أجزاء الساحل ضعيفة.',
        ],
        itemsEn: [
          'Watch for the first seasonal service at least a week ahead, not on travel day.',
          'July and August peak days are crowded; book early and arrive at the station earlier.',
          'Do not assume a late return train exists; check the full timetable before booking accommodation.',
          'Save the line page offline; mobile coverage is weak on parts of the coast.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        textAr:
          'خارج الموسم، يمكنك الوصول إلى مطروح بالطرق البرية أو بالطيران، بينما تعود صفحة القطار لتعرض موعد بداية الموسم القادم.',
        textEn:
          'Outside the season, Matrouh is reachable by road or air, while the train page shows the next season’s start date.',
      },
    ],
  },
];

export const POPULAR_ROUTE_SEO = [
  { fromId: 'cairo-ramses', toId: 'alexandria-misr', priority: 1 },
  { fromId: 'cairo-ramses', toId: 'aswan', priority: 1 },
  { fromId: 'cairo-ramses', toId: 'luxor', priority: 1 },
  { fromId: 'cairo-ramses', toId: 'mansoura', priority: 0.9 },
  { fromId: 'cairo-ramses', toId: 'port-said', priority: 0.8 },
  { fromId: 'alexandria-misr', toId: 'matrouh', priority: 0.7 },
  { fromId: 'cairo-ramses', toId: 'fayoum', priority: 0.6 },
  { fromId: 'cairo-ramses', toId: 'suez', priority: 0.6 },
];
