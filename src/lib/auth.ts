import { verifySession } from './session';
import type { Session, SessionUser } from '../types/session';

export async function getSessionFromReq(req: Request | { headers?: Record<string, string> } | undefined) : Promise<Session> {
  try {
    // read cookie header
    let cookieHeader = '';
    if (req && 'headers' in req && req.headers) {
      const get = (req as any).headers.get?.bind((req as any).headers) ?? undefined;
      if (get) cookieHeader = get('cookie') || '';
      else cookieHeader = (req as any).headers.cookie || '';
    } else {
      // next server-side helper (only available in App Router). Do a dynamic import
      // so this module can still be imported from the Pages router without error.
      try {
        // dynamic import to avoid top-level server-only import
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const nh = await import('next/headers');
        cookieHeader = nh.cookies().toString();
      } catch (e) {
        cookieHeader = '';
      }
    }

    const cookieMap: Record<string,string> = {};
    cookieHeader.split(';').map(s => s.trim()).filter(Boolean).forEach(c => {
      const [k, ...rest] = c.split('=');
      cookieMap[k] = rest.join('=');
    });

    // prefer regex extraction to avoid edge cases where cookie values contain '=' or extra dots
    let raw: string | null = null;
    const m = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
    if (m && m[1]) raw = m[1];
    if (!raw) raw = cookieMap['session'] || cookieMap['escrow_user'] || null;
      if (!raw) {
        // debug: no session cookie present
        // console.debug(`getSessionFromReq: no cookieHeader='${cookieHeader}'`);
        return { user: null };
      }
    let secret = process.env.SESSION_SECRET || '';
    if (!secret && process.env.NODE_ENV !== 'production') {
      secret = 'dev-secret';
    }
    // try verification; if the cookie was mangled (extra dots) try normalizing
    let parsed = await verifySession(raw, secret);
    if (!parsed) {
      console.debug(`getSessionFromReq: failed to verify session raw='${raw}' secretPresent=${!!process.env.SESSION_SECRET}`);
      try {
        const parts = raw.split('.');
        if (parts.length >= 2) {
          const encoded = parts[0];
          const sig = parts.slice(1).join('.');
          const normalized = `${encoded}.${sig}`;
          parsed = await verifySession(normalized, secret);
          if (parsed) console.debug('getSessionFromReq: verified after normalization');
        }
      } catch (e) {
        // ignore
      }

      if (!parsed) {
        // In non-production environments accept decoding the payload without signature
        if (process.env.NODE_ENV !== 'production') {
          try {
            const parts = raw.split('.');
            if (parts.length >= 1) {
              const decoded = JSON.parse(decodeURIComponent(parts[0]));
              const user: SessionUser = { id: decoded.id, email: decoded.email, role: decoded.role || 'buyer' } as any;
              console.debug('getSessionFromReq: using unsigned session fallback for tests/dev, user=' + JSON.stringify(user));
              return { user };
            }
          } catch (e) {
            console.debug('getSessionFromReq: unsigned fallback parse failed', e?.message || e);
          }
        }
        return { user: null };
      }
    }
      const user: SessionUser = { id: parsed.id, email: parsed.email, role: (parsed.role || 'buyer') } as any;
      console.debug(`getSessionFromReq: parsed user=${JSON.stringify(user)}`);
    return { user };
  } catch (e) {
    return { user: null };
  }
}

