'use client';

import { useEffect, useState } from 'react';
import { resolvePortalViewer } from '@/lib/guides-access';
import type { PortalViewer } from '@/lib/guides-model';
import { supabase } from '@/lib/supabase';
import { emailAccessOk, storedVerifyEmail } from '@/lib/emailVerification';

export type GuidesGate = 'loading' | 'out' | 'verify' | 'ready';

/** Session check shared by /guides and /guides/print (one access rule for both). */
export function useGuidesViewer(): { gate: GuidesGate; viewer: PortalViewer | null } {
  const [gate, setGate] = useState<GuidesGate>('loading');
  const [viewer, setViewer] = useState<PortalViewer | null>(null);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          if (!alive) return;
          setViewer(null);
          setGate(storedVerifyEmail() ? 'verify' : 'out');
          return;
        }
        if (!(await emailAccessOk())) {
          if (alive) setGate('verify');
          return;
        }
        const next = await resolvePortalViewer(data.session.user.id);
        if (!alive) return;
        setViewer(next);
        setGate('ready');
      } catch {
        if (!alive) return;
        setViewer(null);
        setGate('out');
      }
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      check();
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { gate, viewer };
}
