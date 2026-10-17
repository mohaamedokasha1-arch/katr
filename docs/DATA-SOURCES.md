# Data sources and trust policy

Rakeb is only useful if riders can tell *how much* to trust a time. This file
defines where data comes from, how it is promoted, and what riders are told.

## 1. Tiers

| Tier | Source | Entry path | Rider badge |
| --- | --- | --- | --- |
| A | Official partnership / ENR feed | Automated ingest + human approval | ✅ official (97) |
| B | Operations room or partner export | Import + human review | ✅ official / 🔵 standard |
| C | Scraped public pages | Worker observations only | 🔵 standard, or 🟠 once confirmed |
| D | Rider reports | Crowd consensus | 🟠 community (76) |

The demo ships Tier A/B records as seed data and simulates Tier C through
`workers/sync.ts`. Tier D is live through `/api/reports`.

## 2. Promotion rules

A fact can move **up** a tier only through one of these paths:

1. **Official publication** — a data manager approves a partner-sourced change.
   The override is `published`, the audit entry names the reviewer, and the
   confidence reason is `partner_feed` / `admin_published`.
2. **Crowd confirmation** — three distinct reporter hashes agree on the same
   claim inside 45 minutes. The system promotes the batch to `confirmed` and
   records `crowd_confirmed`.
3. **Manual moderation** — a manager confirms a single edge-case report. This is
   logged as `report.confirm`; it does not bypass the four-eyes rule for
   timetable changes.

A fact moves **down** automatically when the staleness horizon passes, or when
a higher-precedence source contradicts it. The UI shows the level, never the raw
score alone.

## 3. Precedence

```
emergency cancellation
  > published schedule change / delay
    > confirmed crowd consensus
      > automated observation
        > base timetable
```

Seasonality sits *outside* this chain: a service that is out of season does not
run at all, regardless of any observation. This prevents a scraper from
“reviving” a summer-only train in January.

## 4. Scraping rules

- Respect `robots.txt`, rate limits and terms of use. Prefer an official feed or
  a partnership over scraping.
- Store the source URL, fetch time, HTTP status and a content hash for every
  snapshot. Never store more personal data than the published page contains.
- Parsers must fail closed: a layout change produces `status: failed` and **no**
  override, never a guess.
- Never publish automatically. The worker writes `pending` rows only.
- Deduplicate by service, type and date range before writing.
- Retries are exponential and capped; a failing source must not block others.

## 5. Crowd-report integrity

- Identity is a salted, daily-rotating hash of IP + user agent. The salt
  (`RAKEB_REPORT_SALT`) must rotate daily in production and be stored in the
  secret manager, not in the repository.
- One report per reporter per claim window (10 minutes) is accepted.
- The consensus picker chooses the largest same-group cluster; it never mixes a
  delay claim with a cancellation claim.
- Rejected reports are excluded from consensus and from counts shown to riders.
- Reports are never used to *lower* confidence for a service with an official
  published change; official data wins.

## 6. Review SLAs (production target)

| Event | First review | Publish target |
| --- | --- | --- |
| Cancellation or line closure | 5 min | 10 min |
| Delay > 20 min | 10 min | 20 min |
| Schedule change / extra run | 2 h | 24 h |
| Station facility / maintenance | 24 h | 48 h |
| Stale-data re-verification | weekly | 14 days |

## 7. Rider communication

Every surface that shows a time also shows:

- the confidence badge with a plain-language label;
- the last-updated time for live values;
- a link to the trip or station where the source is explained;
- a reminder that the official station announcement prevails.

When data is stale we say so explicitly. We never present an unverified value as
official, and we never hide a cancellation behind an “on time” badge.
