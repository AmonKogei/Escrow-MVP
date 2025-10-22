import { signSession } from '../../../../lib/session';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new Response(JSON.stringify({ message: 'Not allowed in production' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { email, role } = await request.json();
    if (!email || !role) {
      return new Response(JSON.stringify({ message: 'Missing email or role' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const secret = process.env.SESSION_SECRET || '';
    const signed = await signSession({ id: `${role.toLowerCase()}-dev`, email, role }, secret);
    const cookie = `escrow_user=${signed}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60}`;
    return new Response(JSON.stringify({ message: 'Dev login set' }), { status: 200, headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ message: e?.message || 'Failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
