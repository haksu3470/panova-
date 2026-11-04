'use client';

import { useEffect } from 'react';
import { captureRecoveryFromWindow, recoveryPending, storedResetAudience } from '@/lib/passwordReset';

/** If a recovery link lands on the site root, continue on the reset page and keep the hash. */
export default function RecoveryRedirect() {
  useEffect(() => {
    captureRecoveryFromWindow();
    if (!recoveryPending()) return;
    if (window.location.pathname.startsWith('/auth/reset-password')) return;
    const audience = storedResetAudience();
    const path = audience ? `/auth/reset-password/${audience}` : '/auth/reset-password';
    window.location.replace(`${path}${window.location.search}${window.location.hash}`);
  }, []);
  return null;
}
