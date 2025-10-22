import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getSessionFromReq } from '../../../../src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const disputes = await prisma.escrow.findMany({ where: { status: 'DISPUTED' }, orderBy: { createdAt: 'desc' }, take: 50 });
      return res.json({ disputes });
    }
    if (req.method === 'POST') {
      const s = await getSessionFromReq(req as any);
      if (!s.user) return res.status(401).json({ message: 'Unauthorized' });

      // Support creating a dispute by referencing an existing escrowId
      const { escrowId, buyerId: bodyBuyerId, sellerId: bodySellerId, amount, description } = req.body;
      const isBuyer = s.user.role.toLowerCase() === 'buyer';
      const isSeller = s.user.role.toLowerCase() === 'seller';
      if (!isBuyer && !isSeller) return res.status(403).json({ message: 'Only buyers or sellers can create disputes' });

      if (escrowId) {
        const escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });
        if (!escrow) return res.status(404).json({ message: 'escrow not found' });
        // Only buyer or seller on the escrow can raise dispute
        if (s.user.id !== escrow.buyerId && s.user.id !== escrow.sellerId) return res.status(403).json({ message: 'Not a party on this escrow' });
        // mark existing escrow as disputed
        const updated = await prisma.escrow.update({ where: { id: escrowId }, data: { status: 'DISPUTED', disputeRaised: true, disputeReason: description || 'User raised dispute' } });
        return res.status(200).json({ dispute: updated });
      }

      // Fallback: manual buyer/seller IDs
      const buyerId = isBuyer ? s.user.id : bodyBuyerId;
      const sellerId = isSeller ? s.user.id : bodySellerId;
      if (!buyerId || !sellerId) return res.status(400).json({ message: 'buyerId and sellerId required' });
      if (amount == null) return res.status(400).json({ message: 'amount required' });
      const num = typeof amount === 'string' ? Number(amount) : amount;
      if (isNaN(num) || num <= 0) return res.status(400).json({ message: 'amount must be a positive number' });

      const b = await prisma.user.findUnique({ where: { id: buyerId } });
      const suser = await prisma.user.findUnique({ where: { id: sellerId } });
      if (!b || !suser) return res.status(400).json({ message: 'buyer or seller not found' });

      const e = await prisma.escrow.create({ data: {
        buyerId,
        sellerId,
        amount: num,
        description: description || 'User raised dispute',
        status: 'DISPUTED',
        disputeRaised: true
      }});
      return res.status(201).json({ dispute: e });
    }
    return res.status(405).end();
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || String(e) });
  }
}
