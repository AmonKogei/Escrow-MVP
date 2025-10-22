"use client";
// src/app/admin/login/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@escrow.co.ke');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'ADMIN' }),
        // credentials not required for cookie set by same-origin API route, but keeping default
      });
      if (res.ok) {
        router.push('/admin');
      } else {
        const data = await res.json().catch(() => ({ message: 'Login failed' }));
        setError(data.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-6 rounded shadow">
      <h1 className="text-xl font-semibold mb-4">Admin Login</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Email</label>
          <input className="w-full border rounded px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Password</label>
          <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60" type="submit">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-4">
          <div className="flex items-center space-x-4">
            <button
              className="text-sm text-blue-600"
              onClick={async () => {
                try {
                  const r = await fetch('/api/auth/dev-login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email: 'admin@escrow.co.ke', role: 'ADMIN' }) });
                  const j = await r.json().catch(() => ({}));
                  if (r.ok) {
                      toast.success('Dev login successful');
                    router.push('/admin');
                  } else {
                    toast.error(j.message || 'Dev login failed');
                  }
                } catch (e: any) {
                  toast.error(e?.message || 'Dev login error');
                }
              }}
            >Dev login as admin</button>

            <button
              className="text-sm text-green-600"
              onClick={async () => {
                try {
                  const r = await fetch('/api/dev/seed', { method: 'POST' });
                  const j = await r.json().catch(() => ({}));
                  if (r.ok) {
                    toast.success('Seed completed');
                  } else {
                    toast.error(j.message || 'Seed failed');
                  }
                } catch (e: any) {
                  toast.error(e?.message || 'Seed error');
                }
              }}
            >Seed DB</button>
          </div>
        </div>
      )}
      <p className="text-xs text-gray-500 mt-3">Use the seeded admin account. This flow is stubbed for MVP.</p>
    </div>
  );
}


