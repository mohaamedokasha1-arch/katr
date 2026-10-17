import { NextResponse } from 'next/server';
import { z } from 'zod';
import { insertNotification, listNotifications } from '@/lib/store';
import { getTripById } from '@/lib/search';
import { clientFingerprint, rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  tripId: z.string().regex(/^\d{3,5}-\d{4}-\d{2}-\d{2}$/),
  minutesBefore: z.number().int().min(5).max(1440).default(60),
  channel: z.enum(['web-push', 'email']).default('web-push'),
  contact: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  const limit = rateLimit(`notify:${clientFingerprint(request.headers)}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ message: 'Too many requests.' }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid notification payload', issues: parsed.error.issues.map((issue) => issue.message) },
      { status: 422 },
    );
  }

  const { tripId, minutesBefore, channel, contact } = parsed.data;
  if (channel === 'email' && !contact) {
    return NextResponse.json({ message: 'Email channel requires a contact address' }, { status: 422 });
  }

  const trip = getTripById(tripId);
  if (!trip) {
    return NextResponse.json({ message: 'Trip not found' }, { status: 404 });
  }

  const subscription = insertNotification({
    tripId,
    minutesBefore,
    channel,
    contact,
  });

  return NextResponse.json(
    {
      ok: true,
      subscription: {
        id: subscription.id,
        tripId: subscription.tripId,
        minutesBefore: subscription.minutesBefore,
        channel: subscription.channel,
        createdAt: subscription.createdAt,
      },
      note:
        'Saved on the demo server. In production this row is handed to the push worker which owns the VAPID keys and the retry queue.',
    },
    { status: 201 },
  );
}

export async function GET() {
  return NextResponse.json({
    count: listNotifications().length,
    channel: 'web-push',
    note: 'Subscriptions are write-only from the client; delivery is handled by workers/notify.ts.',
  });
}
