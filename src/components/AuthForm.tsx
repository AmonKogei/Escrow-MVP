"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthForm({ role }: { role: 'admin' | 'buyer' | 'seller' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, role }) });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ message: 'Login failed' }));
        setError(j.message || 'Login failed');
        setLoading(false);
        return;
      }
      const j = await res.json();
      // redirect to role dashboard
      router.push(j?.redirect || `/dashboard/${role}`);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h3 className="text-lg font-semibold mb-4">Sign in as {role}</h3>
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <label className="block mb-2">Email
        <input value={email} onChange={e => setEmail(e.target.value)} className="input input-bordered w-full mt-1" /></label>
      <label className="block mb-2">Password
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="input input-bordered w-full mt-1" /></label>
      <div className="mt-4 flex justify-between items-center">
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
      </div>
    </form>
  );
}
