"use client";
// src/app/admin/page.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const hasSession = typeof window !== 'undefined' && localStorage.getItem('admin_session') === 'true';
    if (!hasSession) {
      router.replace('/admin/login');
    }
  }, [router]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
      <p className="text-gray-600">Welcome back. This is a placeholder dashboard. Next steps: live disputes list and actions.</p>
    </div>
  );
}


