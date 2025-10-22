import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getSessionFromReq } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const withdrawals = await prisma.transaction.findMany({ where: { type: 'WITHDRAWAL' }, orderBy: { createdAt: 'desc' }, take: 50 });
      return res.json({ withdrawals });
    }
    if (req.method === 'POST') {
      const s = await getSessionFromReq(req as any);
      if (!s.user) return res.status(401).json({ message: 'Unauthorized' });
      if (s.user.role.toLowerCase() !== 'seller') return res.status(403).json({ message: 'Only sellers can request withdrawals' });

      const { amount, details } = req.body;
      const userId = s.user.id;
      if (!userId || amount == null) return res.status(400).json({ message: 'userId and amount required' });
      const num = typeof amount === 'string' ? Number(amount) : amount;
      if (isNaN(num) || num <= 0) return res.status(400).json({ message: 'amount must be a positive number' });

      const u = await prisma.user.findUnique({ where: { id: userId } });
      if (!u) return res.status(400).json({ message: 'user not found' });

      const tx = await prisma.transaction.create({ data: {
        userId,
        type: 'WITHDRAWAL',
        status: 'PENDING',
        amount: num,
        details: details || { method: 'MANUAL' },
        externalRef: `WD-${Date.now()}`
      }});
      return res.status(201).json({ withdrawal: tx });
    }
    return res.status(405).end();
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || String(e) });
  }
}
