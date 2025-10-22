import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      // Return sample numbers when DB not configured (useful for dev without DB)
      return NextResponse.json({ totalAmount: 15000.00, disputeCount: 2 });
    }

    const totalRes = await prisma.transaction.aggregate({
      _sum: { amount: true },
    });
    const disputeCount = await prisma.escrow.count({ where: { status: 'DISPUTED' } });

    return NextResponse.json({ totalAmount: Number(totalRes._sum.amount || 0), disputeCount });
  } catch (e) {
    return NextResponse.json({ totalAmount: 0, disputeCount: 0 });
  }
}
