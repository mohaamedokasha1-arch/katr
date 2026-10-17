# راكِب — Rakeb

> اعرف ميعادك… قبل ما يفوتك
>
> مواعيد قطارات مصر، بدرجة ثقة واضحة لكل معلومة.

Rakeb is an independent, Arabic-first web app for Egyptian rail travellers. It
combines a curated timetable, a four-level confidence model, live station
boards and rider reports — without selling tickets or pretending to be the
national railway.

This repository is a **production-shaped demo**: real routing, real data model,
real auth and audit trail, with a file-backed runtime store standing in for
PostgreSQL + Redis.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # optional: change the demo secrets
npm run dev                    # http://localhost:3000
```

Requirements: Node 22+, npm 10+.

```bash
npm run build        # production build
npm run start        # serve the build on 0.0.0.0:3000
npm run typecheck    # tsc --noEmit (strict)
npm run seed:verify  # data invariants + runtime smoke of the schedule engine
npm run smoke        # HTTP smoke test, requires a running server
npm run worker:sync  # background sync worker (see below)
```

### Demo admin

| Role | Email | Password |
| --- | --- | --- |
| Data manager (approve / publish) | `admin@rakeb.app` | `Rakeb#2026` |
| Data editor (draft changes) | `editor@rakeb.app` | `Rakeb#2026` |

`/admin` is protected by `middleware.ts` and an HMAC-signed, httpOnly cookie
with an 8-hour lifetime. Credentials and the signing secret come from `.env`.
Never keep the demo values in a public deployment.

---

## What is implemented

| Area | Route / module | Notes |
| --- | --- | --- |
| Home | `/` | Hero search, live ticker, published alerts, popular routes, live board preview, confidence explainer, coverage, guides, CTA |
| Search | `/search` | From/To autocomplete with Arabic normalisation, date strip, filters (class, direct, sort), reverse depart-after search, empty states with next available dates |
| Trip detail | `/trip/[tripId]` | Timeline of stops, fare range table per class, confidence explainer, live status, rider report panel, save / remind / WhatsApp share, pre-boarding tips |
| Train number | `/train/[number]` | Redirects to today’s trip or the next operating date |
| Lines | `/lines`, `/line/[slug]` | Line groups, station order, seasonal windows, services per line |
| Stations | `/stations`, `/station/[stationId]` | Tiered directory, station page with live board tabs, facilities, nearby stations |
| Route SEO | `/route/[from]-to-[to]` | Programmatic pages with stats, fares, departure table and FAQs |
| Live board | `/board` | Airport-style dark board, departures/arrivals, SSE stream, confidence legend |
| Status | `/status` | Published delays, cancellations, upcoming and completed services |
| Alerts | `/alerts` | Local reminders, saved trips, notification permission, `ReminderWatcher` |
| Guides | `/guide`, `/guide/[slug]` | Four long-form bilingual guides, table of contents, related routes |
| FAQ / About / Offline | `/faq`, `/about`, `/offline` | FAQ JSON-LD, product transparency, offline shell |
| Admin | `/admin`, `/admin/login` | Stats, change composer, approve/reject, station status, report moderation, audit log, sync runs |
| API | `app/api/**` | Search, live status, crowd reports, notifications, preferences, SSE, admin mutations |
| SEO | `sitemap.ts`, `robots.ts` | Dynamic sitemap with lines, stations, guides and every route pair |

PWA: manifest, install prompt, service worker with offline fallback, cached
fonts. Dark mode and Arabic/English (RTL/LTR) are switchable at runtime.

---

## Architecture at a glance

```
app/            Next.js App Router (routes, API, metadata)
components/     UI by domain: home, search, trip, board, stations, admin, content
lib/            Domain logic: schedule, search, live, reports, store, auth, SEO
workers/        Standalone data pipeline (sync, adapters, validation)
types/          Shared domain types
public/         Icons, manifest, service worker, OG image
scripts/        Data verifier, asset generator, smoke test
docs/           Architecture, API and operations notes
styles/         Reserved for extracted global styles (currently app/globals.css)
```

There is **no `src/` directory** by design: every functional folder sits at the
repository root so the project layout is obvious to contributors and ops.

Key modules:

- `lib/schedule.ts` — layered resolver: **Base → Seasonal → Event → Emergency**.
- `lib/search.ts` — trip construction, segment search, reverse (depart-after)
  search, popular routes, sort and summary.
