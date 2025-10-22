import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getSessionFromReq } from '../../../../src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const transactions = await prisma.transaction.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
      return res.json({ transactions });
    }
    if (req.method === 'POST') {
      const s = await getSessionFromReq(req as any);
      if (!s.user) return res.status(401).json({ message: 'Unauthorized' });

      const { amount, type } = req.body;
      const userId = s.user.id;
      if (!userId || amount == null || !type) return res.status(400).json({ message: 'userId, amount and type required' });
      const num = typeof amount === 'string' ? Number(amount) : amount;
      if (isNaN(num) || num <= 0) return res.status(400).json({ message: 'amount must be a positive number' });

      const u = await prisma.user.findUnique({ where: { id: userId } });
      if (!u) return res.status(400).json({ message: 'user not found' });

      const tx = await prisma.transaction.create({ data: {
        userId,
        amount: num,
        type,
        status: 'PENDING',
        details: { note: 'Created via API' },
        externalRef: `TX-${Date.now()}`
      }});
      return res.status(201).json({ transaction: tx });
    }
    return res.status(405).end();
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || String(e) });
  }
}
