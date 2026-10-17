import { NextResponse } from 'next/server';
import { z } from 'zod';
import { LOCALE_COOKIE } from '@/lib/locale';

const bodySchema = z.object({
  locale: z.enum(['ar', 'en']),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'locale must be "ar" or "en"' },
      { status: 422 },
    );
  }

  const response = NextResponse.json({ ok: true, locale: parsed.data.locale });
  response.cookies.set({
    name: LOCALE_COOKIE,
    value: parsed.data.locale,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: false,
  });
  return response;
}
