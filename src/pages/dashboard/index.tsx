import Link from 'next/link';
import React from 'react';
import { GetServerSideProps } from 'next';
import { requireSession } from '../../../src/lib/ssr';

export default function DashboardHome() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/admin" className="card card-compact bg-white p-4 hover:shadow-lg hover:bg-blue-50">
          <div className="card-body">
            <div className="text-xl font-semibold">Admin</div>
            <div className="text-sm text-gray-500">Admin dashboard and moderation tools</div>
          </div>
        </Link>
        <Link href="/dashboard/buyer" className="card card-compact bg-white p-4 hover:shadow-lg hover:bg-blue-50">
          <div className="card-body">
            <div className="text-xl font-semibold">Buyer</div>
            <div className="text-sm text-gray-500">Buyer portal — deposits & disputes</div>
          </div>
        </Link>
        <Link href="/dashboard/seller" className="card card-compact bg-white p-4 hover:shadow-lg hover:bg-blue-50">
          <div className="card-body">
            <div className="text-xl font-semibold">Seller</div>
            <div className="text-sm text-gray-500">Seller portal — withdrawals & sales</div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  // allow unauthenticated access to landing; session used client-side if present
  return { props: {} };
};
