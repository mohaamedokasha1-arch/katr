import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { AdminSession, UserRole } from '@/types/rail';
import {
  SESSION_COOKIE,
  sessionTtlSeconds,
  signSessionToken,
  verifySessionToken,
} from '@/lib/auth-edge';

interface DemoUser {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

function demoUsers(): DemoUser[] {
  return [
    {
      email: process.env.RAKEB_ADMIN_EMAIL ?? 'admin@rakeb.app',
      password: process.env.RAKEB_ADMIN_PASSWORD ?? 'Rakeb#2026',
      name: 'مدير البيانات',
      role: 'admin',
    },
    {
      email: process.env.RAKEB_EDITOR_EMAIL ?? 'editor@rakeb.app',
      password: process.env.RAKEB_EDITOR_PASSWORD ?? 'Rakeb#2026',
      name: 'محرر البيانات',
      role: 'editor',
    },
  ];
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function safeEqual(a: string, b: string): boolean {
  const left = digest(a);
  const right = digest(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function demoCredentials() {
  return [
    {
      role: 'admin' as const,
      email: process.env.RAKEB_ADMIN_EMAIL ?? 'admin@rakeb.app',
      password: process.env.RAKEB_ADMIN_PASSWORD ?? 'Rakeb#2026',
      labelAr: 'مدير البيانات — يعتمد وينشر',
      labelEn: 'Data manager — can approve and publish',
    },
    {
      role: 'editor' as const,
      email: process.env.RAKEB_EDITOR_EMAIL ?? 'editor@rakeb.app',
      password: process.env.RAKEB_EDITOR_PASSWORD ?? 'Rakeb#2026',
      labelAr: 'محرر البيانات — ينشئ طلبات التعديل',
      labelEn: 'Data editor — creates change requests',
    },
  ];
}

export function authenticate(email: string, password: string): AdminSession | null {
  const user = demoUsers().find((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || !safeEqual(user.password, password)) return null;
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + sessionTtlSeconds(),
  };
}

export async function createSessionCookie(session: AdminSession): Promise<void> {
  const token = await signSessionToken({
    name: session.name,
    email: session.email,
    role: session.role,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: (process.env.NEXT_PUBLIC_SITE_URL ?? '').startsWith('https://'),
    path: '/',
    maxAge: sessionTtlSeconds(),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export const getSession = cache(async (): Promise<AdminSession | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
});

export function canApprove(role: UserRole): boolean {
  return role === 'admin';
}

export function roleLabel(locale: 'ar' | 'en', role: UserRole | 'system'): string {
  if (role === 'system') return locale === 'ar' ? 'النظام' : 'System';
  if (role === 'admin') return locale === 'ar' ? 'مدير البيانات' : 'Data manager';
  return locale === 'ar' ? 'محرر البيانات' : 'Data editor';
}
