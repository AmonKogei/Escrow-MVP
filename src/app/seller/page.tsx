"use client";
import React from 'react';
import Layout from '../../components/Layout';

export default function SellerDashboard() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto mt-12 bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-semibold mb-4">Seller Dashboard</h1>
        <p className="text-gray-600">Your withdrawals, completed escrows, and payouts.</p>
        <div className="mt-4">
          <div className="p-4 bg-gray-50 rounded">Balance: <strong>Ksh 0.00</strong></div>
        </div>
      </div>
    </Layout>
  );
}
