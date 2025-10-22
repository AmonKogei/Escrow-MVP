"use client";
import React, { createContext, useContext, useState } from 'react';
import { Dialog } from '@headlessui/react';

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
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);

  const request = (o: ConfirmOptions = {}) => {
    setOpts(o);
    setOpen(true);
    return new Promise<boolean>(res => setResolver(() => res));
  };

  const resolve = (v: boolean) => {
    setOpen(false);
    resolver && resolver(v);
    setResolver(null);
  };

  return (
    <ConfirmContext.Provider value={request}>
      {children}
      <Dialog open={open} onClose={() => resolve(false)} className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black opacity-30" />
        <Dialog.Panel className="bg-white rounded p-6 z-10 w-96">
          <Dialog.Title className="text-lg font-semibold">{opts.title || 'Confirm'}</Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 mt-2">{opts.description || 'Are you sure?'}</Dialog.Description>
          <div className="mt-4 flex justify-end space-x-2">
            <button className="btn btn-sm" onClick={() => resolve(false)}>{opts.cancelText || 'Cancel'}</button>
            <button className="btn btn-sm btn-primary" onClick={() => resolve(true)}>{opts.confirmText || 'Confirm'}</button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export default ConfirmProvider;
