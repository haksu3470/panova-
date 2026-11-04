import { ChevronRight } from 'lucide-react';
import type { GuidesCopy, PortalViewer } from '@/lib/guides-model';
import { portalGuideView, sessionName } from '@/lib/guides-model';

export default function GuidesHub({
  copy,
  viewer,
  isRtl,
}: {
  copy: GuidesCopy;
  viewer: PortalViewer;
  isRtl: boolean;
}) {
  const view = portalGuideView(copy, viewer);

  return (
    <div className="space-y-6">
      <p className="text-xs font-bold text-emerald-800">
        {copy.sessionLabel}: {sessionName(copy, viewer)}
      </p>

      <section className="space-y-4" aria-labelledby="guides-map-title">
        <div className="space-y-1">
          <h2 id="guides-map-title" className="text-lg font-extrabold text-slate-900">{copy.mapTitle}</h2>
          <p className="text-sm text-slate-600">{copy.mapLead}</p>
          {viewer.kind === 'staff' && <p className="text-xs text-slate-500">{copy.mapNote}</p>}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {view.roles.map((role) => (
            <article key={role.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">{role.title}</h3>
                <p className="text-xs leading-relaxed text-slate-600">{role.summary}</p>
              </div>
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{copy.screensLabel}</h4>
              <ul className="space-y-2">
                {role.screens.map((screen) => (
                  <li key={screen.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">{screen.name}</span>
                      <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500 ring-1 ring-slate-200" dir="ltr">{screen.path}</code>
                      {screen.managementOnly && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">{copy.upperOnly}</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{screen.does}</p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="guides-howto-title">
        <div className="space-y-1">
          <h2 id="guides-howto-title" className="text-lg font-extrabold text-slate-900">{copy.howToTitle}</h2>
          <p className="text-sm text-slate-600">{copy.howToLead}</p>
        </div>
        <nav aria-label={copy.howToTitle}>
          <ul className="flex flex-wrap gap-2">
            {view.guides.map((guide) => (
              <li key={guide.id}>
                <a href={`#${guide.id}`} className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50">
                  {guide.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-4">
          {view.guides.map((guide) => (
            <article id={guide.id} key={guide.id} className="scroll-mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">{guide.title}</h3>
                <p className="text-sm text-slate-600">{guide.summary}</p>
                <p className="text-xs font-bold text-slate-500">
                  {copy.whereLabel}: <span className="font-mono font-semibold text-slate-800">{guide.where}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <div className="space-y-3 lg:col-span-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{copy.stepsLabel}</h4>
                  <ol className="space-y-3">
                    {guide.steps.map((step, index) => (
                      <li key={step.title} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2e7d32] text-[11px] font-extrabold text-white" aria-hidden>
                          {index + 1}
                        </span>
                        <div className="space-y-0.5">
                          <p className="text-sm font-extrabold text-slate-900">{step.title}</p>
                          <p className="text-xs leading-relaxed text-slate-600">{step.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="space-y-3 lg:col-span-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{copy.flowLabel}</h4>
                  <ol className="flex flex-wrap items-center gap-2" dir={isRtl ? 'rtl' : 'ltr'}>
                    {guide.flow.map((node, index) => (
                      <li key={`${guide.id}-${node}`} className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-950 ring-1 ring-emerald-200">{node}</span>
                        {index < guide.flow.length - 1 && (
                          <ChevronRight aria-hidden className="h-3.5 w-3.5 text-slate-400 rtl:rotate-180" />
                        )}
                      </li>
                    ))}
                  </ol>
                  <figure className="rounded-2xl border border-slate-200 bg-slate-100 p-3">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-2">
                        <span aria-hidden className="h-2 w-2 rounded-full bg-rose-400" />
                        <span aria-hidden className="h-2 w-2 rounded-full bg-amber-300" />
                        <span aria-hidden className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="truncate font-mono text-[10px] text-slate-200" dir="ltr">{guide.mock.chrome}</span>
                      </div>
                      <div className="space-y-2 p-3">
                        {guide.mock.rows.map((row) => (
                          <div key={row.label} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                            <span className="font-bold text-slate-500">{row.label}</span>
                            <span className="text-end font-semibold text-slate-900">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <figcaption className="mt-2 text-[11px] font-medium text-slate-500">{guide.mock.caption}</figcaption>
                  </figure>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
