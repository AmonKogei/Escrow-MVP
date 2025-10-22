"use client";
import React from 'react';
import Link from 'next/link';

export default function Sidebar({ role, active }: { role: string; active?: string }) {
  return (
    <aside className="w-64 bg-gradient-to-b from-blue-50 to-blue-100 border-r p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-blue-800">Admin Panel</h2>
      </div>
      <nav className="flex flex-col space-y-2">
        {role === 'ADMIN' ? (
          <>
            <Link href="/dashboard/admin/transactions" className={`flex items-center px-3 py-2 rounded hover:bg-blue-200 text-blue-800 ${active === 'transactions' ? 'bg-blue-100' : ''}`}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 7h18M3 12h18M3 17h18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>Transactions</span>
            </Link>
            <Link href="/dashboard/admin/deposits" className={`flex items-center px-3 py-2 rounded hover:bg-blue-200 text-blue-800 ${active === 'deposits' ? 'bg-blue-100' : ''}`}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="5" width="20" height="14" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>Deposits</span>
            </Link>
            <Link href="/dashboard/admin/withdrawals" className={`flex items-center px-3 py-2 rounded hover:bg-blue-200 text-blue-800 ${active === 'withdrawals' ? 'bg-blue-100' : ''}`}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>Withdrawals</span>
            </Link>
            <Link href="/dashboard/admin/disputes" className={`flex items-center px-3 py-2 rounded hover:bg-blue-200 text-blue-800 ${active === 'disputes' ? 'bg-blue-100' : ''}`}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>Disputes</span>
            </Link>
          </>
        ) : role === 'BUYER' ? (
          <>
            <Link href="/dashboard/buyer/deposit" className={`flex items-center px-3 py-2 rounded hover:bg-blue-200 text-blue-800 ${active === 'deposit' ? 'bg-blue-100' : ''}`}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="5" width="20" height="14" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>Deposit</span>
            </Link>
            <Link href="/dashboard/buyer/dispute" className={`flex items-center px-3 py-2 rounded hover:bg-blue-200 text-blue-800 ${active === 'dispute' ? 'bg-blue-100' : ''}`}>
              <svg className="mr-2 h-4 w-4 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10.29 3.86l-6.24 10.8A2 2 0 0 0 6 18h12a2 2 0 0 0 1.95-2.34l-6.24-10.8a2 2 0 0 0-3.42 0z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>Dispute</span>
            </Link>
            <Link href="/dashboard/buyer/transaction" className={`flex items-center px-3 py-2 rounded hover:bg-blue-200 text-blue-800 ${active === 'transaction' ? 'bg-blue-100' : ''}`}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 7h18M3 12h18M3 17h18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>Transactions</span>
            </Link>
          </>
        ) : (
          <>
            <Link href="/dashboard/seller/withdrawal" className={`flex items-center px-3 py-2 rounded hover:bg-blue-200 text-blue-800 ${active === 'withdrawal' ? 'bg-blue-100' : ''}`}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>Withdrawal</span>
            </Link>
            <Link href="/dashboard/seller/dispute" className={`flex items-center px-3 py-2 rounded hover:bg-blue-200 text-blue-800 ${active === 'dispute' ? 'bg-blue-100' : ''}`}>
              <svg className="mr-2 h-4 w-4 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10.29 3.86l-6.24 10.8A2 2 0 0 0 6 18h12a2 2 0 0 0 1.95-2.34l-6.24-10.8a2 2 0 0 0 3.42 0z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>Dispute</span>
            </Link>
            <Link href="/dashboard/seller/transaction" className={`flex items-center px-3 py-2 rounded hover:bg-blue-200 text-blue-800 ${active === 'transaction' ? 'bg-blue-100' : ''}`}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 7h18M3 12h18M3 17h18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>Transactions</span>
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
