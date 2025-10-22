'use client';
import React, { useEffect, useMemo, useState } from 'react';
import type { Session } from '../types/session';

export default function useSession() {
  const [session, setSession] = useState<Session>({ user: null });

  useEffect(() => {
    let mounted = true;
    fetch('/api/auth/session')
      .then((r) => {
        if (!mounted) return;
        if (!r.ok) return setSession({ user: null });
        return r.json().then((j) => setSession(j));
      })
      .catch(() => {
        if (!mounted) return;
        setSession({ user: null });
      });
    return () => {
      mounted = false;
    };
  }, []);

  return useMemo(() => session, [session]);
}
