import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import useSession from '../../../lib/useSession';
import toast from 'react-hot-toast';
import { GetServerSideProps } from 'next';
import { requireSession } from '../../../lib/ssr';

export default function BuyerDepositPage() {
  const session = useSession();
  const [amount, setAmount] = useState('');
  const [externalRef, setExternalRef] = useState('');
  const draftKey = 'deposit:draft';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setAmount(parsed.amount || '');
        setExternalRef(parsed.externalRef || '');
      }
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    const toSave = { amount, externalRef };
    localStorage.setItem(draftKey, JSON.stringify(toSave));
  }, [amount, externalRef]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) return toast.error('Not authenticated');
    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, externalRef })
      });
      if (!res.ok) throw new Error(await res.text());
      await res.json();
      toast.success('Deposit created');
      localStorage.removeItem(draftKey);
      setAmount(''); setExternalRef('');
    } catch (err:any) {
      toast.error(err?.message || 'Failed');
    }
  }

  return (
    <DashboardLayout user={session?.user ?? null} active="deposit">
      <h2 className="text-xl font-semibold mb-4">Create Deposit</h2>
      <form onSubmit={submit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium">Amount</label>
          <input value={amount} onChange={e => setAmount(e.target.value)} className="input input-bordered w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">External Reference (optional)</label>
          <input value={externalRef} onChange={e => setExternalRef(e.target.value)} className="input input-bordered w-full" />
        </div>
        <div>
          <button className="btn btn-primary">Submit Deposit</button>
        </div>
      </form>
    </DashboardLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return requireSession(ctx, 'BUYER');
};

