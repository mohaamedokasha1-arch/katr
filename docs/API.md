# Rakeb — HTTP API

All endpoints live under `/api`. Responses are JSON unless noted; times are
minutes after Cairo midnight unless an ISO timestamp is explicit. Errors use
`{ "error": "code", "message"?: "human copy" }` or `{ "message": "..." }` for
validation failures.

Rate limits are per `ip + user-agent` fingerprint, in-memory in the demo.

| Endpoint | Method | Auth | Limit |
| --- | --- | --- | --- |
| `/api/search` | GET | public | 30 / min |
| `/api/live-status` | GET | public | 60 / min |
| `/api/board/[stationId]/stream` | GET (SSE) | public | none |
| `/api/reports` | POST | public | 12 / min |
| `/api/notifications` | POST | public | 20 / min |
| `/api/preferences` | POST | public | none |
| `/api/admin/*` | GET/POST/PATCH | admin session | none |

---

## GET /api/search

Query: `from`, `to` (required, station ids), `date` (`YYYY-MM-DD`, defaults to
today in Cairo), `direct=1`, `classes=ac1,ac2`, `sort=departure|arrival|duration|price`.

```bash
curl "http://localhost:3000/api/search?from=cairo-ramses&to=alexandria-misr&date=2026-10-17"
```

```json
{
  "query": { "from": "cairo-ramses", "to": "alexandria-misr", "date": "2026-10-17", "directOnly": false, "classes": [], "sort": "departure" },
  "count": 12,
  "trips": [
    {
      "tripId": "1607-2026-10-17",
      "serviceNumber": "1607",
      "titleAr": "ثالثة مكيفة",
      "departMinutes": 300,
      "arriveMinutes": 555,
      "durationMinutes": 255,
      "lowestFare": 120,
      "status": { "kind": "on_time", "delayMinutes": 0 },
      "confidence": { "level": "standard", "score": 85, "reasonKeys": ["base_timetable"] }
    }
  ],
  "summary": { "count": 12, "fastestMinutes": 165, "cheapestFare": 120 },
  "nextDates": []
}
```

`400` when either station is missing, unknown or identical.

---

## GET /api/live-status

Query (one of):

- `trip=<service>-<date>` — status and confidence for a trip,
- `station=<id>&direction=departures|arrivals` — board rows,
- neither — network snapshot.

```json
{
  "now": "2026-10-17T19:00:36.145Z",
  "tripId": "905-2026-10-17",
  "status": { "kind": "delayed", "delayMinutes": 20, "expectedDepartureMinutes": 380 },
  "confidence": { "level": "official", "score": 97, "communityConfirmations": 0 }
}
```

`404` for an unknown trip, `422` for malformed parameters.

---

## GET /api/board/[stationId]/stream

`text/event-stream`. Emits `hello` once, `board` every 20 seconds and `ping`
every 10 seconds. `direction=arrivals` switches the slice.

```
event: hello
data: {"station":{"id":"cairo-ramses"},"direction":"departure","intervalMs":20000}

event: board
data: {"generatedAtIso":"...","rows":[...]}
```

Clients should reconnect with `Last-Event-ID` unset; the server always sends a
full snapshot. In production this becomes a Redis subscription with the same
payload.

---

## POST /api/reports

```json
{
  "serviceNumber": "905",
  "date": "2026-10-17",
  "stationId": "cairo-ramses",
  "kind": "delayed",
  "delayMinutes": 15,
  "note": "القطار واقف على الرصيف من نص ساعة"
}
```

`kind`: `still_waiting | delayed | moving | arrived | cancelled`.
`delayMinutes` is required for `delayed`.

`201`:

```json
{
  "ok": true,
  "requestId": "uuid",
  "duplicate": false,
  "consensus": { "total": 1, "uniqueReporters": 1, "confirmed": false, "delayMinutes": 15, "needed": 2 }
}
```

`200` with `duplicate: true` when the same reporter submitted within 10 minutes.
`429` includes `Retry-After`. `422` for payload problems. `404` for unknown
service or station.

Reporter identity is a salted daily hash; no IP or user id is stored.

---

## POST /api/notifications

```json
{ "tripId": "905-2026-10-17", "minutesBefore": 60, "channel": "web-push" }
```

`channel`: `web-push` (default) or `email` (requires `contact`).
`201` returns the stored subscription id and a note explaining that delivery is
the worker’s responsibility. The browser keeps the authoritative reminder in
`localStorage`; this endpoint is the server-side mirror used by the future push
worker.

---

## POST /api/preferences

```json
{ "locale": "en" }
```

Sets the `rakeb_locale` cookie (1 year, `SameSite=Lax`). Returns
`{ "ok": true, "locale": "en" }`. `422` for any value other than `ar`/`en`.

---

## Admin API

Requires the `rakeb_admin` session cookie. Middleware returns `401` JSON for
`/api/admin/**` without it.

### GET /api/admin/overrides

Returns all runtime overrides with an `isPending` convenience flag.

### POST /api/admin/overrides

```json
{
  "type": "delay",
  "serviceNumber": "905",
  "fromDate": "2026-10-17",
  "toDate": "2026-10-17",
  "delayMinutes": 20,
  "reasonAr": "أعمال صيانة",
  "reasonEn": "Maintenance works",
  "source": "ops"
}
```

Creates a **pending** override and an audit entry. `type` is one of
`delay | cancellation | schedule_change | extra_run | maintenance`;
`maintenance` requires `lineId` instead of `serviceNumber`.

### PATCH /api/admin/overrides/[id]

```json
{ "action": "publish", "note": "Reviewed against the ops sheet" }
```

`action`: `publish | reject`. Only `admin` may call it. Publishing a draft the
same account created is recorded as a self-review exception. Returns `409` when
the override is no longer pending.

### PATCH /api/admin/reports/[id]

```json
{ "action": "confirm" }
```

`action`: `confirm | reject`. Manual confirmation is for edge cases; the normal
path is the automatic three-reporter threshold.

### PATCH /api/admin/stations/[stationId]

```json
{ "status": "maintenance" }
```

`status`: `active | maintenance`. Surfaced as a warning on the station page.

### GET/POST /api/admin/sync

`GET` lists recent sync runs. `POST` triggers a manual probe run (records a
`SyncRun` + audit entry) and returns the created run. This is a demo stand-in
for poking the worker; the worker itself can run independently.

---

## Conventions

- Dates are `YYYY-MM-DD` in Cairo local time.
- Clock values are minutes after midnight; a value `>= 1440` belongs to the next
  day and the UI renders a `+1` badge.
- Station ids are stable slugs (`cairo-ramses`, `alexandria-misr`,
  `tanta`, …). Route SEO slugs are derived, never stored.
- All responses are `no-store` where they include live state.
- Bilingual copy is returned as paired `*Ar` / `*En` fields; the client picks.
