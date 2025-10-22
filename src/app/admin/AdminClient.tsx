"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/Confirm';

type Props = {
  initialStats: { totalAmount: number; disputeCount: number } | null;
  initialUsers: any[];
  initialDisputes: any[];
  usersTotal: number;
  disputesTotal: number;
};

export default function AdminClient({ initialStats, initialUsers, initialDisputes, usersTotal, disputesTotal }: Props) {
  const [stats, setStats] = useState(initialStats);
  const [users, setUsers] = useState(initialUsers || []);
  const [disputes, setDisputes] = useState(initialDisputes || []);
  const [userPage, setUserPage] = useState(1);
  const [disputePage, setDisputePage] = useState(1);
  const [pageSize] = useState(10);
  const [userQuery, setUserQuery] = useState('');
  const [disputeQuery, setDisputeQuery] = useState('');
  const [userSort, setUserSort] = useState<{ field: string; dir: 'asc' | 'desc' } | null>(null);
  const [disputeSort, setDisputeSort] = useState<{ field: string; dir: 'asc' | 'desc' } | null>(null);
  // use react-hot-toast's toast directly (imported above)

  useEffect(() => {
    // refresh stats
    fetch('/api/admin/stats').then(r => r.ok ? r.json().then(j => setStats(j)) : null).catch(() => null);
  }, []);

  useEffect(() => {
    // fetch lists for current pages with server-side filtering/sorting
    const load = async () => {
      try {
        const uParams = new URLSearchParams({ page: String(userPage), pageSize: String(pageSize) });
        if (userQuery) uParams.set('q', userQuery);
        if (userSort) { uParams.set('sort', userSort.field); uParams.set('dir', userSort.dir); }
        const u = await fetch(`/api/admin/users?${uParams.toString()}`);
        if (u.ok) setUsers((await u.json()).users || []);

        const dParams = new URLSearchParams({ page: String(disputePage), pageSize: String(pageSize) });
        if (disputeQuery) dParams.set('q', disputeQuery);
        if (disputeSort) { dParams.set('sort', disputeSort.field); dParams.set('dir', disputeSort.dir); }
        const d = await fetch(`/api/admin/disputes?${dParams.toString()}`);
        if (d.ok) setDisputes((await d.json()).disputes || []);
      } catch (e) {
        // ignore
      }
    };
    load();
  }, [userPage, disputePage, userQuery, disputeQuery, userSort, disputeSort]);

  const filteredUsers = useMemo(() => {
    let list = users.slice();
    if (userQuery) { const q = userQuery.toLowerCase(); list = list.filter(u => (u.email||'').toLowerCase().includes(q) || (u.id||'').toLowerCase().includes(q)); }
    if (userSort) { list.sort((a,b)=> userSort.dir === 'asc' ? (''+a[userSort.field]).localeCompare(''+b[userSort.field]) : (''+b[userSort.field]).localeCompare(''+a[userSort.field])); }
    return list;
  }, [users, userQuery, userSort]);

  const filteredDisputes = useMemo(() => {
    let list = disputes.slice();
    if (disputeQuery) { const q = disputeQuery.toLowerCase(); list = list.filter(d => (d.id||'').toLowerCase().includes(q) || (d.buyerId||'').toLowerCase().includes(q)); }
    if (disputeSort) { list.sort((a,b)=> disputeSort.dir === 'asc' ? (''+a[disputeSort.field]).localeCompare(''+b[disputeSort.field]) : (''+b[disputeSort.field]).localeCompare(''+a[disputeSort.field])); }
    return list;
  }, [disputes, disputeQuery, disputeSort]);

  const confirm = useConfirm();
  const handleResolve = async (escrowId: string, resolution: 'APPROVE' | 'REJECT') => {
    const ok = await confirm({ title: `${resolution} escrow`, description: `Confirm ${resolution} for ${escrowId}?`, confirmText: resolution, cancelText: 'Cancel' });
    if (!ok) return;
    // optimistic remove
    setDisputes(prev => prev.filter(d => d.id !== escrowId));
    try {
      const res = await fetch(`/api/escrows/${escrowId}/resolve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resolution }) });
  if (!res.ok) {
  const err = await res.json().catch(()=>({message:'failed'}));
  toast.error(`Failed to ${resolution}: ${err.message || 'error'}`);
        // rollback by refetching current page
        const d = await fetch(`/api/admin/disputes?page=${disputePage}&pageSize=${pageSize}`);
        if (d.ok) setDisputes((await d.json()).disputes || []);
        return;
      }
  toast.success(`Escrow ${escrowId} ${resolution}`);
      // refresh stats
      fetch('/api/admin/stats').then(r => r.ok ? r.json().then(j => setStats(j)) : null).catch(()=>null);
    } catch (e: any) {
  toast.error(`Failed: ${e?.message || e}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-6">
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link href="/admin#users" className="block">
          <div className="p-6 bg-white rounded shadow text-left hover:shadow-lg hover:bg-blue-50 transition cursor-pointer">
            <div className="text-sm text-gray-500">Total amount of transactions</div>
            <div className="text-2xl font-bold mt-2">Ksh {stats ? stats.totalAmount.toFixed(2) : '—'}</div>
          </div>
        </Link>
        <Link href="/admin#disputes" className="block">
          <div className="p-6 bg-white rounded shadow text-left hover:shadow-lg hover:bg-blue-50 transition cursor-pointer">
            <div className="text-sm text-gray-500">Count of disputes</div>
            <div className="text-2xl font-bold mt-2">{stats ? stats.disputeCount : '—'}</div>
          </div>
        </Link>
      </div>

      {/* Users */}
      <section id="users" className="mb-8">
        <h2 className="text-lg font-semibold">Test Users & Balances</h2>
        <div className="mt-4 p-4 bg-white rounded shadow">
          <div className="mb-3 flex items-center space-x-2">
            <input value={userQuery} onChange={e => setUserQuery(e.target.value)} placeholder="Search users" className="input input-sm input-bordered" />
            <div className="ml-auto">Sort:
              <button className="btn btn-xs ml-2" onClick={() => setUserSort({ field: 'email', dir: userSort?.dir === 'asc' ? 'desc' : 'asc' })}>Email</button>
            </div>
          </div>
          {filteredUsers.length === 0 ? (
            <p className="text-sm text-gray-600">No users available.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>
                <th className="px-3 py-2 text-left text-sm text-gray-600">Email</th>
                <th className="px-3 py-2 text-left text-sm text-gray-600">Role</th>
                <th className="px-3 py-2 text-left text-sm text-gray-600">Balance</th>
              </tr></thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className="border-t"><td className="px-3 py-2">{u.email}</td><td className="px-3 py-2">{u.role}</td><td className="px-3 py-2">Ksh {u.balance}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm text-gray-500">Showing {filteredUsers.length} of {usersTotal} users</div>
            <div className="space-x-2">
              <button className="btn btn-xs" onClick={() => setUserPage(p => Math.max(1, p - 1))}>Prev</button>
              <button className="btn btn-xs" onClick={() => setUserPage(p => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      </section>

      {/* Disputes */}
      <section id="disputes" className="mb-8">
        <h2 className="text-lg font-semibold">Admin Dispute Queue (Locked Funds)</h2>
        <div className="mt-4 p-4 bg-white rounded shadow">
          <div className="mb-3 flex items-center space-x-2">
            <input value={disputeQuery} onChange={e => setDisputeQuery(e.target.value)} placeholder="Search disputes" className="input input-sm input-bordered" />
            <div className="ml-auto">Sort:
              <button className="btn btn-xs ml-2" onClick={() => setDisputeSort({ field: 'amount', dir: disputeSort?.dir === 'asc' ? 'desc' : 'asc' })}>Amount</button>
            </div>
          </div>
          {filteredDisputes.length === 0 ? (
            <p className="text-sm text-gray-600">No active disputes.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>
                <th className="px-3 py-2 text-left text-sm text-gray-600">Escrow ID</th>
                <th className="px-3 py-2 text-left text-sm text-gray-600">Amount</th>
                <th className="px-3 py-2 text-left text-sm text-gray-600">Buyer</th>
                <th className="px-3 py-2 text-left text-sm text-gray-600">Seller</th>
                <th className="px-3 py-2 text-left text-sm text-gray-600">Reason</th>
                <th className="px-3 py-2 text-left text-sm text-gray-600">Actions</th>
              </tr></thead>
              <tbody>
                {filteredDisputes.map(d => (
                  <tr key={d.id} className="border-t">
                    <td className="px-3 py-2">{d.id}</td>
                    <td className="px-3 py-2">Ksh {d.amount}</td>
                    <td className="px-3 py-2">{d.buyerId}</td>
                    <td className="px-3 py-2">{d.sellerId}</td>
                    <td className="px-3 py-2">{d.disputeReason || 'N/A'}</td>
                    <td className="px-3 py-2">
                      <div className="space-x-2">
                        <button className="btn btn-xs btn-success flex items-center" onClick={() => handleResolve(d.id, 'APPROVE')}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Approve
                        </button>
                        <button className="btn btn-xs btn-error flex items-center" onClick={() => handleResolve(d.id, 'REJECT')}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm text-gray-500">Showing {filteredDisputes.length} of {disputesTotal} disputes</div>
            <div className="space-x-2">
              <button className="btn btn-xs" onClick={() => setDisputePage(p => Math.max(1, p - 1))}>Prev</button>
              <button className="btn btn-xs" onClick={() => setDisputePage(p => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
