import Link from 'next/link';
import {
  Users, Building2, ShieldCheck, FileCheck2, Plane, ClipboardCheck, Search, Handshake,
  HardHat, Sprout, Factory, Truck, Hotel, Stethoscope, Wrench, ShoppingBag,
  Award, Globe2, Clock, BadgeCheck, ArrowRight, Briefcase, GraduationCap, HeartHandshake,
} from 'lucide-react';
import { company } from '@/lib/company';
import type { Language } from '@/lib/dictionary';
import { homeCopy } from '@/lib/home-copy';

const employerIcons = [Search, Users, FileCheck2, ClipboardCheck, Plane, HeartHandshake];
const candidateIcons = [Briefcase, GraduationCap, ShieldCheck];
const sectorIcons = [HardHat, Sprout, Factory, Wrench, Truck, Hotel, Stethoscope, ShoppingBag];
const trustIcons = [Award, ShieldCheck, Globe2, Clock];

function SectionTitle({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="max-w-2xl mx-auto text-center mb-8 sm:mb-12">
      <span className="text-[#2e7d32] font-bold text-xs uppercase tracking-widest">{eyebrow}</span>
      <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-2 tracking-tight">{title}</h2>
      {desc && <p className="text-slate-600 text-sm sm:text-base mt-3">{desc}</p>}
    </div>
  );
}

