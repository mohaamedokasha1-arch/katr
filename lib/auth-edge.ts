import type { AdminSession } from '@/types/rail';

/**
 * Edge-safe session signing (Web Crypto only).
 * The same module is used by middleware and Node route handlers.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();
export const SESSION_COOKIE = 'rakeb_admin';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function secret(): string {
  const value = process.env.RAKEB_AUTH_SECRET;
  if (value && value.length >= 32) return value;
  // Never fall back to a known secret in production: signing/verifying
  // must fail closed so forged sessions are impossible.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('RAKEB_AUTH_SECRET (32+ chars) is required in production.');
  }
  return 'rakeb-dev-only-secret-not-for-production-32ch';
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signSessionToken(
  session: Omit<AdminSession, 'exp'>,
  ttlSeconds = SESSION_TTL_SECONDS,
): Promise<string> {
  const payload: AdminSession = {
    ...session,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(), encoder.encode(encoded));
  return `${encoded}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(),
      fromBase64Url(signature) as unknown as BufferSource,
      encoder.encode(encoded),
    );
    if (!valid) return null;
    const payload = JSON.parse(decoder.decode(fromBase64Url(encoded))) as AdminSession;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.email || (payload.role !== 'admin' && payload.role !== 'editor')) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionTtlSeconds(): number {
  return SESSION_TTL_SECONDS;
}
