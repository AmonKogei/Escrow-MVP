"use client";
// src/app/page.tsx
import React from 'react';

// STUB data for minimal UI
const sampleUsers = [
  { id: 'buyer-uuid', role: 'Buyer', email: 'buyer@trade.co.ke', balance: 'Ksh 4,000.00' },
  { id: 'seller-uuid', role: 'Seller', email: 'seller@trade.co.ke', balance: 'Ksh 0.00' },
  { id: 'admin-uuid', role: 'Admin', email: 'admin@escrow.co.ke', balance: 'Ksh 10,000.00' },
];

const sampleDisputes = [
    { id: 'ESC-UUID-1', status: 'DISPUTED', amount: 'Ksh 1,000.00', buyer: 'Buyer A', seller: 'Seller B', reason: 'Goods damaged upon receipt.' },
    { id: 'ESC-UUID-2', status: 'HOLD', amount: 'Ksh 500.00', buyer: 'Buyer A', seller: 'Seller C', reason: 'N/A' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-green-700">🇰🇪 Kenya Escrow MVP Dashboard</h1>
        <p className="text-gray-600">Secure P2P Trading Platform (TypeScript + Next.js)</p>
        <p className="mt-4 p-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
            **NOTE:** This is a minimal UI. All financial flows are tested via the provided API routes and services.
        </p>
      </header>
      
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User Balances Section */}
        <section className="bg-white p-6 rounded-lg shadow-xl lg:col-span-1">
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4 text-gray-700">Test Users & Balances</h2>
          <ul className="space-y-3">
            {sampleUsers.map(user => (
              <li key={user.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                <div>
                  <p className="font-medium">{user.role}: {user.email}</p>
                  <p className="text-sm text-gray-500">ID: {user.id}</p>
                </div>
                <span className={`font-bold ${user.role === 'Admin' ? 'text-blue-600' : 'text-green-600'}`}>{user.balance}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Admin Dispute Resolution Section */}
        <section className="bg-white p-6 rounded-lg shadow-xl lg:col-span-2">
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4 text-gray-700">Admin Dispute Queue (Locked Funds)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Escrow ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sampleDisputes.map(escrow => (
                  <tr key={escrow.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{escrow.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${escrow.status === 'DISPUTED' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {escrow.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{escrow.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{escrow.reason || 'No Dispute'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {escrow.status === 'DISPUTED' && (
                        <div className='space-x-2'>
                          <button 
                            className="text-indigo-600 hover:text-indigo-900 text-xs font-bold"
                            onClick={async () => {
                              await fetch(`/api/escrows/${escrow.id}/resolve`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ resolution: 'APPROVE' }) });
                              alert('Resolve request sent (APPROVE)');
                            }}
                          >
                            APPROVE (Seller)
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900 text-xs font-bold"
                            onClick={async () => {
                              await fetch(`/api/escrows/${escrow.id}/resolve`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ resolution: 'REJECT' }) });
                              alert('Resolve request sent (REJECT)');
                            }}
                          >
                            REJECT (Buyer)
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}