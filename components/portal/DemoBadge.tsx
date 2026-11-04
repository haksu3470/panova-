'use client';

import { portalUi } from '@/lib/portal-ui-copy';
import { useSiteLanguage } from '@/lib/site-language';

export default function DemoBadge({ show }: { show?: boolean | null }) {
  const { currentLang } = useSiteLanguage('en');
  if (!show) return null;
  return (
    <span
      title={portalUi[currentLang].demoTitle}
      className="ms-1.5 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-300"
    >
      Demo
    </span>
  );
}
