# tests/

Current coverage is intentionally pragmatic:

- `npm run seed:verify` — data invariants and a runtime smoke of the schedule,
  search, board and override engine (no server required).
- `npm run smoke` — HTTP smoke test against a running server: public pages,
  404 semantics, search/live APIs, validation errors, admin protection, SSE,
  sitemap and robots.

Both are dependency-free so they can run in CI before a test framework is
installed. When the production database lands, add:

```
tests/
├── e2e/            # Playwright: search → trip → reminder, admin publish flow
├── contract/       # API schema snapshots (zod → JSON Schema)
└── fixtures/       # seeded Cairo days around DST and midnight boundaries
```

Priority cases for the e2e suite:

1. search at 23:50 Cairo with a next-day arrival (`+1` badge);
2. DST transition night;
3. seasonal Marsa Matrouh line in and out of season;
4. editor drafts → manager publishes → confidence becomes `official`;
5. three distinct reports → community confirmation;
6. offline navigation falls back to `/offline`;
7. locale switch keeps the same route and flips direction;
8. admin session expiry redirects to login with `next` preserved.
