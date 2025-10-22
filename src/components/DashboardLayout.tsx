"use client";
import React from 'react';
import Sidebar from './Sidebar';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children, user, active }: { children: React.ReactNode; user?: any; active?: string }) {
  const router = useRouter();
  const logout = async () => {
    await fetch('/api/auth/logout');
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar role={(user?.role || 'buyer').toUpperCase()} active={active || ''} />
      <div className="flex-1">
        <div className="w-full bg-white shadow p-3 flex justify-between items-center">
          <div className="text-lg font-semibold">Dashboard</div>
          <div className="flex items-center space-x-3">
            <div className="text-sm">{user?.email || 'Not signed in'}</div>
            <button onClick={logout} className="btn btn-outline btn-sm">Logout</button>
          </div>
        </div>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
