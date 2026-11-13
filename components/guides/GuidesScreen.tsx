'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, Printer } from 'lucide-react';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';
import { guidesCopy } from '@/lib/guides-copy';
import { guidesHome, guidesPrintHref, printButtonLabel, type GuidesCopy } from '@/lib/guides-model';
import { useSiteLanguage } from '@/lib/site-language';
import GuidesHub from '@/components/guides/GuidesHub';
import { useGuidesViewer } from '@/components/guides/useGuidesViewer';

export default function GuidesScreen() {
  const { currentLang, changeLanguage, isRtl } = useSiteLanguage('tr');
  const copy = guidesCopy[currentLang];
  const { gate, viewer } = useGuidesViewer();
  const canPrint = gate === 'ready' && !!viewer && viewer.kind !== 'unlinked';

  const backHref = guidesHome(gate === 'ready' ? viewer : null);
  const backLabel = viewer?.kind === 'employer'
    ? copy.backEmployer
    : viewer?.kind === 'candidate'
      ? copy.backCandidate
      : viewer?.kind === 'staff'
        ? copy.backStaff
        : copy.backHome;

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PANOVA" width={1051} height={725} className="h-10 w-auto shrink-0 object-contain" />
            <div>
              <div className="mb-0.5 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                {copy.navLabel}
              </div>
              <h1 className="text-lg font-extrabold text-slate-900 sm:text-xl">{copy.hubTitle}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {canPrint && viewer && (
              <Link
                href={guidesPrintHref(viewer)}
                title={copy.print.printButton}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-solid px-3.5 py-2 text-xs font-bold text-white hover:bg-brand"
              >
                <Printer className="h-4 w-4" aria-hidden />
                {copy.print.printButton}: {printButtonLabel(copy, viewer)}
              </Link>
            )}
            <Link href={backHref} className="inline-flex items-center gap-1.5 rounded-xl border bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
              {backLabel}
            </Link>
            <LanguageSwitcher currentLang={currentLang} onChange={changeLanguage} />
          </div>
        </header>

        {gate === 'loading' && (
          <p className="text-sm font-bold text-muted-foreground">{copy.loading}</p>
        )}

        {gate === 'ready' && viewer && viewer.kind !== 'unlinked' && (
          <>
            <p className="text-sm text-slate-600">{copy.hubLead}</p>
            <GuidesHub copy={copy} viewer={viewer} isRtl={isRtl} />
          </>
        )}

        {gate === 'ready' && viewer?.kind === 'unlinked' && (
          <GateCard title={copy.unlinkedTitle} body={copy.unlinkedBody} copy={copy} />
        )}

        {gate === 'verify' && (
          <GateCard title={copy.verifyTitle} body={copy.verifyBody} copy={copy} />
        )}

        {gate === 'out' && (
          <GateCard title={copy.signedOutTitle} body={copy.signedOutBody} copy={copy} />
        )}
      </div>
    </div>
  );
}

function GateCard({
  title,
  body,
  copy,
}: {
  title: string;
  body: string;
  copy: Pick<GuidesCopy, 'signInStaff' | 'signInEmployer' | 'signInCandidate'>;
}) {
  return (
    <section className="mx-auto max-w-lg space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
      <p className="text-sm leading-relaxed text-slate-600">{body}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link href="/portal" className="rounded-xl bg-brand-solid px-4 py-2.5 text-xs font-bold text-white hover:bg-brand">{copy.signInStaff}</Link>
        <Link href="/employer-login" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100">{copy.signInEmployer}</Link>
        <Link href="/candidate" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100">{copy.signInCandidate}</Link>
      </div>
    </section>
  );
}
