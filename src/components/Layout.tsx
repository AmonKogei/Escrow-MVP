"use client";
import React, { useEffect, useState } from 'react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';
import ConfirmProvider from './Confirm';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{email?:string,role?:string}|null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      }
    };
    getUser();
  }, []);

  return (
    <ConfirmProvider>
      <div className="min-h-screen bg-gray-100">
        <Topbar email={user?.email} />
        <div className="flex">
          <Sidebar role={user?.role || 'GUEST'} />
          <main className="flex-1 p-6">{children}</main>
        </div>
        <Toaster position="bottom-right" />
      </div>
    </ConfirmProvider>
  );
}
