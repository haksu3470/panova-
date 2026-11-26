'use client';

import { useRef, useState, type CSSProperties } from 'react';
import {
  ArrowRight, CheckCircle2, Droplets, Sprout, Users, Truck, Milk, Beef, Egg, Handshake, Landmark,
  PackageCheck, Send, Cpu, MapPinned, GraduationCap, MessageSquareText, HeartHandshake, Factory,
  Tractor, Warehouse, Wheat, MapPin, Play,
} from 'lucide-react';
import { SiteFooter } from '@/components/home/HomeSections';
import { CountUp, useHomeMotion } from '@/components/home/HomeMotion';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';
import { GroupBrand, GroupStrip } from '@/components/site/GroupSwitcher';
import KvkkConsent from '@/components/site/KvkkConsent';
import { company } from '@/lib/company';
import { releaseCopy } from '@/lib/release-copy';
import { useSiteLanguage } from '@/lib/site-language';
import { tarimCopy } from '@/lib/tarim-copy';

const IMG = (name: string) => `/tarim/${name}.jpg`;
const WHY_ICONS = [Sprout, Droplets, Users, Truck];
const FACT_ICONS = [MapPin, Warehouse, Wheat, Tractor];
const PROCESS_ICONS = [Sprout, Tractor, Droplets, PackageCheck];
const LIVESTOCK_ICONS = [Milk, Beef, Egg];
const MODEL_ICONS = [Handshake, Landmark, PackageCheck];
const TEAM_ICONS = [Cpu, MapPinned, Factory, GraduationCap, MessageSquareText];
const PRODUCE = ['kapya-biber-tarlasi', 'kapya-biber-hasat', 'kavun-yakin', 'kavun-kasa', 'kavun-hasat-yigini'];
const BANGLADESH = ['bangladesh-egitim', 'bangladesh-sera-fide', 'bangladesh-ekim-makinesi', 'bangladesh-silaj-hasadi'];

/** HR ana sayfasıyla aynı kart hareketi ve görünme gecikmesi. */
const CARD_HOVER = 'transition duration-200 hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0';
const revealDelay = (index: number) => ({ '--reveal-delay': `${index * 90}ms` }) as CSSProperties;

function SectionTitle({ eyebrow, title, desc, dark = false }: { eyebrow: string; title: string; desc?: string; dark?: boolean }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
      <span className={`text-xs font-bold uppercase tracking-widest ${dark ? 'text-emerald-200' : 'text-brand'}`}>{eyebrow}</span>
      <h2 className={`mt-2 text-2xl font-black tracking-tight sm:text-4xl ${dark ? 'text-on-dark' : 'text-slate-900'}`}>{title}</h2>
      {desc ? <p className={`mt-3 text-sm leading-relaxed sm:text-base ${dark ? 'text-on-dark-muted' : 'text-slate-600'}`}>{desc}</p> : null}
    </div>
  );
}

function Photo({ name, caption, className = '' }: { name: string; caption: string; className?: string }) {
  return (
    <figure className={`group relative overflow-hidden rounded-2xl bg-slate-200 ${className}`}>
      <img src={IMG(name)} alt={caption} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-10 text-xs font-bold text-white sm:text-sm">
        {caption}
      </figcaption>
    </figure>
  );
}

