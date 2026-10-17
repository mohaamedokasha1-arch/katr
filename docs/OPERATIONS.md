# Rakeb — operations runbook

## Local lifecycle

```bash
npm install
npm run dev            # http://localhost:3000, bound to 0.0.0.0
npm run typecheck
npm run seed:verify    # data invariants + schedule/live smoke
npm run smoke          # requires a running server (BASE_URL overridable)
```

Runtime state lives in `.data/state.json` (gitignored). Delete it or boot with
`RAKEB_RESET_STATE=1` to return to the seeded demo state. The seed is date-aware:
published announcements are generated relative to Cairo “today”.

## Deploying

1. Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin.
2. Set a 32+ character `RAKEB_AUTH_SECRET`; rotate both demo passwords.
3. Build with `npm run build`; start with `npm run start`.
4. The filesystem must be writable for the demo store. On read-only platforms
   (including Vercel’s default), mutations are best-effort and will not persist
   across instances — connect PostgreSQL before relying on admin writes.
5. Serve `/api/board/*/stream` through a proxy that does not buffer
   (`X-Accel-Buffering: no` is already set). Disable response compression for
   `text/event-stream`.
6. Schedule `workers/sync.ts` (cron `*/5 * * * *` or a long-running container)
   and keep its timezone at `Africa/Cairo`.

## Publishing a change (four eyes)

1. **Editor** signs in, opens `/admin`, fills *New change request* and submits.
   The request is `pending`; riders cannot see it.
2. **Data manager** signs in, checks the request against the ops sheet, writes a
   review note and presses *Approve & publish*.
3. The change immediately affects search, trip pages, the live board and
   `/status`.
4. The audit log records both actions with actor, role and timestamp.

In the single-manager demo, a manager can publish their own draft; the audit
summary marks it `self-review exception`. In production, remove that branch or
require a second manager account.

To reject: press *Reject* on the pending row. A rejected override is invisible
to riders and is not re-created by the worker while its date range overlaps a
published change.

## Crowd report moderation

Reports confirm automatically when three distinct reporter hashes agree inside
45 minutes. Manual moderation exists for edge cases:

- *Confirm* raises the report to `confirmed` and includes it in consensus.
- *Reject* excludes it entirely.

If a confirmed report is wrong, publish a corrective override — that always
outranks crowd data in the precedence chain.

## Station incidents

Set a hub to maintenance from `/admin`. A warning appears on the station page.
The status is operational, not a timetable change: trains still render. For a
line closure, publish a `maintenance` override on the line instead.

## Sync worker

```bash
npm run worker:sync -- --once
npm run worker:sync                       # every 5 minutes
RAKEB_WORKER_INTERVAL_MS=60000 npm run worker:sync
RAKEB_WORKER_SOURCE=partner-feed npm run worker:sync -- --once
```

The worker writes only pending overrides, records a `SyncRun` and an audit
entry. If a run reports `failed`, check adapters and credentials; the previous
published data stays live.

## Incident checklist

| Symptom | First checks |
| --- | --- |
| Times look stale | Check confidence badges; run a sync probe; verify the worker is alive |
| Admin login loops | `RAKEB_AUTH_SECRET` changed? Cookie is invalidated; sign in again |
| 401 from `/api/admin/*` | Session expired (8 h) or cookie stripped by a proxy |
| SSE board frozen | Proxy buffering, compression on `text/event-stream`, or worker not publishing |
| Empty search | Seasonal line out of season, or date outside operating days; check `nextDates` |
| Reports never confirm | Same device/IP submitting repeatedly (one hash per day); verify salt changes daily |
| Sitemap missing routes | `NEXT_PUBLIC_SITE_URL` mismatch; rebuild after changing it |

## Security notes

- Session tokens are HMAC-signed and verified in middleware and again in the
  mutation layer.
- Report identity uses a salted daily hash; never log raw request bodies with
  contact details.
- Rate limits are per-process. Put Redis in front before running more than one
  instance.
- Admin and API routes are excluded from indexing in `robots.ts`.
- The demo credentials are public by design; never reuse them in a deployment.

## Release checklist

- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run seed:verify`
- [ ] `npm run smoke` against the preview deployment
- [ ] Check `/admin/login` in a private window and confirm the redirect flow
- [ ] Publish one change end-to-end (draft → approve → verify on `/status`)
- [ ] Confirm SSE board updates within 25 seconds
- [ ] Verify `sitemap.xml` count and `robots.txt` disallows
- [ ] Dark mode and English toggle spot check on home, search and trip pages
