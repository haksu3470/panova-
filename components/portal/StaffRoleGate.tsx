'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { portalUi } from '@/lib/portal-ui-copy';
import { canOpenStaffFile, type StaffFileRoute } from '@/lib/staffAccess';
import { useSiteLanguage } from '@/lib/site-language';
import { useStaffRole } from './useStaffRole';

export default function StaffRoleGate({ route, children }: { route: StaffFileRoute; children: ReactNode }) {
  const { role, ready } = useStaffRole();
  const { currentLang, isRtl } = useSiteLanguage('tr');
  const ui = portalUi[currentLang];

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">{ui.loading}</div>;
  }
  if (!canOpenStaffFile(role, route)) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="max-w-sm w-full bg-white border rounded-2xl p-6 text-center space-y-3 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">{ui.routeDenied}</h1>
          <Link href="/portal" className="inline-block bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl">{ui.backToPortal}</Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
