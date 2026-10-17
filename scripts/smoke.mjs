#!/usr/bin/env node
/**
 * HTTP smoke test for Rakeb.
 *
 *   npm run smoke
 *   BASE_URL=https://preview.example npm run smoke
 *
 * Requires a running server. Intentionally dependency-free so it can run in CI
 * before test tooling is installed.
 */
const BASE = (process.env.BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');

const results = [];
let failed = 0;

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  if (!ok) failed += 1;
  const icon = ok ? '✓' : '✗';
  console.log(`${icon} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function page(path, marker) {
  try {
    const response = await fetch(`${BASE}${path}`, { redirect: 'follow' });
    const html = await response.text();
    const ok = response.status === 200 && (!marker || html.includes(marker));
    record(`GET ${path}`, ok, ok ? '' : `status ${response.status}${marker ? ', marker missing' : ''}`);
  } catch (error) {
    record(`GET ${path}`, false, error.message);
  }
}

async function status(path, expected) {
  try {
    const response = await fetch(`${BASE}${path}`, { redirect: 'manual' });
    record(`${expected} ${path}`, response.status === expected, `got ${response.status}`);
  } catch (error) {
    record(`${expected} ${path}`, false, error.message);
  }
}

async function json(path, validate, options) {
  try {
    const response = await fetch(`${BASE}${path}`, options);
    const body = await response.json().catch(() => null);
    const ok = validate(response, body);
    record(`${options?.method ?? 'GET'} ${path}`, ok, ok ? '' : `status ${response.status}`);
    return body;
  } catch (error) {
    record(`${options?.method ?? 'GET'} ${path}`, false, error.message);
    return null;
  }
}

async function main() {
  console.log(`\nRakeb smoke test → ${BASE}\n`);

  await page('/', 'راكب');
  await page('/search?from=cairo-ramses&to=alexandria-misr', 'رحلة');
  await page('/lines');
  await page('/board');
  await page('/stations');
  await page('/station/cairo-ramses');
  await page('/guide');
  await page('/guide/talgo-vs-russian-ac');
  await page('/faq');
  await page('/about');
  await page('/offline');

  await status('/station/not-a-station', 404);
  await status('/guide/not-a-guide', 404);
  await status('/trip/not-a-trip', 404);
  await status('/search', 200);

  // A trip id depends on today; probe the documented demo service.
  const snapshot = await json('/api/live-status', (res) => res.ok);
  record('live status has network snapshot', Boolean(snapshot?.network?.total > 0));

  const search = await json(
    '/api/search?from=cairo-ramses&to=alexandria-misr',
    (res, body) => res.ok && body.count > 0 && Array.isArray(body.trips),
  );
  if (search?.trips?.[0]) {
    await page(`/trip/${search.trips[0].tripId}`, 'الرحلة');
    await page(`/train/${search.trips[0].serviceNumber}`);
  }

  await json(
    '/api/search?from=cairo-ramses&to=cairo-ramses',
    (res) => res.status === 400,
  );

  await json(
    '/api/reports',
    (res) => res.status === 422,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceNumber: '905', date: 'not-a-date', stationId: 'cairo-ramses', kind: 'delayed' }),
    },
  );

  const prefs = await json(
    '/api/preferences',
    (res, body) => res.ok && body.locale === 'ar',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'ar' }),
    },
  );
  record('preferences validates locale', Boolean(prefs?.ok));

  try {
    const response = await fetch(`${BASE}/admin`, { redirect: 'manual' });
    const location = response.headers.get('location') ?? '';
    record('admin requires a session', [302, 307].includes(response.status) && location.includes('/admin/login'));
  } catch (error) {
    record('admin requires a session', false, error.message);
  }

  await json('/api/admin/overrides', (res) => res.status === 401);

  try {
    const response = await fetch(`${BASE}/api/board/cairo-ramses/stream`, {
      headers: { Accept: 'text/event-stream' },
    });
    const reader = response.body?.getReader();
    const chunk = reader ? await reader.read() : null;
    const text = chunk?.value ? new TextDecoder().decode(chunk.value) : '';
    record('SSE board emits hello', response.ok && text.includes('event: hello'));
    await reader?.cancel();
  } catch (error) {
    record('SSE board emits hello', false, error.message);
  }

  try {
    const sitemap = await fetch(`${BASE}/sitemap.xml`).then((res) => res.text());
    const routeCount = (sitemap.match(/<loc>/g) ?? []).length;
    record(
      'sitemap enumerates routes',
      routeCount > 300 && sitemap.includes('/route/') && sitemap.includes('/station/'),
      `${routeCount} urls`,
    );
    const robots = await fetch(`${BASE}/robots.txt`).then((res) => res.text());
    record('robots disallows admin', robots.includes('/admin') && robots.includes('sitemap'));
  } catch (error) {
    record('sitemap/robots', false, error.message);
  }

  const failures = results.filter((item) => !item.ok);
  console.log(`\n${results.length - failures.length}/${results.length} checks passed\n`);
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Smoke test crashed:', error);
  process.exitCode = 1;
});
