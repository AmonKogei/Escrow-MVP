import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import useSession from '../../../lib/useSession';
import toast from 'react-hot-toast';
import { GetServerSideProps } from 'next';
import { requireSession } from '../../../lib/ssr';

export default function SellerWithdrawalPage() {
  const session = useSession();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('MPESA');
  const draftKey = 'withdrawal:draft';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setAmount(parsed.amount || '');
        setMethod(parsed.method || 'MPESA');
      }
    } catch (e) { }
  }, []);

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify({ amount, method }));
  }, [amount, method]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) return toast.error('Not authenticated');
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, details: { method } })
      });
      if (!res.ok) throw new Error(await res.text());
      await res.json();
      toast.success('Withdrawal requested');
      localStorage.removeItem(draftKey);
      setAmount(''); setMethod('MPESA');
    } catch (err:any) {
      toast.error(err?.message || 'Failed');
    }
  }

  return (
    <DashboardLayout user={session?.user ?? null} active="withdrawal">
      <h2 className="text-xl font-semibold mb-4">Request Withdrawal</h2>
      <form onSubmit={submit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium">Amount</label>
          <input value={amount} onChange={e => setAmount(e.target.value)} className="input input-bordered w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Method</label>
          <select value={method} onChange={e => setMethod(e.target.value)} className="select select-bordered w-full">
            <option>MPESA</option>
            <option>BANK</option>
          </select>
        </div>
        <div>
          <button className="btn btn-primary">Request Withdrawal</button>
        </div>
      </form>
    </DashboardLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return requireSession(ctx, 'SELLER');
};
