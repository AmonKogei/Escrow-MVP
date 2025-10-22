// src/lib/session.ts
// Small, runtime-compatible helpers to sign and verify a session cookie.
// This module intentionally does not import Prisma or other server-only libs so it
// can be used from middleware (Edge) and server routes.

const toHex = (buf: Uint8Array) => Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');

async function hmacSha256Hex(message: string, secret: string) {
  // Try Node's crypto first
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createHmac } = require('crypto');
    return createHmac('sha256', secret).update(message).digest('hex');
  } catch (e) {
    // Fallback to Web Crypto (Edge runtime)
    const enc = new TextEncoder();
    const key = await (globalThis as any).crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await (globalThis as any).crypto.subtle.sign('HMAC', key, enc.encode(message));
    return toHex(new Uint8Array(sig));
  }
}

export async function signSession(payload: object, secret: string) {
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set in production');
    }
    console.warn('SESSION_SECRET not provided; using insecure fallback. Set SESSION_SECRET in env for production.');
    secret = 'dev-secret';
  }
  const str = JSON.stringify(payload);
  const encoded = encodeURIComponent(str);
  const sig = await hmacSha256Hex(encoded, secret);
  return `${encoded}.${sig}`;
}

export async function verifySession(cookieValue: string, secret: string) {
  if (!cookieValue) return null;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      // Fail to verify in production without a secret
      return null;
    }
    // Insecure fallback for development/tests
    secret = 'dev-secret';
  }
  const parts = cookieValue.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expected = await hmacSha256Hex(encoded, secret);
  // Timing-safe compare
  try {
    // Node crypto timingSafeEqual
    // Convert hex strings to buffers
    const bufExpected = Buffer.from(expected, 'hex');
    const bufSig = Buffer.from(sig, 'hex');
    if (bufExpected.length !== bufSig.length) return null;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { timingSafeEqual } = require('crypto');
    if (!timingSafeEqual(bufExpected, bufSig)) return null;
  } catch (e) {
    // Fallback: constant-time string compare
    let mismatch = 0;
    if (expected.length !== sig.length) return null;
    for (let i = 0; i < expected.length; i++) {
      mismatch |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    }
    if (mismatch !== 0) return null;
  }
  try {
    const parsed = JSON.parse(decodeURIComponent(encoded));
    return parsed;
  } catch (e) {
    return null;
  }
}
