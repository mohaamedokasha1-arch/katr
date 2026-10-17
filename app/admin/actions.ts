'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  authenticate,
  clearSessionCookie,
  createSessionCookie,
  getSession,
} from '@/lib/auth';
import {
  createOverrideDraft,
  moderateReport,
  reviewOverride,
  runSyncProbe,
  setStationOperationalStatus,
} from '@/lib/admin';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth-edge';
import { cookies } from 'next/headers';

export interface ActionResult {
  ok: boolean;
  message?: string;
}

function safeNext(value: FormDataEntryValue | null): string {
  const raw = typeof value === 'string' ? value : '';
  if (!raw.startsWith('/admin') || raw.startsWith('//')) return '/admin';
  return raw;
}

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next'));

  if (!email || !password) {
    return { ok: false, message: 'Enter your email and password.' };
  }

  const session = authenticate(email, password);
  if (!session) {
    return { ok: false, message: 'Wrong email or password.' };
  }

  await createSessionCookie(session);
  redirect(next);
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect('/admin/login');
}

async function requireActor() {
  const session = await getSession();
  if (!session) return null;
  // Defence in depth: middleware already rejects unsigned cookies, but a token
  // could have expired between the edge check and this mutation.
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

function flash(message: string, tone: 'ok' | 'err' = 'ok'): never {
  redirect(`/admin?flash=${encodeURIComponent(message)}&tone=${tone}`);
}

export async function createOverrideAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return { ok: false, message: 'Session expired. Sign in again.' };

  const raw = {
    type: String(formData.get('type') ?? 'delay'),
    serviceNumber: String(formData.get('serviceNumber') ?? '').trim() || undefined,
    lineId: String(formData.get('lineId') ?? '').trim() || undefined,
    fromDate: String(formData.get('fromDate') ?? ''),
    toDate: String(formData.get('toDate') ?? ''),
    delayMinutes: Number(formData.get('delayMinutes') ?? 0) || undefined,
    newDepartureMinutes: String(formData.get('newDeparture') ?? '').trim()
      ? toMinutes(String(formData.get('newDeparture')))
      : undefined,
    reasonAr: String(formData.get('reasonAr') ?? '').trim(),
    reasonEn: String(formData.get('reasonEn') ?? '').trim(),
    source: String(formData.get('source') ?? 'ops'),
  };

  const parsed = z
    .object({
      type: z.enum(['delay', 'cancellation', 'schedule_change', 'extra_run', 'maintenance']),
      serviceNumber: z.string().optional(),
      lineId: z.string().optional(),
      fromDate: z.string(),
      toDate: z.string(),
      delayMinutes: z.number().int().min(0).max(1440).optional(),
      newDepartureMinutes: z.number().int().min(0).max(1439).optional(),
      reasonAr: z.string().min(3).max(240),
      reasonEn: z.string().min(3).max(240),
      source: z.enum(['official', 'ops', 'partner', 'community']),
    })
    .safeParse(raw);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid change request.' };
  }

  const result = createOverrideDraft(actor, parsed.data);
  if (!result.ok) {
    return { ok: false, message: `${result.messageEn} / ${result.messageAr}` };
  }

  revalidatePath('/admin');
  flash(`Created pending change ${result.value.id}.`);
}

function toMinutes(value: string): number | undefined {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return undefined;
  return hours * 60 + minutes;
}

export async function reviewOverrideAction(formData: FormData): Promise<void> {
  const actor = await requireActor();
  if (!actor) redirect('/admin/login');
  const id = String(formData.get('id') ?? '');
  const action = String(formData.get('reviewAction') ?? '') === 'reject' ? 'reject' : 'publish';
  const note = String(formData.get('note') ?? '');

  const result = reviewOverride(actor, id, action, note);
  revalidatePath('/admin');
  revalidatePath('/status');
  if (!result.ok) {
    redirect(`/admin?flash=${encodeURIComponent(result.messageEn)}&tone=err`);
  }
  redirect(`/admin?flash=${encodeURIComponent(`${action === 'publish' ? 'Published' : 'Rejected'} ${id}`)}&tone=ok`);
}

export async function stationStatusAction(formData: FormData): Promise<void> {
  const actor = await requireActor();
  if (!actor) redirect('/admin/login');
  const stationId = String(formData.get('stationId') ?? '');
  const status = String(formData.get('status') ?? 'active') === 'maintenance' ? 'maintenance' : 'active';

  const result = setStationOperationalStatus(actor, stationId, status);
  revalidatePath('/admin');
  if (!result.ok) {
    redirect(`/admin?flash=${encodeURIComponent(result.messageEn)}&tone=err`);
  }
  redirect(`/admin?flash=${encodeURIComponent(`Station ${stationId} → ${status}`)}&tone=ok`);
}

export async function moderateReportAction(formData: FormData): Promise<void> {
  const actor = await requireActor();
  if (!actor) redirect('/admin/login');
  const id = String(formData.get('id') ?? '');
  const action = String(formData.get('moderation') ?? '') === 'reject' ? 'reject' : 'confirm';

  const result = moderateReport(actor, id, action);
  revalidatePath('/admin');
  if (!result.ok) {
    redirect(`/admin?flash=${encodeURIComponent(result.messageEn)}&tone=err`);
  }
  redirect(`/admin?flash=${encodeURIComponent(`Report ${action === 'confirm' ? 'confirmed' : 'rejected'}.`)}&tone=ok`);
}

export async function syncAction(): Promise<void> {
  const actor = await requireActor();
  if (!actor) redirect('/admin/login');
  const result = runSyncProbe(actor);
  revalidatePath('/admin');
  if (!result.ok) {
    redirect(`/admin?flash=${encodeURIComponent(result.messageEn)}&tone=err`);
  }
  redirect(`/admin?flash=${encodeURIComponent(result.value.messageEn)}&tone=ok`);
}
