'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Printer } from 'lucide-react';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';
import { languages, type Language } from '@/lib/dictionary';
import { guidesCopy } from '@/lib/guides-copy';
import {
  guidePrintView,
  guidesPrintHref,
  printButtonLabel,
  sessionName,
  type GuidesCopy,
  type GuidePrintView,
  type PortalViewer,
} from '@/lib/guides-model';
import { useSiteLanguage } from '@/lib/site-language';
import { useGuidesViewer } from '@/components/guides/useGuidesViewer';

const DATE_LOCALE: Record<Language, string> = { tr: 'tr-TR', en: 'en-GB', sq: 'sq-AL', ar: 'ar', mk: 'mk-MK' };

/** @page rules and the print overrides; the page label comes from the copy. */
function printCss(pageLabel: string): string {
  return `
@page {
  size: A4;
  margin: 16mm 14mm 18mm;
  @bottom-center { content: ${JSON.stringify(`${pageLabel} `)} counter(page); font-size: 9pt; color: #444; }
}
.guides-print .print-break { break-before: page; }
.guides-print .print-avoid { break-inside: avoid; }
@media print {
  html, body { background: #fff !important; }
  .guides-print [data-print-hide] { display: none !important; }
  .guides-print { padding: 0 !important; }
  .guides-print, .guides-print * {
    color: #000 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  .guides-print .print-sheet { border: 0 !important; padding: 0 !important; margin: 0 !important; }
  .guides-print .print-box { border: 1px solid #888 !important; }
  .guides-print a { color: #000 !important; text-decoration: underline; }
}`;
}

