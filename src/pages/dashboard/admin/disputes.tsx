import React from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import SectionList from '../../../components/SectionList';
import { GetServerSideProps } from 'next';
import { requireSession } from '../../../../src/lib/ssr';

export default function AdminDisputes() {
  const user = { email: 'admin@escrow.co.ke', role: 'ADMIN' };
  return (
    <DashboardLayout user={user} active="disputes">
      <h2 className="text-xl font-semibold mb-4">Admin Disputes</h2>
      <div className="card bg-white p-4">
        <SectionList endpoint="/api/disputes" type="Disputes" />
      </div>
    </DashboardLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return requireSession(ctx, 'ADMIN');
};