export function StatsBar({ lang }: { lang: Language }) {
  const stats = homeCopy[lang].stats;
  return (
    <section className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl sm:text-3xl font-black text-[#2e7d32]">{s.value}</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AudienceSections({ lang }: { lang: Language }) {
  const c = homeCopy[lang];
  return (
    <>
      <section id="isverenler" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <SectionTitle eyebrow={c.employersEyebrow} title={c.employersTitle} desc={c.employersDesc} />
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {c.employerServices.map(({ title, desc }, i) => {
            const Icon = employerIcons[i];
            return (
              <div key={title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-emerald-200 transition">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-4"><Icon className="w-6 h-6 text-[#2e7d32]" /></div>
                <h3 className="font-extrabold text-slate-900 text-lg">{title}</h3>
                <p className="text-slate-600 text-sm mt-2 leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <Link href="/employer-login" className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-800">
            <Building2 className="w-4 h-4" /> {c.createDemand} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>
      </section>

      <section id="adaylar" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#1b5e20] to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="font-bold text-xs uppercase tracking-widest text-emerald-200">{c.candidatesEyebrow}</span>
            <h2 className="text-2xl sm:text-4xl font-black mt-2 tracking-tight">{c.candidatesTitle}</h2>
            <p className="text-emerald-50 mt-4 text-sm sm:text-base">{c.candidatesDesc}</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link href="/candidate" className="inline-flex justify-center items-center gap-2 bg-white text-[#1b5e20] px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-50">{c.applyNow} <ArrowRight className="w-4 h-4 rtl:rotate-180" /></Link>
              <Link href="/candidate" className="inline-flex justify-center items-center gap-2 border border-white/40 px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10">{c.candidateLogin}</Link>
            </div>
          </div>
          <div className="grid gap-4">
            {c.candidateItems.map(({ title, desc }, i) => {
              const Icon = candidateIcons[i];
              return (
                <div key={title} className="flex gap-4 bg-white/10 rounded-2xl p-5 border border-white/15">
                  <Icon className="w-7 h-7 text-emerald-200 flex-shrink-0" />
                  <div><div className="font-extrabold">{title}</div><div className="text-sm text-emerald-50/90 mt-1">{desc}</div></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="sektorler" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <SectionTitle eyebrow={c.sectorsEyebrow} title={c.sectorsTitle} desc={c.sectorsDesc} />
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          {c.sectorNames.map((name, i) => {
            const Icon = sectorIcons[i];
            return (
              <div key={name} className="rounded-2xl bg-slate-50 border border-slate-200 p-5 text-center hover:bg-emerald-50 transition">
                <Icon className="w-8 h-8 mx-auto text-[#2e7d32]" />
                <div className="font-bold text-slate-800 text-sm mt-3">{name}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="nasil-calisir" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <SectionTitle eyebrow={c.howEyebrow} title={c.howTitle} />
        <ol className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4">
          {c.steps.map((s, i) => (
            <li key={s.title} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="w-9 h-9 rounded-full bg-[#2e7d32] text-white font-black flex items-center justify-center">{i + 1}</div>
              <div className="font-extrabold text-slate-900 mt-3">{s.title}</div>
              <p className="text-sm text-slate-600 mt-1">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

export function TrustSections({ lang }: { lang: Language }) {
  const c = homeCopy[lang];
  return (
    <>
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <SectionTitle eyebrow={c.trustEyebrow} title={c.trustTitle} />
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {c.trust.map(({ title, desc }, i) => {
            const Icon = trustIcons[i];
            return (
              <div key={title} className="p-6 rounded-2xl border border-slate-200">
                <Icon className="w-8 h-8 text-[#2e7d32]" />
                <div className="font-extrabold text-slate-900 mt-3">{title}</div>
                <p className="text-sm text-slate-600 mt-1">{desc}</p>
              </div>
            );
          })}
        </div>
        <div className="max-w-5xl mx-auto mt-10 rounded-2xl bg-slate-50 border border-dashed border-slate-300 p-6 text-center">
          <BadgeCheck className="w-6 h-6 mx-auto text-slate-400" />
          <p className="text-sm text-slate-500 mt-2">{c.partnersNote}</p>
        </div>
      </section>

      <section id="sss" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <SectionTitle eyebrow={c.faqEyebrow} title={c.faqTitle} />
        <div className="max-w-3xl mx-auto space-y-3">
          {c.faqs.map((f) => (
            <details key={f.q} className="group bg-white rounded-2xl border border-slate-200 p-5">
              <summary className="font-bold text-slate-900 cursor-pointer list-none flex justify-between gap-4">{f.q}<span className="text-[#2e7d32] group-open:rotate-45 transition">+</span></summary>
              <p className="text-sm text-slate-600 mt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto rounded-3xl bg-slate-900 text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black">{c.bandTitle}</h2>
            <p className="text-slate-300 mt-2 text-sm sm:text-base">{c.bandDesc}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <a href="#contact-form" className="inline-flex justify-center items-center gap-2 bg-[#2e7d32] px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-[#1b5e20]"><Handshake className="w-4 h-4" /> {c.getQuote}</a>
            <Link href="/candidate" className="inline-flex justify-center items-center gap-2 bg-white text-slate-900 px-6 py-3.5 rounded-xl font-bold text-sm">{c.ctaJob}</Link>
          </div>
        </div>
      </section>
    </>
  );
}

export function CompanyAbout({ lang }: { lang: Language }) {
  const a = homeCopy[lang].about;
  const { turkey, bangladesh } = company;
  return (
    <section id="kurumsal" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200">
      <SectionTitle eyebrow={a.eyebrow} title={a.presenceTitle} desc={a.presenceDesc} />
      <ul className="max-w-3xl mx-auto mb-8 flex flex-wrap justify-center gap-2 text-sm font-bold">
        {company.presence.map((place, i) => (
          <li key={place.city} className="rounded-full bg-emerald-50 text-[#1b5e20] border border-emerald-100 px-4 py-2">
            {a.countries[i]} · {place.city}
          </li>
        ))}
      </ul>
      <dl className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
          <dt className="text-xs font-bold uppercase text-slate-400">{a.northMacedonia}</dt>
          <dd className="font-semibold text-slate-900 mt-1">{company.shortName}</dd>
          <dd className="text-slate-600 text-xs mt-1">{company.legalName}</dd>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
          <dt className="text-xs font-bold uppercase text-slate-400">{a.address}</dt>
          <dd className="font-semibold text-slate-900 mt-1">{company.address}</dd>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <dt className="text-xs font-bold uppercase text-slate-400">{a.email}</dt>
          <dd className="mt-1">
            <a className="font-semibold text-[#1b5e20]" href={`mailto:${company.email}`}>{company.email}</a>
          </dd>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <dt className="text-xs font-bold uppercase text-slate-400">{a.phone}</dt>
          <dd className="mt-1 space-y-1">
            {company.phones.map((p) => (
              <div key={p.tel}>
                <a className="font-semibold text-[#1b5e20]" href={`tel:${p.tel}`}>{p.display}</a>
              </div>
            ))}
          </dd>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <dt className="text-xs font-bold uppercase text-slate-400">{a.registry}</dt>
          <dd className="mt-1 text-slate-800">EMBS {company.embs}<br />{a.taxNo} {company.taxId}</dd>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <dt className="text-xs font-bold uppercase text-slate-400">{a.established}</dt>
          <dd className="mt-1 text-slate-800">{a.establishedValue}</dd>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
          <dt className="text-xs font-bold uppercase text-slate-400">{a.managers}</dt>
          <dd className="mt-1 font-semibold text-slate-900">{company.managers.join(' · ')}</dd>
          <dd className="text-slate-500 text-xs mt-2">{a.mkShort}: {company.shortNameMk}</dd>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
          <dt className="text-xs font-bold uppercase text-slate-400">{a.turkeyOffice} · {turkey.city}</dt>
          <dd className="mt-1 text-slate-800">
            {turkey.addressLines.map((line) => <span key={line} className="block">{line}</span>)}
          </dd>
          <dd className="mt-2">
            <a className="font-semibold text-[#1b5e20]" href={`mailto:${turkey.email}`}>{turkey.email}</a>
          </dd>
          <dd className="mt-1">
            <a className="font-semibold text-[#1b5e20]" href={`tel:${turkey.phone.tel}`}>{turkey.phone.display}</a>
          </dd>
          <dd className="mt-2 text-slate-600">{a.siteTaxOffice} · {a.vkn} {turkey.vkn}</dd>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
          <dt className="text-xs font-bold uppercase text-slate-400">{a.bangladeshOffice} · {bangladesh.city}</dt>
          <dd className="mt-1 text-slate-800">
            {bangladesh.addressLines.map((line) => <span key={line} className="block">{line}</span>)}
          </dd>
          <dd className="mt-2">
            <a className="font-semibold text-[#1b5e20]" href={`mailto:${bangladesh.email}`}>{bangladesh.email}</a>
          </dd>
          <dd className="mt-1">
            <a className="font-semibold text-[#1b5e20]" href={`tel:${bangladesh.phone.tel}`}>{bangladesh.phone.display}</a>
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function SiteFooter({ lang }: { lang: Language }) {
  const f = homeCopy[lang].footer;
  const a = homeCopy[lang].about;
  return (
    <footer className="bg-slate-950 text-slate-400 px-4 sm:px-6 lg:px-8 pt-14 pb-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="text-white font-black text-xl">PANOVA</div>
          <p className="text-sm text-white mt-3">{company.shortName}</p>
          <p className="text-xs mt-1">{a.countries.join(' · ')}</p>
          <p className="text-sm mt-3">{company.address}</p>
          <p className="text-sm mt-2">
            <a className="hover:text-white" href={`mailto:${company.email}`}>{company.email}</a>
          </p>
          <ul className="text-sm mt-2 space-y-1">
            {company.phones.map((p) => (
              <li key={p.tel}>
                <a className="hover:text-white" href={`tel:${p.tel}`}>{p.display}</a>
              </li>
            ))}
          </ul>
          <p className="text-sm text-white mt-4">{a.turkeyOffice}</p>
          {company.turkey.addressLines.map((line) => (
            <p key={line} className="text-sm">{line}</p>
          ))}
          <p className="text-sm mt-1">
            <a className="hover:text-white" href={`mailto:${company.turkey.email}`}>{company.turkey.email}</a>
          </p>
          <p className="text-sm">
            <a className="hover:text-white" href={`tel:${company.turkey.phone.tel}`}>{company.turkey.phone.display}</a>
          </p>
          <p className="text-xs mt-1">{a.siteTaxOffice} · {a.vkn} {company.turkey.vkn}</p>
          <p className="text-sm text-white mt-4">{a.bangladeshOffice}</p>
          {company.bangladesh.addressLines.map((line) => (
            <p key={line} className="text-sm">{line}</p>
          ))}
          <p className="text-sm mt-1">
            <a className="hover:text-white" href={`mailto:${company.bangladesh.email}`}>{company.bangladesh.email}</a>
          </p>
          <p className="text-sm">
            <a className="hover:text-white" href={`tel:${company.bangladesh.phone.tel}`}>{company.bangladesh.phone.display}</a>
          </p>
        </div>
        <div>
          <div className="text-white font-bold mb-3">{f.employers}</div>
          <ul className="space-y-2 text-sm">
            <li><a href="/#isverenler" className="hover:text-white">{f.services}</a></li>
            <li><Link href="/employer-login" className="hover:text-white">{f.employerLogin}</Link></li>
            <li><a href="/#contact-form" className="hover:text-white">{f.quote}</a></li>
          </ul>
        </div>
        <div>
          <div className="text-white font-bold mb-3">{f.candidates}</div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/candidate" className="hover:text-white">{f.apply}</Link></li>
            <li><a href="/#sektorler" className="hover:text-white">{f.sectors}</a></li>
            <li><a href="/#sss" className="hover:text-white">{f.faq}</a></li>
          </ul>
        </div>
        <div>
          <div className="text-white font-bold mb-3">{f.corporate}</div>
          <ul className="space-y-2 text-sm">
            <li><a href="/#kurumsal" className="hover:text-white">{f.registry}</a></li>
            <li><a href="/#nasil-calisir" className="hover:text-white">{f.how}</a></li>
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
