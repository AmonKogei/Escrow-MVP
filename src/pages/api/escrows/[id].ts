import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query as any;
    if (!id) return res.status(400).json({ message: 'id required' });
    const e = await prisma.escrow.findUnique({ where: { id } });
    if (!e) return res.status(404).json({ message: 'escrow not found' });
    return res.json({ escrow: e });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message || String(err) });
  }
}
