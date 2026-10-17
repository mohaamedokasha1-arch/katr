# Rakeb — architecture

Status: demo-complete, production adapter pending. This document describes how
the repository is organised, how a timetable becomes a rider-facing answer, and
where the demo stops short of the production design.

## 1. Design goals

1. **A rider can decide in under three seconds** — server-rendered results, no
   client-side data waterfall, no layout shift on slow networks.
2. **Every fact carries provenance** — a time without a confidence level is a
   liability, not a feature.
3. **The UI never hides uncertainty** — confidence and last-verified labels are
   part of the primary surface, not a footnote.
4. **Arabic first, mobile first, offline tolerant** — 360 px is the reference
   viewport; Cairo is the reference clock.
5. **Operators cannot bypass review** — all writes go through one module that
   enforces RBAC and records an audit entry.

## 2. Runtime topology

```
                    ┌──────────────────────────────┐
   browser / PWA ──▶│ Next.js (App Router)          │
                    │  RSC pages + route handlers   │
                    │  middleware: admin auth       │
                    └───────┬───────────────┬───────┘
                            │               │
              read path     │               │  write path
                            ▼               ▼
                    ┌──────────────┐  ┌──────────────┐
                    │ domain libs  │  │ lib/admin.ts │
                    │ schedule     │  │ RBAC + audit │
                    │ search       │  └──────┬───────┘
                    │ live         │         │
                    │ reports      │         ▼
                    └──────┬───────┘  ┌──────────────┐
                           │          │ lib/store.ts │
                           └─────────▶│ repository   │
                                      └──────┬───────┘
                                             │
                    ┌────────────────────────┴──────────────┐
                    │ demo: .data/state.json                │
                    │ prod: PostgreSQL + Redis pub/sub      │
                    └───────────────────────────────────────┘

   workers/sync.ts ──▶ adapters ──▶ validation ──▶ pending overrides
```

The domain layer is deliberately independent of Next.js. Route handlers and
server components are thin: they parse input, call a domain function and render.

## 3. Folder contract

| Folder | Allowed contents |
| --- | --- |
| `app/` | Routes, layouts, route handlers, metadata files. No business rules. |
| `components/` | Presentational and interaction components, grouped by domain. |
| `lib/` | Pure or repository-bound domain logic. Never imports React. |
| `lib/data/` | Seed datasets and pure lookups. Never imports `lib/store`. |
| `workers/` | Standalone processes. May import `lib/`, never `app/` or React. |
| `types/` | Shared types only. No runtime code. |
| `public/` | Static assets, manifest, service worker, social image. |
| `scripts/` | Developer and CI utilities. Never shipped to the browser. |
| `docs/` | This documentation. |
| `styles/` | Reserved for extracted global CSS; tokens currently live in `tailwind.config.js` and `app/globals.css`. |

There is no `src/`. The constraint is intentional: operational entry points
(`workers/`, `docs/`, `middleware.ts`) must be visible at a glance.

## 4. Time model

All timetable values are **minutes after Cairo midnight** for the service’s
origin date.

- `0 … 1439` — same calendar day.
- `>= 1440` — the following day(s). `minutesDayOffset()` derives the badge.
- Trip identity is `<serviceNumber>-<YYYY-MM-DD>` where the date is the origin
  date, never the boarding date. A 23:40 departure boarding after midnight in
  Cairo still belongs to the previous day’s trip.
- Board windows compare absolute epoch minutes:
  `epochDay(date) * 1440 + clock`.

DST is handled by converting through `Africa/Cairo` once at the boundary
(`toUtcDate`, `cairoClock`), never by adding naive 24-hour offsets.

## 5. Schedule resolution

`lib/schedule.ts` resolves a single question: *does this service run on this
date, and did anything change?*

Order of precedence (highest first):

1. **Emergency** — cancellation or line closure published by operations.
2. **Event** — extra runs, holiday timetables.
3. **Seasonal** — e.g. Marsa Matrouh between 1 June and 30 September.
4. **Base** — recurring operating days (`daily`, `weekdays`, `except`).

Each layer returns a `RunDecision`:

```ts
{ runs, cancelled, extraRun, seasonalOff, cancellationReason, source }
```

Delay and departure shift are computed separately so a delay never masquerades
as a cancellation. `getActiveOverrides()` and `scheduleShiftMinutes()` are the
only places that interpret an override’s effect.

## 6. Search

`searchTrips()`:

1. normalises the query (station ids, date, classes, sort, direct flag),
2. enumerates candidate services that contain both stations in order,
3. resolves each service for the requested date,
4. builds a `TripResult` for the requested segment (not the full line),
5. computes departure/arrival, day offsets, duration, fare range, status,
   confidence, platform and boarding tips,
6. sorts and summarises.

Reverse search (“I want to arrive by 09:00”) filters by `arriveMinutes` and
sorts by arrival. Train-number search resolves `/train/[number]` to today’s
trip or probes forward for the next operating date.

Autocomplete is a separate browser-safe module (`lib/stations-search.ts`) with
Arabic normalisation: hamza forms, taa marbuta, alef maqsura, diacritics,
definite article and common colloquial aliases (e.g. “محطة مصر”, “رمسيس”).

## 7. Confidence model

