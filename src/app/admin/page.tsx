import React from 'react';
import Layout from '../../components/Layout';
import prisma from '../../lib/prisma';
import { authenticateUser } from '../../lib/utils';
import { cookies } from 'next/headers';
import AdminClient from './AdminClient';
import { redirect } from 'next/navigation';

const PAGE_SIZE = 10;

export default async function AdminDashboardPage() {
  // server-side auth: ensure this request is from an ADMIN
  try {
    const cookieHeader = cookies().toString();
    const req = new Request('http://localhost/', { headers: { cookie: cookieHeader } } as any);
    await authenticateUser(req, 'ADMIN');
  } catch (e) {
    // If not authenticated, redirect to the admin login page
    redirect('/admin/login');
  }
  // server-side fetch initial page + stats
  const totalAmountAgg = await prisma.transaction.aggregate({ _sum: { amount: true } }).catch(() => null);
  const totalAmount = totalAmountAgg?._sum?.amount || 0;
  const disputeCount = await prisma.escrow.count({ where: { status: 'DISPUTED' } }).catch(() => 0);

  const usersPage = await prisma.user.findMany({ select: { id: true, email: true, role: true, balance: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: PAGE_SIZE }).catch(() => []);
  const disputesPage = await prisma.escrow.findMany({ where: { status: 'DISPUTED' }, select: { id: true, amount: true, buyerId: true, sellerId: true, disputeReason: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: PAGE_SIZE }).catch(() => []);

  const usersSanitized = usersPage.map(u => ({ id: u.id, email: u.email, role: u.role, balance: u.balance.toString(), createdAt: u.createdAt }));
  const disputesSanitized = disputesPage.map(d => ({ id: d.id, amount: d.amount.toString(), buyerId: d.buyerId, sellerId: d.sellerId, disputeReason: d.disputeReason, createdAt: d.createdAt }));

  const usersTotal = await prisma.user.count().catch(() => 0);
  const disputesTotal = await prisma.escrow.count({ where: { status: 'DISPUTED' } }).catch(() => 0);

  return (
    <Layout>
      {/* client component handles interactivity, pagination, toasts */}
      <AdminClient initialStats={{ totalAmount, disputeCount }} initialUsers={usersSanitized} initialDisputes={disputesSanitized} usersTotal={usersTotal} disputesTotal={disputesTotal} />
    </Layout>
  );
}


