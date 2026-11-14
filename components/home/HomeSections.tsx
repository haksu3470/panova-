import Link from 'next/link';
import type { CSSProperties } from 'react';
import {
  Users, Building2, ShieldCheck, FileCheck2, Plane, ClipboardCheck, Search, Handshake,
  HardHat, Sprout, Factory, Truck, Hotel, Stethoscope, Wrench, ShoppingBag,
  Award, Globe2, ArrowRight, Briefcase, GraduationCap, HeartHandshake,
  Layers, CalendarCheck, Landmark, Eye, Languages, ChevronDown, Mail,
} from 'lucide-react';
import { company } from '@/lib/company';
import type { Language } from '@/lib/dictionary';
import { fill, homeCopy } from '@/lib/home-copy';
import { SECTOR_EXAMPLES, homeExtraCopy } from '@/lib/home-extra-copy';
import { professionLabel } from '@/lib/professions';
import { CountUp } from '@/components/home/HomeMotion';

const employerIcons = [Search, Users, FileCheck2, ClipboardCheck, Plane, HeartHandshake];
const candidateIcons = [Briefcase, GraduationCap, ShieldCheck];
const sectorIcons = [HardHat, Sprout, Factory, Wrench, Truck, Hotel, Stethoscope, ShoppingBag];
const statIcons = [Globe2, Building2, Layers, CalendarCheck];

/** Card lift on hover; none when the visitor asks for less motion. */
const CARD_HOVER = 'transition duration-200 hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0';
const revealDelay = (index: number) => ({ '--reveal-delay': `${index * 90}ms` }) as CSSProperties;

function SectionTitle({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-14">
      <span className="font-bold text-xs uppercase tracking-widest text-brand">{eyebrow}</span>
      <h2 className="text-2xl sm:text-4xl font-black mt-2 tracking-tight text-slate-900">{title}</h2>
      {desc && <p className="text-sm sm:text-base mt-3 leading-relaxed text-slate-600">{desc}</p>}
    </div>
  );
}

/** The same heading for dark sections (the timeline). */
function DarkSectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-14 bg-slate-900">
      <span className="font-bold text-xs uppercase tracking-widest text-emerald-200">{eyebrow}</span>
      <h2 className="text-2xl sm:text-4xl font-black mt-2 tracking-tight text-on-dark">{title}</h2>
    </div>
  );
}