export default function GuidesPrintScreen() {
  const router = useRouter();
  const { currentLang, changeLanguage, isRtl } = useSiteLanguage('tr');
  const copy = guidesCopy[currentLang];
  const { gate, viewer } = useGuidesViewer();
  // Nothing that depends on ?role renders before the session check, so reading it here is hydration-safe.
  const [requestedRole, setRequestedRole] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('role'),
  );
  const [createdAt] = useState(() => new Date());

  // Not signed in, not verified or not linked: same place /guides sends them.
  const blocked = gate === 'out' || gate === 'verify' || (gate === 'ready' && (!viewer || viewer.kind === 'unlinked'));
  useEffect(() => {
    if (blocked) router.replace('/guides');
  }, [blocked, router]);

  const view = useMemo(
    () => (gate === 'ready' && viewer && viewer.kind !== 'unlinked' ? guidePrintView(copy, viewer, requestedRole) : null),
    [copy, gate, viewer, requestedRole],
  );

  // Browser tab, print dialog and the default PDF name follow the page language
  // (the static metadata title is only the fallback before this runs).
  useEffect(() => {
    document.title = copy.print.coverSubtitle;
  }, [copy]);

  const pickRole = (roleId: string) => {
    if (!viewer) return;
    const next = roleId || null;
    setRequestedRole(next);
    window.history.replaceState(null, '', guidesPrintHref(viewer, next));
  };

  return (
    <div className={`guides-print min-h-screen bg-slate-100 p-3 sm:p-6 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'} lang={currentLang}>
      <style>{printCss(copy.print.pageLabel)}</style>
      <div className="mx-auto max-w-4xl space-y-4">
        <div data-print-hide className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/guides" className="inline-flex items-center gap-1.5 rounded-xl border bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
              {copy.print.back}
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!view}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-solid px-3.5 py-2 text-xs font-bold text-white hover:bg-brand disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              <Printer className="h-4 w-4" aria-hidden />
              {copy.print.printButton}
            </button>
            {view && viewer?.upperManagement && (
              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700">
                {copy.print.roleFilterLabel}
                <select
                  value={view.roleId ?? ''}
                  onChange={(event) => pickRole(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900"
                >
                  <option value="">{copy.print.allRoles}</option>
                  {guidePrintView(copy, viewer).roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.title}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <LanguageSwitcher currentLang={currentLang} onChange={changeLanguage} />
        </div>
        {view && <p data-print-hide className="text-xs text-slate-600">{copy.print.hint}</p>}

        {!view && <p className="text-sm font-bold text-muted-foreground">{copy.loading}</p>}

        {view && viewer && (
          <PrintDocument copy={copy} viewer={viewer} view={view} lang={currentLang} createdAt={createdAt} isRtl={isRtl} />
        )}
      </div>
    </div>
  );
}

function PrintDocument({
  copy,
  viewer,
  view,
  lang,
  createdAt,
  isRtl,
}: {
  copy: GuidesCopy;
  viewer: PortalViewer;
  view: GuidePrintView;
  lang: Language;
  createdAt: Date;
  isRtl: boolean;
}) {
  const languageName = languages.find((item) => item.code === lang)?.label ?? lang;
  const created = createdAt.toLocaleDateString(DATE_LOCALE[lang], { year: 'numeric', month: 'long', day: 'numeric' });
  const scope = view.scope === 'role'
    ? view.roles[0]?.title ?? copy.print.allRoles
    : view.scope === 'all'
      ? copy.print.allRoles
      : printButtonLabel(copy, viewer);

  return (
    <main className="space-y-4">
      <section className="print-sheet rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10" aria-labelledby="print-cover-title">
        {/* eslint-disable-next-line @next/next/no-img-element -- plain img: no lazy loading, so the logo is in the printout */}
        <img src="/logo.png" alt="PANOVA" width={1051} height={725} className="h-14 w-auto object-contain" />
        <h1 id="print-cover-title" className="mt-8 text-3xl font-extrabold text-slate-900">{copy.hubTitle}</h1>
        <p className="mt-2 text-lg font-bold text-slate-700">{copy.print.coverSubtitle}</p>
        <dl className="mt-8 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <CoverRow label={copy.print.languageLabel} value={languageName} />
          <CoverRow label={copy.print.createdLabel} value={created} />
          <CoverRow label={copy.print.sessionRoleLabel} value={sessionName(copy, viewer)} />
          <CoverRow label={copy.print.scopeLabel} value={scope} />
        </dl>
        <p className="mt-8 text-sm leading-relaxed text-slate-600">{copy.hubLead}</p>
      </section>

      <nav className="print-sheet print-break rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="print-toc-title">
        <h2 id="print-toc-title" className="text-xl font-extrabold text-slate-900">{copy.print.contentsTitle}</h2>
        {view.roles.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-extrabold text-slate-800">{copy.mapTitle}</h3>
            <ol className="mt-2 list-decimal space-y-1 ps-6 text-sm">
              {view.roles.map((role) => (
                <li key={role.id}><a href={`#print-role-${role.id}`} className="text-slate-900 underline">{role.title}</a></li>
              ))}
            </ol>
          </>
        )}
        {view.guides.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-extrabold text-slate-800">{copy.howToTitle}</h3>
            <ol className="mt-2 list-decimal space-y-1 ps-6 text-sm">
              {view.guides.map((guide) => (
                <li key={guide.id}><a href={`#print-guide-${guide.id}`} className="text-slate-900 underline">{guide.title}</a></li>
              ))}
            </ol>
          </>
        )}
      </nav>

      {view.roles.map((role) => (
        <article
          key={role.id}
          id={`print-role-${role.id}`}
          className="print-sheet print-break space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{copy.mapTitle}</p>
          <h2 className="text-xl font-extrabold text-slate-900">{role.title}</h2>
          <p className="text-sm leading-relaxed text-slate-700">{role.summary}</p>
          <h3 className="pt-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{copy.screensLabel}</h3>
          <ul className="space-y-2">
            {role.screens.map((screen) => (
              <li key={screen.id} className="print-avoid print-box rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900">{screen.name}</span>
                  <code className="font-mono text-[11px] text-slate-700" dir="ltr">{screen.path}</code>
                  {screen.managementOnly && <span className="text-[11px] font-bold text-amber-900">({copy.upperOnly})</span>}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{screen.does}</p>
              </li>
            ))}
          </ul>
        </article>
      ))}

      {view.guides.map((guide) => (
        <article
          key={guide.id}
          id={`print-guide-${guide.id}`}
          className="print-sheet print-break space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{copy.howToTitle}</p>
            <h2 className="text-xl font-extrabold text-slate-900">{guide.title}</h2>
            <p className="text-sm text-slate-700">{guide.summary}</p>
            <p className="text-xs font-bold text-slate-700">
              {copy.whereLabel}: <span className="font-mono font-semibold" dir="ltr">{guide.where}</span>
            </p>
          </div>

          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{copy.stepsLabel}</h3>
            {guide.hasOthersSteps ? <p className="text-xs font-semibold text-slate-700">{copy.stepOthersNote}</p> : null}
            <ol className="space-y-2">
              {guide.steps.map((step, index) => (
                <li key={step.title} className="print-avoid flex gap-3" data-own={step.own ? 'true' : 'false'}>
                  <span className="w-6 shrink-0 text-sm font-extrabold text-slate-900">{index + 1}.</span>
                  <div>
                    <p className={`text-sm font-extrabold ${step.own ? 'text-slate-900' : 'text-slate-700'}`}>{step.title}</p>
                    {step.body ? <p className="text-sm leading-relaxed text-slate-700">{step.body}</p> : null}
                    {step.doneBy ? <p className="text-xs font-bold text-slate-700">{step.doneBy}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {guide.example ? (
            <aside aria-label={copy.exampleLabel} className="print-avoid print-box rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-900">{copy.exampleLabel}</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-950">{guide.example}</p>
            </aside>
          ) : null}

          <section className="print-avoid space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{copy.flowLabel}</h3>
            <ol className="flex flex-wrap items-center gap-2" dir={isRtl ? 'rtl' : 'ltr'}>
              {guide.flow.map((node, index) => (
                <li key={`${guide.id}-${node}`} className="flex items-center gap-2">
                  <span className="print-box rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-950">{node}</span>
                  {index < guide.flow.length - 1 && <ChevronRight aria-hidden className="h-3.5 w-3.5 text-muted-foreground rtl:rotate-180" />}
                </li>
              ))}
            </ol>
          </section>

          <figure className="print-avoid print-box rounded-xl border border-slate-200 p-3">
            <p className="font-mono text-[11px] text-slate-700" dir="ltr">{guide.mock.chrome}</p>
            <dl className="mt-2 space-y-1">
              {guide.mock.rows.map((row) => (
                <div key={row.label} className="flex justify-between gap-3 border-b border-slate-100 py-1 text-xs last:border-0">
                  <dt className="font-bold text-slate-700">{row.label}</dt>
                  <dd className="text-end font-semibold text-slate-900">{row.value}</dd>
                </div>
              ))}
            </dl>
            <figcaption className="mt-2 text-[11px] text-slate-600">{guide.mock.caption}</figcaption>
          </figure>
        </article>
      ))}
    </main>
  );
}

function CoverRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="print-box rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-600">{label}</dt>
      <dd className="text-sm font-extrabold text-slate-900">{value}</dd>
    </div>
  );
}
