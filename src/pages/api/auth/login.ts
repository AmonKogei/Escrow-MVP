import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { signSession } from '../../../lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password, role } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    // naive password check (bcrypt hash stored in passwordHash)
    const bcrypt = require('bcryptjs');
    const ok = bcrypt.compareSync(password || '', user.passwordHash || '');
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    if (role && role.toUpperCase && user.role !== role.toUpperCase()) {
      // allow login but tell client their role
      // respond with session but include notice
    }
    const payload = { id: user.id, email: user.email, role: user.role };
    const cookie = await signSession(payload, process.env.SESSION_SECRET || '');
    res.setHeader('Set-Cookie', `session=${cookie}; HttpOnly; Path=/; SameSite=Lax;`);
    return res.json({ ok: true, user: { id: user.id, email: user.email, role: user.role }, redirect: `/dashboard/${(user.role || 'buyer').toLowerCase()}` });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || String(e) });
  }
}
