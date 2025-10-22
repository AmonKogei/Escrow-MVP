"use client";
import React, { useEffect, useState } from 'react';

export default function SectionList({ endpoint, type }: { endpoint: string; type?: string }) {
  const [items, setItems] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(endpoint).then(r => r.ok ? r.json() : Promise.reject(new Error('Fetch error')))
      .then(j => { if (mounted) setItems(j.transactions || j.deposits || j.withdrawals || j.disputes || []); })
      .catch(e => { if (mounted) setError(e?.message || String(e)); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [endpoint]);

  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!items || items.length === 0) return <div className="text-sm text-gray-600">No items</div>;

  return (
    <div className="space-y-2">
      {items.map((it:any) => (
        <div key={it.id} className="p-3 bg-white rounded shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{it.id}</div>
              <div className="text-sm text-gray-500">{type ? type : (it.type || it.status || '')}</div>
            </div>
            <div className="text-sm text-gray-600">Ksh {it.amount || it.amount?.toString?.() || '—'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