Four public levels, derived — never stored as free text:

| Level | Score | Trigger |
| --- | --- | --- |
| `official` | 97 | Partner/official feed, admin-published change, live sensor |
| `standard` | 85 | Base timetable with no contradiction today |
| `community` | 76 | ≥ 3 distinct reporters inside a 45-minute window |
| `stale` | 45 | No verification within the staleness horizon |

`lib/live.ts` computes status first (cancelled > delayed > boarding > in transit
> arrived > on time), then derives confidence with structured `reasonKeys`. The
UI renders the keys bilingually. Scores are internal; riders see the level, the
explanation and the last-updated timestamp.

Status precedence:

1. published human-reviewed override,
2. confirmed crowd consensus,
3. automatic observation,
4. timetable.

The demo simulates the automatic observation deterministically from a hash of
service, station and date, so screenshots are stable across reloads.

## 8. Station board and SSE

`getStationBoard()` evaluates services in a rolling window (departures
−45/+240 minutes, arrivals −30/+210), then slices both directions from the same
sorted set.

`GET /api/board/[stationId]/stream` is a Server-Sent Events endpoint:

```
event: hello   → station, direction, interval
event: board   → rows (every 20 s)
event: ping    → keep-alive (every 10 s)
```

In production the interval is replaced by a Redis subscription; the payload is
identical, so the client does not change. The board page also refreshes through
`router.refresh()` every 45 seconds as a fallback for proxies that buffer SSE.

## 9. Crowd reports

- Reporter identity is `sha256(salt : day : ip|ua)[0..24]`. Raw IPs are never
  persisted.
- Duplicate submissions from the same reporter within 10 minutes are collapsed.
- Consensus picks the largest same-group cluster inside 45 minutes and requires
  three distinct reporter hashes.
- A pending report still contributes to the UI count but is labelled as
  unconfirmed until the threshold is met. Rejected reports are excluded.

## 10. Auth and authorisation

| Concern | Implementation |
| --- | --- |
| Session | HMAC-SHA256 token in an httpOnly, `SameSite=Lax` cookie, 8 h TTL |
| Verification | Web Crypto in `lib/auth-edge.ts` so middleware can run on the edge |
| Roles | `admin` (approve/publish, station status, report moderation, sync) and `editor` (draft changes) |
| Route protection | `middleware.ts` for `/admin/**` and `/api/admin/**` |
| Defence in depth | Every mutation re-verifies the cookie via `lib/admin.ts` |
| Four eyes | Editor drafts; manager publishes. Self-review is permitted only because the demo has one manager, and it is recorded as an exception in the audit summary |

CSRF: mutations are same-origin form posts or JSON requests protected by
`SameSite=Lax` plus explicit JSON content type. Production should add a
double-submit token.

## 11. Storage

`lib/store.ts` is a synchronous repository over `.data/state.json`:

```
RuntimeState = { overrides, reports, audit, notifications, syncRuns, stationStatus }
```

Guarantees:

- read-through seeding on first access,
- day-scoped demo seed so announcements remain plausible,
- capped collections,
- best-effort writes on read-only filesystems.

The interface is deliberately repository-shaped. Production mapping:

| Demo | Production |
| --- | --- |
| `overrides[]` | `overrides` table + `override_reviews` |
| `reports[]` | `reports` with reporter hash index |
| `audit[]` | append-only `audit_log` (no update/delete grants) |
| `notifications[]` | `push_subscriptions` + delivery queue |
| `syncRuns[]` | `sync_runs` with worker metrics |
| `stationStatus{}` | `stations.operational_status` |
| rate limiter | Redis `INCR` + expiry buckets |
| station search | Meilisearch index fed by the same seed |

## 12. Rendering and caching

- Public pages are dynamic where live state is involved (`force-dynamic`) and
  statically generated where they are content-only (`/guide/[slug]`).
- Route pages and line pages use `generateMetadata` for canonical URLs and
  OpenGraph images.
- `sitemap.ts` enumerates static pages, lines, stations, guides and every
  ordered route pair; `robots.ts` keeps search, trip, admin and API out of the
  index.
- The service worker caches the shell and serves `/offline` on failed
  navigations. It never caches API responses.

## 13. Accessibility and i18n

- Semantic landmarks, one `h1` per page, visible focus rings, 44 px targets.
- Live regions for status changes, `aria-pressed` on filters, labelled inputs.
- RTL/LTR driven by `<html dir>`; logical CSS properties (`ms-*`, `pe-*`) are
  used throughout, with directional icons flipped by `rtl:rotate-180`.
- Numerals use IBM Plex Mono with `font-variant-numeric: tabular-nums` so times
  align in columns and on the board.
- Reduced motion respected for the ticker and skeleton shimmer.

## 14. Known gaps before production

1. Real partner feeds and scrapers (the worker contract exists; adapters are
   deterministic mocks).
2. PostgreSQL migrations and Redis pub/sub.
3. Push delivery worker with VAPID keys and retry semantics.
4. Full-text station search in Meilisearch for Arabic spelling variants.
5. Error tracking (Sentry) and product analytics.
6. E2E tests against a seeded database; current smoke test is HTTP-level.
7. Rate limiting is per-process memory; move to Redis before horizontal scale.
