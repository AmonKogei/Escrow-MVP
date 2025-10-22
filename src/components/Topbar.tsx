"use client";
import React from 'react';

export default function Topbar({ email }: { email?: string }) {
  return (
    <div className="w-full bg-white shadow p-3 flex justify-between items-center">
      <div className="text-lg font-semibold text-green-700">Kenya Escrow MVP</div>
      <div className="text-sm text-gray-600">{email || 'Not signed in'}</div>
    </div>
  );
}
