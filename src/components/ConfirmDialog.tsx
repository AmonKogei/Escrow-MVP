"use client";
import React, { createContext, useContext, useState } from 'react';

type ConfirmOptions = { title?: string; description?: string; confirmText?: string; cancelText?: string };

const ConfirmContext = createContext<((opts?: ConfirmOptions) => Promise<boolean>) | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({});
  const [resolveRef, setResolveRef] = useState<((v: boolean) => void) | null>(null);

  const requestConfirm = (o: ConfirmOptions = {}) => {
    setOpts(o);
    setOpen(true);
    return new Promise<boolean>((res) => {
      setResolveRef(() => res);
    });
  };

  const handle = (v: boolean) => {
    setOpen(false);
    resolveRef && resolveRef(v);
    setResolveRef(null);
  };

  return (
    <ConfirmContext.Provider value={requestConfirm}>
      {children}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded p-6 w-96">
            <h3 className="text-lg font-semibold mb-2">{opts.title || 'Confirm'}</h3>
            <p className="text-sm text-gray-600 mb-4">{opts.description || 'Are you sure?'}</p>
            <div className="flex justify-end space-x-2">
              <button className="btn btn-sm" onClick={() => handle(false)}>{opts.cancelText || 'Cancel'}</button>
              <button className="btn btn-sm btn-primary" onClick={() => handle(true)}>{opts.confirmText || 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export default ConfirmProvider;
