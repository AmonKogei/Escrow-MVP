import React from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import SectionList from '../../../components/SectionList';
import { GetServerSideProps } from 'next';
import { requireSession } from '../../../../src/lib/ssr';

export default function SellerTransaction() {
  const user = { email: 'seller@trade.co.ke', role: 'SELLER' };
  return (
    <DashboardLayout user={user} active="transaction">
      <h2 className="text-xl font-semibold mb-4">Seller Transactions</h2>
      <div className="card bg-white p-4">
        <SectionList endpoint="/api/transactions" type="Transactions" />
      </div>
    </DashboardLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return requireSession(ctx, 'SELLER');
};
