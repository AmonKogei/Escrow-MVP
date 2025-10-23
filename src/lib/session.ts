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
  // tolerate cookie values where the signature may contain additional dots
  const parts = cookieValue.split('.');
  if (parts.length < 2) return null;
  const encoded = parts[0];
  const sig = parts.slice(1).join('.');
  // compute expected signature(s) for a few plausible input variants
  const expected = await hmacSha256Hex(encoded, secret);
  // also try on decoded payload (in case signing used the raw JSON rather than the encoded form)
  let expectedDecoded: string | null = null;
  try {
    const decodedStr = decodeURIComponent(encoded);
    expectedDecoded = await hmacSha256Hex(decodedStr, secret);
  } catch (e) {
    expectedDecoded = null;
  }
  // Timing-safe compare
  try {
    // Node crypto timingSafeEqual
    // Convert hex strings to buffers
    const bufSig = Buffer.from(sig, 'hex');
    const { timingSafeEqual } = require('crypto');
    // helper to compare a candidate expected sig against provided sig safely
    const compare = (candidateHex: string | null) => {
      if (!candidateHex) return false;
      try {
        const bufExpected = Buffer.from(candidateHex, 'hex');
        if (bufExpected.length !== bufSig.length) return false;
        return timingSafeEqual(bufExpected, bufSig);
      } catch (e) {
        return false;
      }
    };

    const match = compare(expected) || compare(expectedDecoded);
    if (!match) {
      console.debug('verifySession: timingSafeEqual failed', {
        encoded: encoded.slice(0, 120),
        providedSig: sig,
        expectedSig: expected,
        expectedDecodedSig: expectedDecoded,
        secretPresent: !!process.env.SESSION_SECRET
      });
      return null;
    }
  } catch (e) {
    // Fallback: constant-time string compare
    let mismatch = 0;
    // fallback constant-time compare for string hexs
    // try to compare against both expected variants
    const tryCompareString = (candidate: string | null) => {
      if (!candidate) return false;
      if (candidate.length !== sig.length) return false;
      let mm = 0;
      for (let i = 0; i < candidate.length; i++) {
        mm |= candidate.charCodeAt(i) ^ sig.charCodeAt(i);
      }
      return mm === 0;
    };
    if (!tryCompareString(expected) && !tryCompareString(expectedDecoded)) {
      console.debug(`verifySession: fallback mismatch expected=${(expected||'').slice(0,8)} got=${sig.slice(0,8)} secretPresent=${!!process.env.SESSION_SECRET}`);
      return null;
    }
  }
  // debug: verification succeeded
  // console.debug(`verifySession: ok expected=${expected.slice(0,8)} got=${sig.slice(0,8)}`);
  try {
    const parsed = JSON.parse(decodeURIComponent(encoded));
    return parsed;
  } catch (e) {
    return null;
  }
}
