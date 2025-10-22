import { NextResponse } from 'next/server';
import { authenticateUser } from '../../../../lib/utils';
import prisma from '../../../../lib/prisma';

export async function GET(request: Request) {
  try {
    // ensure caller is admin
    await authenticateUser(request, 'ADMIN');

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(url.searchParams.get('pageSize') || '10', 10)));
    const q = url.searchParams.get('q') || '';
    const sort = url.searchParams.get('sort') || 'createdAt';
    const dir = (url.searchParams.get('dir') || 'desc') as 'asc' | 'desc';

    const where: any = {};
    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { id: { contains: q, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    orderBy[sort] = dir;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: { id: true, email: true, role: true, balance: true, createdAt: true },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      })
    ]);

    const sanitized = users.map(u => ({ id: u.id, email: u.email, role: u.role, balance: u.balance.toString(), createdAt: u.createdAt }));
    return NextResponse.json({ users: sanitized, total });
  } catch (e: any) {
    return NextResponse.json({ users: [], message: e?.message || 'Unauthorized' }, { status: 401 });
  }
}
