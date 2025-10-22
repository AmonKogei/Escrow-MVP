import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import SectionList from '../../../components/SectionList';
import useSession from '../../../lib/useSession';
import toast from 'react-hot-toast';
import { GetServerSideProps } from 'next';
import { requireSession } from '../../../../src/lib/ssr';

export default function SellerDispute() {
  const session = useSession();
  const [buyerId, setBuyerId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const draftKey = 'dispute:seller:draft';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setBuyerId(parsed.buyerId || '');
        setAmount(parsed.amount || '');
        setDescription(parsed.description || '');
      }
    } catch (e) { }
  }, []);

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify({ buyerId, amount, description }));
  }, [buyerId, amount, description]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) return toast.error('Not authenticated');
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId, sellerId: session.user.id, amount, description })
      });
      if (!res.ok) throw new Error(await res.text());
      await res.json();
      toast.success('Dispute created');
      localStorage.removeItem(draftKey);
      setBuyerId(''); setAmount(''); setDescription('');
    } catch (err:any) {
      toast.error(err?.message || 'Failed');
    }
  }

  return (
    <DashboardLayout user={session?.user ?? null} active="dispute">
      <h2 className="text-xl font-semibold mb-4">Seller Disputes</h2>

      <div className="card bg-white p-4 mb-6">
        <h3 className="font-medium mb-3">Create Dispute</h3>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Buyer ID</label>
            <input value={buyerId} onChange={e => setBuyerId(e.target.value)} className="input input-bordered w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">Amount</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} className="input input-bordered w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="textarea textarea-bordered w-full" />
          </div>
          <div>
            <button className="btn btn-primary">Create Dispute</button>
          </div>
        </form>
      </div>

      <div className="card bg-white p-4">
        <SectionList endpoint="/api/disputes" type="Disputes" />
      </div>
    </DashboardLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return requireSession(ctx, 'SELLER');
};
