// src/app/admin/layout.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Admin | Escrow MVP',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-white border-r shadow-sm">
        <div className="p-4 border-b">
          <h1 className="text-lg font-semibold text-green-700">Admin Panel</h1>
          <p className="text-xs text-gray-500">Kenya Escrow MVP</p>
        </div>
        <nav className="p-3 space-y-2">
          <Link className="block px-3 py-2 rounded hover:bg-gray-50" href="/admin">Dashboard</Link>
          <Link className="block px-3 py-2 rounded hover:bg-gray-50" href="/admin/login">Login</Link>
        </nav>
      </aside>

      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}