export function StatsBar({ lang }: { lang: Language }) {
  const c = homeCopy[lang];
  const x = homeExtraCopy[lang];
  return (
    <section aria-labelledby="home-stats-title" className="bg-white border-b border-slate-200">
      <h2 id="home-stats-title" className="sr-only">{x.statsHeading}</h2>
      {/* Phones: two columns, icon above the text, so "30/60/90" and long labels (mk, sq) stay inside the card. */}
      <ul className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 lg:grid-cols-4 items-stretch gap-3 sm:gap-6">
        {c.stats.map((s, i) => {
          const Icon = statIcons[i] ?? Globe2;
          return (
            <li key={s.label} className="flex h-full min-w-0 flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
                <Icon aria-hidden className="h-5 w-5 text-brand" />
              </span>
              <div className="min-w-0 max-w-full">
                <div dir="ltr" className="text-[clamp(1.25rem,6vw,1.875rem)] leading-tight font-black text-brand tabular-nums whitespace-nowrap rtl:text-end"><CountUp value={s.value} /></div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 break-words hyphens-auto [overflow-wrap:anywhere]">{s.label}</div>
                {i === 0 ? <div className="text-xs text-muted-foreground mt-0.5 break-words">{c.about.countries.join(' · ')}</div> : null}
                {i === 2 ? (
                  <a href="#sektorler" className="text-xs font-semibold text-brand underline-offset-2 hover:underline">{x.sectorsStatHint}</a>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function AudienceSections({ lang }: { lang: Language }) {
  const c = homeCopy[lang];
  const x = homeExtraCopy[lang];
  return (
    <>
      <section id="isverenler" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <SectionTitle eyebrow={c.employersEyebrow} title={c.employersTitle} desc={c.employersDesc} />
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {c.employerServices.map(({ title, desc }, i) => {
            const Icon = employerIcons[i];
            return (
              <div key={title} style={revealDelay(i)} className={`home-reveal bg-white rounded-2xl border border-slate-200 p-6 hover:border-emerald-200 ${CARD_HOVER}`}>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-4"><Icon aria-hidden className="w-6 h-6 text-brand" /></div>
                <h3 className="font-extrabold text-slate-900 text-lg">{title}</h3>
                <p className="text-slate-600 text-sm mt-2 leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-10">
          <Link href="/employer-login" className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-800">
            <Building2 aria-hidden className="w-4 h-4" /> {c.createDemand} <ArrowRight aria-hidden className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>
      </section>

      <section id="adaylar" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-brand bg-gradient-to-br from-brand to-emerald-800 text-on-dark">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="font-bold text-xs uppercase tracking-widest text-emerald-200">{c.candidatesEyebrow}</span>
            <h2 className="text-2xl sm:text-4xl font-black mt-2 tracking-tight">{c.candidatesTitle}</h2>
            <p className="text-emerald-50 mt-4 text-sm sm:text-base leading-relaxed">{c.candidatesDesc}</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link href="/candidate" className="inline-flex justify-center items-center gap-2 bg-white text-brand px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-50">{c.applyNow} <ArrowRight aria-hidden className="w-4 h-4 rtl:rotate-180" /></Link>
              <Link href="/candidate" className="inline-flex justify-center items-center gap-2 border border-white/40 px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10">{c.candidateLogin}</Link>
            </div>
          </div>
          <div className="grid gap-4">
            {c.candidateItems.map(({ title, desc }, i) => {
              const Icon = candidateIcons[i];
              return (
                <div key={title} style={revealDelay(i)} className="home-reveal flex gap-4 bg-white/10 rounded-2xl p-5 border border-white/15">
                  <Icon aria-hidden className="w-7 h-7 text-emerald-200 flex-shrink-0" />
                  <div><h3 className="font-extrabold">{title}</h3><p className="text-sm text-emerald-50 mt-1">{desc}</p></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="sektorler" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <SectionTitle eyebrow={c.sectorsEyebrow} title={c.sectorsTitle} desc={c.sectorsDesc} />
        <ul className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {c.sectorNames.map((name, i) => {
            const Icon = sectorIcons[i];
            const examples = (SECTOR_EXAMPLES[i] ?? []).map((key) => professionLabel(key, lang)).filter(Boolean) as string[];
            return (
              <li key={name} style={revealDelay(i % 4)} className={`home-reveal flex flex-col rounded-2xl bg-slate-50 border border-slate-200 p-5 hover:border-emerald-200 ${CARD_HOVER}`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200">
                  <Icon aria-hidden className="w-6 h-6 text-brand" />
                </span>
                <h3 className="font-extrabold text-slate-900 mt-4">{name}</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{x.sectorCards[i]?.desc}</p>
                {examples.length ? (
                  <div className="mt-auto pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{x.examplesLabel}</p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {examples.map((example) => (
                        <li key={example} className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">{example}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section id="nasil-calisir" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 text-on-dark">
        <DarkSectionTitle eyebrow={c.howEyebrow} title={c.howTitle} />
        <div className="relative max-w-6xl mx-auto">
          {/* the timeline line: vertical on phones, horizontal from md */}
          <div aria-hidden className="absolute start-[1.125rem] top-3 bottom-3 w-0.5 bg-emerald-700 md:start-[10%] md:end-[10%] md:top-[1.125rem] md:bottom-auto md:h-0.5 md:w-auto" />
          <ol className="relative grid gap-8 md:grid-cols-5 md:gap-4">
            {c.steps.map((s, i) => (
              <li key={s.title} style={revealDelay(i)} className="home-reveal flex gap-4 md:flex-col md:items-center md:text-center">
                <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-solid font-black text-on-dark ring-4 ring-slate-900">{i + 1}</span>
                <div>
                  <h3 className="font-extrabold text-on-dark">{s.title}</h3>
                  <p className="text-sm text-on-dark-muted mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

export function TrustSections({ lang }: { lang: Language }) {
  const c = homeCopy[lang];
  const x = homeExtraCopy[lang];
  // Only what the site already says: registry numbers, the KVKK notice and data
  // security, the clear process, 30/60/90-day follow-up, skills and languages.
  const reasons = [
    {
      Icon: Landmark,
      title: x.registryTitle,
      desc: fill(x.registryDesc, { shortName: company.shortName, embs: company.embs, vkn: company.turkey.vkn }),
      link: { href: '#kurumsal', label: c.footer.registry },
    },
    { Icon: ShieldCheck, title: x.kvkkTitle, desc: `${c.candidateItems[2].desc} ${c.trust[1].desc}`, link: { href: '/kvkk', label: c.footer.kvkk } },
    { Icon: Eye, title: c.trust[3].title, desc: `${c.trust[3].desc} ${x.processDetail}` },
    { Icon: CalendarCheck, title: c.employerServices[5].title, desc: c.employerServices[5].desc },
    { Icon: Award, title: c.trust[0].title, desc: c.trust[0].desc },
    { Icon: Languages, title: c.trust[2].title, desc: c.trust[2].desc },
  ];
  return (
    <>
      <section id="guven" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <SectionTitle eyebrow={c.trustEyebrow} title={x.trustTitle} />
        <ul className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {reasons.map(({ Icon, title, desc, link }, i) => (
            <li key={title} style={revealDelay(i % 3)} className={`home-reveal flex flex-col p-6 rounded-2xl border border-slate-200 bg-white hover:border-emerald-200 ${CARD_HOVER}`}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50"><Icon aria-hidden className="w-6 h-6 text-brand" /></span>
              <h3 className="font-extrabold text-slate-900 mt-4">{title}</h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">{desc}</p>
              {link ? (
                link.href.startsWith('/') ? (
                  <Link href={link.href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">{link.label} <ArrowRight aria-hidden className="h-3.5 w-3.5 rtl:rotate-180" /></Link>
                ) : (
                  <a href={link.href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">{link.label} <ArrowRight aria-hidden className="h-3.5 w-3.5 rtl:rotate-180" /></a>
                )
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section id="sss" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <SectionTitle eyebrow={c.faqEyebrow} title={c.faqTitle} />
        <div className="max-w-3xl mx-auto space-y-3">
          {c.faqs.map((f) => (
            <details key={f.q} className="group bg-white rounded-2xl border border-slate-200 p-5">
              <summary className="home-summary font-bold text-slate-900 cursor-pointer list-none flex items-center justify-between gap-4">
                <span>{f.q}</span>
                <ChevronDown aria-hidden className="h-5 w-5 shrink-0 text-brand transition-transform group-open:rotate-180 motion-reduce:transition-none" />
              </summary>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto rounded-3xl bg-slate-900 text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black">{c.bandTitle}</h2>
            <p className="text-on-dark-muted mt-2 text-sm sm:text-base">{c.bandDesc}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <a href="#contact-form" className="inline-flex justify-center items-center gap-2 bg-brand-solid px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-brand"><Handshake aria-hidden className="w-4 h-4" /> {c.getQuote}</a>
            <Link href="/candidate" className="inline-flex justify-center items-center gap-2 bg-white text-slate-900 px-6 py-3.5 rounded-xl font-bold text-sm">{c.ctaJob}</Link>
          </div>
        </div>
      </section>
    </>
  );
}

/** Registry facts. Addresses and phones live in the contact section (#contact-form). */
export function CompanyAbout({ lang }: { lang: Language }) {
  const a = homeCopy[lang].about;
  const x = homeExtraCopy[lang];
  return (
    <section id="kurumsal" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200">
      <SectionTitle eyebrow={a.eyebrow} title={a.presenceTitle} desc={a.presenceDesc} />
      <ul className="max-w-3xl mx-auto mb-8 flex flex-wrap justify-center gap-2 text-sm font-bold">
        {company.presence.map((place, i) => (
          <li key={place.city} className="rounded-full bg-emerald-50 text-brand border border-emerald-100 px-4 py-2">
            {a.countries[i]} · {place.city}
          </li>
        ))}
      </ul>
      <dl className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
          <dt className="text-xs font-bold uppercase text-muted-foreground">{a.northMacedonia}</dt>
          <dd className="font-semibold text-slate-900 mt-1">{company.shortName}</dd>
          <dd className="text-slate-600 text-xs mt-1">{company.legalName}</dd>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <dt className="text-xs font-bold uppercase text-muted-foreground">{a.registry}</dt>
          <dd className="mt-1 text-slate-800">EMBS {company.embs}<br />{a.taxNo} {company.taxId}</dd>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <dt className="text-xs font-bold uppercase text-muted-foreground">{a.established}</dt>
          <dd className="mt-1 text-slate-800">{a.establishedValue}</dd>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
          <dt className="text-xs font-bold uppercase text-muted-foreground">{a.managers}</dt>
          <dd className="mt-1 font-semibold text-slate-900">{company.managers.join(' · ')}</dd>
          <dd className="text-muted-foreground text-xs mt-2">{a.mkShort}: {company.shortNameMk}</dd>
        </div>
      </dl>
      <p className="max-w-3xl mx-auto mt-6 text-center">
        <a href="#contact-form" className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline">
          <Mail aria-hidden className="h-4 w-4" /> {x.contactInfo}
        </a>
      </p>
    </section>
  );
}

/** Short footer: brand, registry name, countries and e-mail; full addresses are in the contact section. */
export function SiteFooter({ lang }: { lang: Language }) {
  const f = homeCopy[lang].footer;
  const a = homeCopy[lang].about;
  const x = homeExtraCopy[lang];
  return (
    <footer className="bg-slate-950 text-on-dark-muted px-4 sm:px-6 lg:px-8 pt-14 pb-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" width={1051} height={725} className="h-12 w-auto rounded-lg bg-white object-contain" />
            <div className="text-white font-black text-xl">PANOVA</div>
          </div>
          <p className="text-sm text-white mt-3">{company.shortName}</p>
          <p className="text-xs mt-1">{a.countries.join(' · ')}</p>
          <p className="text-sm mt-3">
            <a className="hover:text-white" href={`mailto:${company.email}`}>{company.email}</a>
          </p>
          <p className="text-sm mt-2">
            <Link className="font-semibold text-white hover:underline" href="/#contact-form">{x.contactInfo}</Link>
          </p>
        </div>
        <div>
          <h2 className="text-white font-bold mb-3 text-base">{f.employers}</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/#isverenler" className="hover:text-white">{f.services}</Link></li>
            <li><Link href="/employer-login" className="hover:text-white">{f.employerLogin}</Link></li>
            <li><Link href="/#contact-form" className="hover:text-white">{f.quote}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-white font-bold mb-3 text-base">{f.candidates}</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/candidate" className="hover:text-white">{f.apply}</Link></li>
            <li><Link href="/#sektorler" className="hover:text-white">{f.sectors}</Link></li>
            <li><Link href="/#sss" className="hover:text-white">{f.faq}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-white font-bold mb-3 text-base">{f.corporate}</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/#kurumsal" className="hover:text-white">{f.registry}</Link></li>
            <li><Link href="/#nasil-calisir" className="hover:text-white">{f.how}</Link></li>
            <li><Link href="/portal" className="hover:text-white">{f.staffPortal}</Link></li>
            <li><Link href="/kvkk" className="hover:text-white">{f.kvkk}</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-slate-800 mt-10 pt-6 text-xs flex flex-col sm:flex-row justify-between gap-2">
        <span>© {new Date().getFullYear()} {company.shortName}. {f.rights}</span>
        <span>EMBS {company.embs} · {f.taxNo} {company.taxId}</span>
      </div>
    </footer>
  );
}
