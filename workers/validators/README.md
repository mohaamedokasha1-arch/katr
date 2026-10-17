# validators/

Schema and business-rule validation shared by every adapter before a pending
override is written:

- known service number, known station ids, ordered stops;
- date range sane and inside the operating calendar;
- delay between 0 and 240 minutes; new departure within 00:00–23:59;
- reason present in Arabic and English;
- no duplicate override covering the same service/type/date;
- an observation that contradicts an official published change is rejected and
  logged, not published.

The demo keeps these checks in `lib/admin.ts` and `workers/sync.ts`; in
production the shared validators move here so the web app and workers import the
same functions.