export default function TarimView() {
  const { currentLang, changeLanguage } = useSiteLanguage();
  const c = tarimCopy[currentLang] ?? tarimCopy.en;
  const k = c.contact;
  const rootRef = useRef<HTMLDivElement>(null);
  useHomeMotion(rootRef, [currentLang]);

  const [form, setForm] = useState({ product: '', quantity: '', season: '', fullName: '', email: '', phone: '', notes: '' });
  const [kvkk, setKvkk] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kvkk) {
      setState('error');
      return;
    }
    setState('sending');
    const notes = [
      `${k.product}: ${form.product}`,
      `${k.quantity}: ${form.quantity}`,
      `${k.season}: ${form.season}`,
      form.notes ? `${k.notes}: ${form.notes}` : '',
    ].filter(Boolean).join('\n');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyKey: 'agriculture',
          companyName: 'Panova Tarım ve Hayvancılık',
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          notes,
          locale: currentLang,
          kvkkAccepted: true,
        }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  };

  const input = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium text-base sm:text-sm focus:ring-2 focus:ring-[#2e7d32] outline-none';
  const label = 'block text-xs font-bold text-slate-700 uppercase mb-1';
  const unitName = c.hero.eyebrow.split(' · ')[0];

  return (
    // Arapça seçiliyken metin İngilizce gösterildiği için yön soldan sağa kalır.
    <div ref={rootRef} dir="ltr" className="min-h-screen overflow-x-clip bg-slate-50 font-sans text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <GroupStrip active="agri" lang={currentLang} />
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:h-20 sm:px-6 lg:px-8">
          <GroupBrand active="agri" lang={currentLang} />
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageSwitcher currentLang={currentLang} onChange={changeLanguage} />
            <a href="#teklif" className="hidden items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 sm:inline-flex">
              <Send aria-hidden className="h-3.5 w-3.5" /> {c.hero.cta}
            </a>
          </div>
        </div>
      </header>

      {/* Kapak: HR ile aynı koyu zemin, sağda çerçeveli fotoğraf ve iş akışı kartı */}
      <section className="relative overflow-hidden bg-slate-900 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 px-4 py-12 text-white sm:px-6 sm:py-20 lg:px-8">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(46,125,50,0.4),transparent_60%),radial-gradient(circle_at_bottom_left,rgba(124,179,66,0.16),transparent_55%)]" />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div className="text-center lg:text-start">
            <span className="mb-4 inline-block rounded-full border border-emerald-800 bg-emerald-950 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-300">
              {unitName}
            </span>
            <h1 className="mb-4 text-3xl font-black leading-tight tracking-tight sm:mb-6 sm:text-5xl text-balance">{c.hero.title}</h1>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-on-dark-muted sm:text-lg lg:mx-0">{c.hero.lead}</p>
            <p className="mt-4 text-xs font-semibold text-emerald-200 sm:text-sm">{c.heroCard.place}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <a href="#teklif" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-solid px-6 py-3.5 text-sm font-bold text-on-dark hover:bg-brand">
                <Send aria-hidden className="h-4 w-4" /> {c.hero.cta}
              </a>
              <a href="#altyapi" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-900 hover:bg-slate-100">
                {c.hero.ctaSecondary} <ArrowRight aria-hidden className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl pb-10 sm:pb-6">
            <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
              <img src={IMG('kapak-kavun-tarlasi')} alt={c.heroCard.place} className="aspect-[4/3] w-full object-cover" />
            </div>
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
              <MapPin aria-hidden className="h-3.5 w-3.5 text-emerald-300" /> Struga
            </span>
            <div className="absolute bottom-0 left-3 right-3 rounded-2xl bg-white p-4 text-slate-900 shadow-xl sm:left-auto sm:right-6 sm:w-80">
              <p className="text-xs font-bold uppercase tracking-widest text-brand">{c.heroCard.flowTitle}</p>
              <ol className="relative mt-3 grid grid-cols-4 gap-1">
                <span aria-hidden className="absolute left-[12%] right-[12%] top-3.5 h-0.5 bg-emerald-200" />
                {c.heroCard.flow.map((step, i) => (
                  <li key={step} className="relative flex flex-col items-center text-center">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-solid text-xs font-black text-white ring-4 ring-white">{i + 1}</span>
                    <span className="mt-1.5 text-[11px] font-bold leading-tight text-slate-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
        <nav aria-label={c.eyebrow.contact} className="relative z-10 mx-auto mt-12 max-w-7xl">
          <ul className="flex flex-nowrap gap-x-5 gap-y-2 overflow-x-auto whitespace-nowrap pb-2 text-xs font-semibold text-on-dark-muted sm:flex-wrap sm:justify-center sm:text-sm">
            <li><a href="#neden" className="hover:text-white">{c.nav.why}</a></li>
            <li><a href="#altyapi" className="hover:text-white">{c.nav.infra}</a></li>
            <li><a href="#surec" className="hover:text-white">{c.nav.process}</a></li>
            <li><a href="#urunler" className="hover:text-white">{c.nav.produce}</a></li>
            <li><a href="#is-birligi" className="hover:text-white">{c.nav.models}</a></li>
            <li><a href="#biz-kimiz" className="hover:text-white">{c.nav.team}</a></li>
            <li><a href="#teklif" className="hover:text-white">{c.nav.contact}</a></li>
          </ul>
        </nav>
      </section>

      {/* Rakamlar: HR'deki istatistik bandı */}
      <section className="border-b border-slate-200 bg-white">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 items-stretch gap-3 px-4 py-8 sm:gap-6 sm:px-6 lg:grid-cols-4 lg:px-8">
          {c.hero.facts.map((f, i) => {
            const Icon = FACT_ICONS[i];
            const [num, ...rest] = f.value.split(' ');
            return (
              <li key={f.label} className="flex h-full min-w-0 flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
                  <Icon aria-hidden className="h-5 w-5 text-brand" />
                </span>
                <div className="min-w-0">
                  <div className="whitespace-nowrap text-[clamp(1.25rem,6vw,1.875rem)] font-black leading-tight text-brand tabular-nums">
                    <CountUp value={num} />{rest.length ? ` ${rest.join(' ')}` : ''}
                  </div>
                  <div className="text-xs font-semibold text-slate-700 sm:text-sm">{f.label}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Neden Makedonya */}
      <section id="neden" className="scroll-mt-28 sm:scroll-mt-32 bg-slate-50 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <SectionTitle eyebrow={c.eyebrow.why} title={c.why.title} desc={c.why.lead} />
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2 lg:items-center">
          <div className="grid gap-4 sm:grid-cols-2">
            {c.why.points.map((p, i) => {
              const Icon = WHY_ICONS[i];
              return (
                <div key={p.title} style={revealDelay(i)} className={`home-reveal rounded-2xl border border-slate-200 bg-white p-6 hover:border-emerald-200 ${CARD_HOVER}`}>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50"><Icon aria-hidden className="h-6 w-6 text-brand" /></div>
                  <h3 className="text-lg font-extrabold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.text}</p>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Photo name="struga-ovasi-ekip" caption={c.heroCard.place} className="col-span-2 aspect-[16/10]" />
            <Photo name="malcli-siralar" caption={c.why.points[0].title} className="aspect-[4/3]" />
            <Photo name="biber-sira-dag" caption={c.produce.captions['kapya-biber-tarlasi']} className="aspect-[4/3]" />
          </div>
        </div>
      </section>

      {/* Altyapı */}
      <section id="altyapi" className="scroll-mt-28 sm:scroll-mt-32 bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <SectionTitle eyebrow={c.eyebrow.infra} title={c.infra.title} desc={c.infra.lead} />
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {c.infra.items.map((it, i) => (
            <article key={it.img} style={revealDelay(i % 4)} className={`home-reveal group overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-emerald-200 ${CARD_HOVER} ${i === 0 ? 'col-span-2 lg:row-span-2' : ''} ${i === c.infra.items.length - 1 ? 'lg:col-span-2' : ''}`}>
              <div className="overflow-hidden">
                <img src={IMG(it.img)} alt={it.title} loading="lazy" className={`w-full object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none ${i === 0 ? 'aspect-[4/3] lg:aspect-square' : i === c.infra.items.length - 1 ? 'aspect-[4/3] lg:aspect-[8/3]' : 'aspect-[4/3]'}`} />
              </div>
              <div className="p-4 sm:p-5">
                <h3 className="text-sm font-extrabold sm:text-lg">{it.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-600 sm:text-sm">{it.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Süreç: HR'deki koyu zaman çizelgesi + videolar */}
      <section id="surec" className="scroll-mt-28 sm:scroll-mt-32 bg-slate-900 px-4 py-16 text-on-dark sm:px-6 sm:py-24 lg:px-8">
        <SectionTitle eyebrow={c.eyebrow.process} title={c.process.title} desc={c.process.lead} dark />
        <div className="relative mx-auto max-w-6xl">
          <div aria-hidden className="absolute bottom-3 start-[1.125rem] top-3 w-0.5 bg-emerald-700 md:bottom-auto md:end-[12%] md:start-[12%] md:top-[1.125rem] md:h-0.5 md:w-auto" />
          <ol className="relative grid gap-8 md:grid-cols-4 md:gap-4">
            {c.process.steps.map((s, i) => {
              const Icon = PROCESS_ICONS[i];
              return (
                <li key={s.title} style={revealDelay(i)} className="home-reveal flex gap-4 md:flex-col md:items-center md:text-center">
                  <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-solid text-on-dark ring-4 ring-slate-900">
                    <Icon aria-hidden className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-on-dark">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-on-dark-muted">{s.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="mx-auto mt-14 flex max-w-4xl flex-wrap justify-center gap-6">
          {[
            { src: 'viyol-ekim', title: c.video.seed },
            { src: 'fide-dikim', title: c.video.planting },
          ].map((v, i) => (
            <figure key={v.src} style={revealDelay(i)} className="home-reveal w-full max-w-[320px] overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
              <video
                className="aspect-[9/16] w-full bg-black object-cover"
                src={`/tarim/${v.src}.mp4`}
                poster={`/tarim/${v.src}-poster.jpg`}
                controls
                muted
                playsInline
                preload="none"
              />
              <figcaption className="flex items-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white">
                <Play aria-hidden className="h-4 w-4 text-emerald-300" /> {v.title}
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-on-dark-muted">{c.video.note}</p>
      </section>

      {/* Ürünler */}
      <section id="urunler" className="scroll-mt-28 sm:scroll-mt-32 bg-slate-50 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <SectionTitle eyebrow={c.eyebrow.produce} title={c.produce.title} desc={c.produce.lead} />
        <div className="mx-auto grid max-w-7xl auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[230px] sm:gap-4 lg:grid-cols-4">
          {PRODUCE.map((name, i) => (
            <Photo key={name} name={name} caption={c.produce.captions[name]} className={i === 0 ? 'col-span-2 row-span-2' : ''} />
          ))}
        </div>
      </section>

      {/* Bangladeş: HR'deki yeşil degrade bölüm */}
      <section className="bg-brand bg-gradient-to-br from-brand to-emerald-800 px-4 py-16 text-on-dark sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-200">{c.eyebrow.bangladesh}</span>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">{c.bangladesh.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-emerald-50 sm:text-base">{c.bangladesh.lead}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {BANGLADESH.map((name, i) => (
              <div key={name} style={revealDelay(i)} className="home-reveal">
                <Photo name={name} caption={c.bangladesh.captions[name]} className="aspect-[4/3] ring-1 ring-white/20" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* İş birliği modelleri + hayvancılık */}
      <section id="is-birligi" className="scroll-mt-28 sm:scroll-mt-32 bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <SectionTitle eyebrow={c.eyebrow.models} title={c.models.title} desc={c.models.lead} />
        <div className="mx-auto grid max-w-7xl gap-4 sm:gap-6 md:grid-cols-3">
          {c.models.cards.map((card, i) => {
            const Icon = MODEL_ICONS[i];
            return (
              <div key={card.title} style={revealDelay(i)} className={`home-reveal relative rounded-2xl border border-slate-200 bg-white p-6 hover:border-emerald-200 ${CARD_HOVER}`}>
                <span aria-hidden className="absolute right-5 top-4 text-4xl font-black text-slate-100">{i + 1}</span>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50"><Icon aria-hidden className="h-6 w-6 text-brand" /></div>
                <h3 className="text-lg font-extrabold">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.text}</p>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-16 max-w-7xl rounded-3xl border border-amber-200 bg-amber-50/60 p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-3 lg:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700">{c.eyebrow.livestock}</span>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{c.livestock.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{c.livestock.lead}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
              {c.livestock.cards.map((card, i) => {
                const Icon = LIVESTOCK_ICONS[i];
                return (
                  <div key={card.title} style={revealDelay(i)} className={`home-reveal rounded-2xl border border-amber-100 bg-white p-5 ${CARD_HOVER}`}>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100"><Icon aria-hidden className="h-6 w-6 text-amber-700" /></div>
                    <h3 className="font-extrabold">{card.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{card.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Biz kimiz */}
      <section id="biz-kimiz" className="scroll-mt-28 sm:scroll-mt-32 bg-slate-50 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <SectionTitle eyebrow={c.eyebrow.team} title={c.team.title} desc={c.team.lead} />
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {c.team.pillars.map((p, i) => {
            const Icon = TEAM_ICONS[i];
            return (
              <div key={p.title} style={revealDelay(i % 3)} className={`home-reveal rounded-2xl border border-slate-200 bg-white p-6 hover:border-emerald-200 ${CARD_HOVER}`}>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50"><Icon aria-hidden className="h-6 w-6 text-brand" /></div>
                <h3 className="text-lg font-extrabold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.text}</p>
              </div>
            );
          })}
          <div className="home-reveal flex flex-col justify-center rounded-2xl bg-slate-900 p-6 text-on-dark">
            <HeartHandshake aria-hidden className="mb-3 h-8 w-8 text-emerald-300" />
            <p className="text-lg font-extrabold leading-snug">{c.team.closing}</p>
          </div>
        </div>
      </section>

      {/* Teklif formu: HR'deki iletişim kartı düzeni */}
      <section id="teklif" className="scroll-mt-28 sm:scroll-mt-32 bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">{c.eyebrow.contact}</span>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">{k.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{k.lead}</p>
            <div className="mt-6 space-y-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
              <p className="font-extrabold text-slate-900">{k.direct}</p>
              <p>{company.shortName} · Struga</p>
              <p>{company.address}</p>
              <p><a className="font-semibold text-brand" href={`mailto:${company.email}`}>{company.email}</a></p>
              {company.phones.map((p) => (
                <p key={p.tel}><a className="whitespace-nowrap font-semibold text-brand" href={`tel:${p.tel}`}>{p.display}</a></p>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7">
            {state === 'done' ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
                <CheckCircle2 aria-hidden className="mx-auto mb-3 h-12 w-12 text-brand" />
                <p className="text-lg font-extrabold text-emerald-900">{k.successTitle}</p>
                <p className="text-sm text-emerald-800">{k.successText}</p>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:grid-cols-2 sm:p-8">
                <div className="sm:col-span-2">
                  <label htmlFor="t-product" className={label}>{k.product}</label>
                  <input id="t-product" required value={form.product} onChange={set('product')} placeholder={k.productPh} className={input} />
                </div>
                <div>
                  <label htmlFor="t-qty" className={label}>{k.quantity}</label>
                  <input id="t-qty" value={form.quantity} onChange={set('quantity')} placeholder={k.quantityPh} className={input} />
                </div>
                <div>
                  <label htmlFor="t-season" className={label}>{k.season}</label>
                  <input id="t-season" value={form.season} onChange={set('season')} placeholder={k.seasonPh} className={input} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="t-name" className={label}>{k.name}</label>
                  <input id="t-name" required value={form.fullName} onChange={set('fullName')} className={input} />
                </div>
                <div>
                  <label htmlFor="t-email" className={label}>{k.email}</label>
                  <input id="t-email" type="email" required value={form.email} onChange={set('email')} className={input} />
                </div>
                <div>
                  <label htmlFor="t-phone" className={label}>{k.phone}</label>
                  <input id="t-phone" type="tel" required value={form.phone} onChange={set('phone')} className={input} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="t-notes" className={label}>{k.notes}</label>
                  <textarea id="t-notes" rows={3} value={form.notes} onChange={set('notes')} className={input} />
                </div>
                <div className="sm:col-span-2">
                  <KvkkConsent id="tarim-kvkk" checked={kvkk} onChange={setKvkk} copy={releaseCopy[currentLang]} />
                </div>
                {state === 'error' && (
                  <p role="alert" className="text-sm font-semibold text-red-700 sm:col-span-2">
                    {kvkk ? k.error : releaseCopy[currentLang].kvkkRequired}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={state === 'sending'}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-solid py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-brand disabled:opacity-60 sm:col-span-2"
                >
                  <Send aria-hidden className="h-4 w-4" /> {state === 'sending' ? k.submitting : k.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <SiteFooter lang={currentLang} />
    </div>
  );
}
