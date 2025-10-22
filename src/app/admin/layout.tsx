// src/app/admin/layout.tsx
import React from 'react';
import Layout from '../../components/Layout';

export const metadata = {
  title: 'Admin | Escrow MVP',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Use the shared client-side Layout so the updated Sidebar and Topbar are applied
  return (
    <Layout>
      {children}
    </Layout>
  );
}


