import { NextApiRequest, NextApiResponse } from 'next';
import { verifySession } from '../../../lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const cookie = req.cookies['session'] || req.cookies['escrow_user'];
    if (!cookie) return res.json({ user: null });
    const secret = process.env.SESSION_SECRET || '';
    const parsed = await verifySession(cookie, secret);
    if (!parsed) return res.json({ user: null });
    return res.json({ user: { id: parsed.id, email: parsed.email, role: (parsed.role || 'buyer').toLowerCase() } });
  } catch (e:any) {
    return res.status(500).json({ user: null });
  }
}
