"use client";
import React from 'react';
import Link from 'next/link';

export default function Sidebar({ role }: { role: string }) {
  return (
    <aside className="w-64 bg-gradient-to-b from-blue-50 to-blue-100 border-r p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-blue-800">Admin Panel</h2>
      </div>
      <nav className="flex flex-col space-y-2">
        {role === 'ADMIN' ? (
          <>
            <Link href="/admin#users" className="flex items-center px-3 py-2 rounded hover:bg-blue-200 text-blue-800">
              <span className="mr-2">👥</span>
              <span>Test Users &amp; Balances</span>
            </Link>
            <Link href="/admin#disputes" className="flex items-center px-3 py-2 rounded hover:bg-blue-200 text-blue-800">
              <span className="mr-2">⚖️</span>
              <span>Admin Dispute Queue (Locked Funds)</span>
            </Link>
          </>
        ) : (
          <>
            <Link href="/buyer" className="px-3 py-2 rounded hover:bg-blue-200">Buyer Dashboard</Link>
            <Link href="/seller" className="px-3 py-2 rounded hover:bg-blue-200">Seller Dashboard</Link>
          </>
        )}
      </nav>
    </aside>
  );
}
