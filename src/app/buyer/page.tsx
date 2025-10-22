"use client";
import React from 'react';
import Layout from '../../components/Layout';

export default function BuyerDashboard() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto mt-12 bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-semibold mb-4">Buyer Dashboard</h1>
        <p className="text-gray-600">Your active escrows, deposits, and balance.</p>
        <div className="mt-4">
          <div className="p-4 bg-gray-50 rounded">Balance: <strong>Ksh 4,000.00</strong></div>
        </div>
      </div>
    </Layout>
  );
}
