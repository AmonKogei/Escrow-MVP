import { NextResponse } from 'next/server';
import { verifySession, signSession } from '../../../../lib/session';

// Refresh endpoint: validates existing session cookie and issues a new one with extended TTL
export async function POST(request: Request) {
  try {
    const cookieHeader = (request.headers && (request.headers as any).get && (request.headers as any).get('cookie')) || '';
    const cookies = cookieHeader.split(';').map((s: string) => s.trim()).filter(Boolean);
    const cookieMap: Record<string, string> = {};
    for (const c of cookies) {
      const [k, ...rest] = c.split('=');
      cookieMap[k] = rest.join('=');
    }

    const raw = cookieMap['escrow_user'];
    if (!raw) return NextResponse.json({ message: 'No session' }, { status: 401 });

    const secret = process.env.SESSION_SECRET || '';
    const parsed = await verifySession(raw, secret);
    if (!parsed) return NextResponse.json({ message: 'Invalid session' }, { status: 401 });

    // Re-issue signed cookie with same payload (could add rotation logic here)
    const signed = await signSession(parsed, secret);
    const isProd = process.env.NODE_ENV === 'production';
    const secureFlag = isProd ? 'Secure; ' : '';
    const cookie = `escrow_user=${signed}; Path=/; ${secureFlag}HttpOnly; SameSite=Lax; Max-Age=${60 * 60 /* 1 hour */}`;

    return new Response(JSON.stringify({ message: 'Refreshed' }), { status: 200, headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}
