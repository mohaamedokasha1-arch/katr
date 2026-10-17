# workers/

Standalone data-plane processes. They are deliberately outside `app/` and never
import React or Next.js. They may import `lib/` domain modules.

```
workers/
├── sync.ts               # scheduled ingest → pending overrides
├── scrapers/             # (production) source adapters, one per feed
├── validators/           # (production) schema + business-rule checks
└── scheduler-config/     # (production) cron/Temporal definitions
```

## sync.ts

A complete, runnable worker that demonstrates the production contract:

```bash
npm run worker:sync -- --once     # single pass
npm run worker:sync               # every 5 minutes
```

What it does:

1. asks each adapter for observations for Cairo “today”,
2. deduplicates against published overrides,
3. writes `pending` overrides through the repository,
4. records a `SyncRun` plus an audit entry,
5. never publishes and never edits base timetable data.

Environment:

| Variable | Default | Purpose |
| --- | --- | --- |
| `RAKEB_STATE_FILE` | `.data/state.json` | shared state with the web app |
| `RAKEB_WORKER_INTERVAL_MS` | `300000` | cadence for continuous mode |
| `RAKEB_WORKER_SOURCE` | `mock-enr-feed` | label in the sync run |

## Production adapters

A real adapter should expose the same shape as the mock:

```ts
interface Observation {
  serviceNumber: string;
  date: string;                 // Cairo YYYY-MM-DD
  type: 'delay' | 'cancellation';
  delayMinutes?: number;
  reasonAr: string;
  reasonEn: string;
  source: 'official' | 'ops' | 'partner' | 'community';
}
```

Rules:

- **Fail closed.** A parse failure returns no observations.
- **Idempotent.** The same snapshot must not create duplicate overrides.
- **Traceable.** Store source URL, fetched-at and content hash.
- **Human in the loop.** Automated sources may only create `pending` rows.

In production the worker writes to PostgreSQL and publishes a Redis event so the
SSE endpoint can fan out to open boards. The demo writes to the shared JSON
store, which the web app reads directly.

## Scheduling

- Cron: `*/5 * * * *` for the feed, `0 3 * * *` for the daily staleness sweep.
- Container: long-running with a health check on the last successful run.
- Alerts: page on two consecutive `failed` runs, or on a run that fetches zero
  services when the source usually returns more than zero.
