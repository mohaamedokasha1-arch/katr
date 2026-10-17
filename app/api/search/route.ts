import { NextResponse } from 'next/server';
import { normaliseSearchQuery, searchTrips } from '@/lib/search';
import { clientFingerprint, rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * JSON mirror of /search, used by the PWA offline fallback, by the command
 * palette and by partner integrations. The HTML page remains canonical.
 */
export async function GET(request: Request) {
  const limit = rateLimit(`search:${clientFingerprint(request.headers)}`, 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ message: 'Too many searches.' }, { status: 429 });
  }

  const url = new URL(request.url);
  const query = normaliseSearchQuery({
    from: url.searchParams.get('from'),
    to: url.searchParams.get('to'),
    date: url.searchParams.get('date'),
    direct: url.searchParams.get('direct'),
    classes: url.searchParams.get('classes'),
    sort: url.searchParams.get('sort'),
  });

  if (!query) {
    return NextResponse.json(
      {
        message:
          'Provide valid from and to station ids (different stations) plus an optional date, direct flag, classes and sort.',
      },
      { status: 400 },
    );
  }

  const result = searchTrips(query);
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
