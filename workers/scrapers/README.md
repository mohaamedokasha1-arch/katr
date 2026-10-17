# scrapers/

Production source adapters live here, one module per feed:

```
scrapers/
├── enr-public.ts        # public timetable pages (respect robots + rate limits)
├── partner-feed.ts      # contracted JSON/XML feed
└── ops-room.ts          # operations export or shared sheet
```

Contract: each adapter exports an async function returning raw observations for
a Cairo date. It must never touch the repository directly — `workers/sync.ts`
normalises, validates and writes pending overrides.

Hard rules:

- fail closed: a parse error returns zero observations, never a guess;
- record source URL, fetched-at and content hash;
- respect `robots.txt`, terms of use and rate limits;
- never publish; automated input is always `pending`;
- no credentials in code — use the environment/secret manager.

See `docs/DATA-SOURCES.md` for the promotion policy.
