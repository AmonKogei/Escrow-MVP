'use client';
import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthForm from '../components/AuthForm';

export default function LoginPage() {
  const search = useSearchParams();
  const router = useRouter();
  const role = (search.get('role') || 'buyer') as 'admin'|'buyer'|'seller';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-2xl">
        <AuthForm role={role} />
      </div>
    </div>
  );
}
