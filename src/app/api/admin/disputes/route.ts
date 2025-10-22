import { NextResponse } from 'next/server';
import { authenticateUser } from '../../../../lib/utils';
import prisma from '../../../../lib/prisma';

export async function GET(request: Request) {
  try {
    await authenticateUser(request, 'ADMIN');

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(url.searchParams.get('pageSize') || '10', 10)));
    const q = url.searchParams.get('q') || '';
    const sort = url.searchParams.get('sort') || 'createdAt';
    const dir = (url.searchParams.get('dir') || 'desc') as 'asc' | 'desc';

    const where: any = { status: 'DISPUTED' };
    if (q) {
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { buyerId: { contains: q, mode: 'insensitive' } },
        { sellerId: { contains: q, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    orderBy[sort] = dir;

    const [total, disputes] = await Promise.all([
      prisma.escrow.count({ where }),
      prisma.escrow.findMany({
        where,
        select: { id: true, amount: true, buyerId: true, sellerId: true, disputeReason: true, createdAt: true },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      })
    ]);

    const sanitized = disputes.map(d => ({ id: d.id, amount: d.amount.toString(), buyerId: d.buyerId, sellerId: d.sellerId, disputeReason: d.disputeReason, createdAt: d.createdAt }));
    return NextResponse.json({ disputes: sanitized, total });
  } catch (e: any) {
    return NextResponse.json({ disputes: [], message: e?.message || 'Unauthorized' }, { status: 401 });
  }
}
