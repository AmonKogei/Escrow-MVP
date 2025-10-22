import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Set-Cookie', `session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax;`);
  return res.json({ ok: true });
}