- `lib/live.ts` — live status precedence, station board windows, network snapshot.
- `lib/reports.ts` — crowd consensus: 3 distinct reporters inside 45 minutes.
- `lib/store.ts` — file-backed repository (`.data/state.json`), audit log,
  overrides, reports, notifications, sync runs.
- `lib/admin.ts` — the only place admin mutations happen; enforces RBAC and
  four-eyes review before anything becomes public.

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full picture,
[docs/API.md](docs/API.md) for endpoint contracts and
[docs/OPERATIONS.md](docs/OPERATIONS.md) for the runbook.

---

## Data model (summary)

- **Stations** — 4 tiers, aliases in Arabic and English, governorate, coordinates,
  amenities, line membership. Tier 4 stops are route-only and not searchable.
- **Lines** — 9 groups (Delta via Tanta, Delta via Damanhour, Upper Egypt,
  Fayoum, Canal–Port Said, Canal–Suez, Mansoura–Damietta, North Delta,
  seasonal Marsa Matrouh) with brand colours and season windows.
- **Services** — 59 seeded services: class mix, fare ranges per class, operating
  days, intermediate stops with offsets. Times are minutes after Cairo midnight;
  `>= 1440` means the next day, so a 22:00 departure can arrive “+1”.
- **Overrides** — published or pending changes (delay, cancellation, schedule
  change, extra run, maintenance) with source, reason and reviewer metadata.
- **Reports** — crowd observations from riders, anonymised by a salted rotating
  hash, confirmed automatically at three distinct reporters or manually in admin.
- **Audit** — every write records actor, role, action, entity and bilingual
  summary.

Confidence levels shown to riders:

| Badge | Level | Meaning |
| --- | --- | --- |
| ✅ green | Official | Published by ENR or an official partner |
| 🔵 blue | Standard schedule | Base timetable, not contradicted today |
| 🟠 orange | Crowd-confirmed today | ≥ 3 independent reports inside 45 min |
| ⚪ grey | Stale | Last verification is old; verify before travelling |

---

## The sync worker

`workers/sync.ts` is a separate entry point, deployable on cron or as a
long-running process. It:

1. pulls observations from a source adapter (the repo ships a deterministic mock),
2. normalises and validates them,
3. deduplicates against published overrides,
4. writes **pending** overrides only,
5. records a sync run and an audit entry.

It can never publish. A human data manager must approve, and the audit entry
records whether the approval was a self-review exception. In production the
adapters are the scrapers/partner feeds under `workers/scrapers/`.

```bash
npm run worker:sync -- --once
RAKEB_WORKER_INTERVAL_MS=60000 npm run worker:sync
```

---

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, JSON-LD, sitemap |
| `RAKEB_AUTH_SECRET` | HMAC secret for the admin session (32+ chars) |
| `RAKEB_ADMIN_EMAIL` / `RAKEB_ADMIN_PASSWORD` | Data manager account |
| `RAKEB_EDITOR_EMAIL` / `RAKEB_EDITOR_PASSWORD` | Data editor account |
| `RAKEB_REPORT_SALT` | Salt for the anonymous reporter hash |
| `RAKEB_STATE_FILE` | Override the JSON state path (default `.data/state.json`) |
| `RAKEB_RESET_STATE=1` | Discard runtime state on boot |
| `RAKEB_WORKER_INTERVAL_MS` / `RAKEB_WORKER_SOURCE` | Worker cadence and source label |

---

## Production path

The demo store is repository-shaped so it can be replaced without touching the
UI: PostgreSQL for timetables, overrides, reports and audit; Redis for pub/sub
and rate limits; Meilisearch for station autocomplete; object storage for
scraped snapshots. The SSE route becomes a Redis subscriber, and the worker
moves to a scheduled container.

Phased roadmap:

1. **Foundation** — curated timetable, search, display, SEO. *(this build)*
2. **Live layer** — scraper workers, confidence, station boards. *(worker +
   SSE contract implemented; production adapters pending)*
3. **Community & notifications** — reports, reminders, PWA. *(implemented
   client-side; push delivery worker pending)*
4. **Scale & SEO** — route pages, guides, official partnership. *(route pages
   and guides shipped; partnership is organisational)*

---

## Disclaimer

Rakeb is independent and not affiliated with Egyptian National Railways.
Official station announcements take precedence. Fares shown are estimated
ranges and do not constitute a booking offer.

Built with Next.js 15, React 19, TypeScript, Tailwind CSS and IBM Plex Sans
Arabic / IBM Plex Mono.
