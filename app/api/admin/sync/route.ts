import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { runSyncProbe } from '@/lib/admin';
import { listSyncRuns } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ runs: listSyncRuns() });
}

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const result = runSyncProbe(session);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.code, messageAr: result.messageAr, messageEn: result.messageEn },
      { status: 403 },
    );
  }
  return NextResponse.json({ run: result.value }, { status: 201 });
}
