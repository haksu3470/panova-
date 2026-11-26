'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Droplets, Sprout, Users, Truck, Milk, Beef, Egg, Handshake, Landmark, PackageCheck, Send } from 'lucide-react';
import { SiteFooter } from '@/components/home/HomeSections';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';
import KvkkConsent from '@/components/site/KvkkConsent';
import { company } from '@/lib/company';
import { releaseCopy } from '@/lib/release-copy';
import { useSiteLanguage } from '@/lib/site-language';
import { tarimCopy } from '@/lib/tarim-copy';

const IMG = (name: string) => `/tarim/${name}.jpg`;
const WHY_ICONS = [Sprout, Droplets, Users, Truck];
const LIVESTOCK_ICONS = [Milk, Beef, Egg];
const MODEL_ICONS = [Handshake, Landmark, PackageCheck];
const PRODUCE = ['kapya-biber-tarlasi', 'kapya-biber-hasat', 'kavun-yakin', 'kavun-kasa', 'kavun-hasat-yigini'];
const BANGLADESH = ['bangladesh-egitim', 'bangladesh-sera-fide', 'bangladesh-ekim-makinesi', 'bangladesh-silaj-hasadi'];

function Figure({ name, caption, className = '' }: { name: string; caption: string; className?: string }) {
  return (
    <figure className={`relative overflow-hidden rounded-2xl bg-slate-200 ${className}`}>
      <img src={IMG(name)} alt={caption} loading="lazy" className="h-full w-full object-cover" />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 text-xs sm:text-sm font-semibold text-white">
        {caption}
      </figcaption>
    </figure>
  );
}

export default function TarimView() {
  const { currentLang, changeLanguage } = useSiteLanguage();
  const c = tarimCopy[currentLang] ?? tarimCopy.en;
  const k = c.contact;
  // Arapça seçiliyken metin İngilizce gösterildiği için yön soldan sağa kalır.
  const dir = 'ltr';

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

  const input = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white text-base sm:text-sm focus:ring-2 focus:ring-[#2e7d32] outline-none';
  const label = 'block text-xs font-bold text-slate-700 mb-1';

  return (
    <div className="min-h-screen overflow-x-clip bg-stone-50 text-slate-900" dir={dir}>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:h-20 sm:px-6 lg:px-8">
          <Link href="/" title="Ana sayfa" className="flex min-w-0 items-center gap-3 hover:opacity-90">
            <img src="/logo.png" alt="PANOVA" width={1051} height={725} className="h-10 w-auto shrink-0 object-contain sm:h-14" />
            <span className="min-w-0">
              <span className="block text-lg font-extrabold leading-none tracking-tight sm:text-xl">PANOVA</span>
              <span className="hidden truncate text-[11px] font-bold text-muted-foreground sm:block">{c.groupNav.agri}</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageSwitcher currentLang={currentLang} onChange={changeLanguage} />
            <a href="#teklif" className="hidden items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 sm:inline-flex">
              <Send aria-hidden className="h-3.5 w-3.5" /> {c.hero.cta}
            </a>
          </div>
        </div>
        {/* Grup bölümleri: Tarım bu sayfa; diğerleri hazırlanıyor */}
        <nav aria-label="Panova Group" className="border-t border-slate-100">
          <ul className="mx-auto flex max-w-7xl flex-nowrap gap-1 overflow-x-auto whitespace-nowrap px-3 py-1.5 text-xs font-semibold sm:px-6 sm:text-sm lg:px-8">
            <li><Link href="/" className="block rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">{c.groupNav.hr}</Link></li>
            <li><span aria-current="page" className="block rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">{c.groupNav.agri}</span></li>
            {[c.groupNav.construction, c.groupNav.trade, c.groupNav.social].map((name) => (
              <li key={name}>
                <span className="block cursor-default px-3 py-2 text-slate-400">
                  {name} <span className="text-[10px] font-normal">· {c.groupNav.soon}</span>
                </span>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Kapak */}
      <section className="relative isolate min-h-[560px] overflow-hidden text-white sm:min-h-[640px]">
        <img src={IMG('kapak-kavun-tarlasi')} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
        <div className="mx-auto flex max-w-7xl flex-col justify-end gap-8 px-4 pb-10 pt-24 sm:px-6 sm:pb-14 lg:px-8 min-h-[560px] sm:min-h-[640px]">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-bold text-emerald-200 sm:text-sm">{c.hero.eyebrow}</p>
            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl text-balance">{c.hero.title}</h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 sm:text-lg">{c.hero.lead}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#teklif" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-solid px-6 py-3.5 text-sm font-bold text-white hover:bg-brand">
                <Send aria-hidden className="h-4 w-4" /> {c.hero.cta}
              </a>
              <a href="#altyapi" className="inline-flex items-center justify-center rounded-xl bg-white/95 px-6 py-3.5 text-sm font-bold text-slate-900 hover:bg-white">
                {c.hero.ctaSecondary}
              </a>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {c.hero.facts.map((f) => (
              <div key={f.label} className="rounded-2xl border border-white/20 bg-black/35 px-4 py-3 backdrop-blur-sm">
                <dt className="text-xl font-black sm:text-2xl whitespace-nowrap">{f.value}</dt>
                <dd className="text-xs text-white/80 sm:text-sm">{f.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Neden Makedonya */}
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 sm:py-20">
        <div>
          <h2 className="text-2xl font-black tracking-tight sm:text-4xl">{c.why.title}</h2>
          <p className="mt-3 text-slate-600 sm:text-lg">{c.why.lead}</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {c.why.points.map((p, i) => {
              const Icon = WHY_ICONS[i];
              return (
                <li key={p.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <Icon aria-hidden className="mb-2 h-6 w-6 text-brand" />
                  <p className="font-bold">{p.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{p.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Figure name="struga-ovasi-ekip" caption="Struga" className="col-span-2 aspect-[4/3]" />
          <Figure name="malcli-siralar" caption={c.why.points[0].title} className="aspect-[4/3]" />
          <Figure name="biber-sira-dag" caption={c.produce.captions['kapya-biber-tarlasi']} className="aspect-[4/3]" />
        </div>
      </section>

      {/* Altyapı */}
      <section id="altyapi" className="scroll-mt-32 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black tracking-tight sm:text-4xl">{c.infra.title}</h2>
          <p className="mt-3 max-w-2xl text-slate-600 sm:text-lg">{c.infra.lead}</p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {c.infra.items.map((it) => (
              <article key={it.img} className="overflow-hidden rounded-2xl border border-slate-200 bg-stone-50">
                <img src={IMG(it.img)} alt={it.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <div className="p-3 sm:p-4">
                  <h3 className="text-sm font-bold sm:text-base">{it.title}</h3>
                  <p className="mt-1 text-[13px] text-slate-600 sm:text-sm">{it.text}</p>
                </div>
              </article>
            ))}
          </div>

          <h3 className="mt-14 text-xl font-black sm:text-2xl">{c.video.title}</h3>
          <div className="mt-5 flex flex-wrap justify-center gap-4 sm:justify-start">
            {[
              { src: 'viyol-ekim', title: c.video.seed },
              { src: 'fide-dikim', title: c.video.planting },
            ].map((v) => (
              <figure key={v.src} className="w-full max-w-[340px] overflow-hidden rounded-2xl bg-black">
                <video
                  className="aspect-[9/16] w-full bg-black object-cover"
                  src={`/tarim/${v.src}.mp4`}
                  poster={`/tarim/${v.src}-poster.jpg`}
                  controls
                  muted
                  playsInline
                  preload="none"
                />
                <figcaption className="bg-slate-900 px-4 py-3 text-sm font-semibold text-white">{v.title}</figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{c.video.note}</p>
        </div>
      </section>

      {/* Ürünler */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 sm:py-20">
        <h2 className="text-2xl font-black tracking-tight sm:text-4xl">{c.produce.title}</h2>
        <p className="mt-3 max-w-3xl text-slate-600 sm:text-lg">{c.produce.lead}</p>
        <div className="mt-8 grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] lg:grid-cols-4">
          {PRODUCE.map((name, i) => (
            <Figure key={name} name={name} caption={c.produce.captions[name]} className={i === 0 ? 'col-span-2 row-span-2' : ''} />
          ))}
        </div>
      </section>

      {/* Bangladeş */}
      <section className="bg-emerald-950 py-14 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-5 lg:items-center lg:px-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-black tracking-tight sm:text-4xl">{c.bangladesh.title}</h2>
            <p className="mt-3 text-white/80 sm:text-lg">{c.bangladesh.lead}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:col-span-3">
            {BANGLADESH.map((name) => (
              <Figure key={name} name={name} caption={c.bangladesh.captions[name]} className="aspect-[4/3]" />
            ))}
          </div>
        </div>
      </section>

      {/* Hayvancılık + çalışma modelleri */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 sm:py-20">
        <h2 className="text-2xl font-black tracking-tight sm:text-4xl">{c.livestock.title}</h2>
        <p className="mt-3 max-w-2xl text-slate-600 sm:text-lg">{c.livestock.lead}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {c.livestock.cards.map((card, i) => {
            const Icon = LIVESTOCK_ICONS[i];
            return (
              <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <Icon aria-hidden className="mb-3 h-8 w-8 text-amber-600" />
                <h3 className="font-bold">{card.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{card.text}</p>
              </div>
            );
          })}
        </div>

        <h2 className="mt-16 text-2xl font-black tracking-tight sm:text-4xl">{c.models.title}</h2>
        <p className="mt-3 max-w-2xl text-slate-600 sm:text-lg">{c.models.lead}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {c.models.cards.map((card, i) => {
            const Icon = MODEL_ICONS[i];
            return (
              <div key={card.title} className="rounded-2xl bg-slate-900 p-5 text-white">
                <Icon aria-hidden className="mb-3 h-8 w-8 text-emerald-300" />
                <h3 className="font-bold">{card.title}</h3>
                <p className="mt-1 text-sm text-white/75">{card.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Biz kimiz */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black tracking-tight sm:text-4xl">{c.team.title}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {c.team.people.map((p) => (
              <div key={p.name} className="rounded-2xl border border-slate-200 bg-stone-50 p-5">
                <p className="text-lg font-black">{p.name}</p>
                <p className="text-sm font-semibold text-brand">{p.role}</p>
                <p className="mt-2 text-sm text-slate-600">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teklif formu */}
      <section id="teklif" className="scroll-mt-32 mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-5 lg:px-8 sm:py-20">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-black tracking-tight sm:text-4xl">{k.title}</h2>
          <p className="mt-3 text-slate-600 sm:text-lg">{k.lead}</p>
          <div className="mt-6 space-y-1.5 rounded-2xl border border-slate-200 bg-white p-5 text-sm">
            <p className="font-bold">{k.direct}</p>
            <p>{company.shortName} · Struga</p>
            <p><a className="font-semibold text-brand" href={`mailto:${company.email}`}>{company.email}</a></p>
            {company.phones.map((p) => (
              <p key={p.tel}><a className="font-semibold text-brand whitespace-nowrap" href={`tel:${p.tel}`}>{p.display}</a></p>
            ))}
          </div>
        </div>
        <div className="lg:col-span-3">
          {state === 'done' ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
              <CheckCircle2 aria-hidden className="mx-auto mb-3 h-12 w-12 text-brand" />
              <p className="text-lg font-extrabold text-emerald-900">{k.successTitle}</p>
              <p className="text-sm text-emerald-800">{k.successText}</p>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-7">
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
                <p role="alert" className="sm:col-span-2 text-sm font-semibold text-red-700">
                  {kvkk ? k.error : releaseCopy[currentLang].kvkkRequired}
                </p>
              )}
              <button
                type="submit"
                disabled={state === 'sending'}
                className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-solid py-3.5 text-sm font-bold text-white hover:bg-brand disabled:opacity-60"
              >
                <Send aria-hidden className="h-4 w-4" /> {state === 'sending' ? k.submitting : k.submit}
              </button>
            </form>
          )}
        </div>
      </section>

      <SiteFooter lang={currentLang} />
    </div>
  );
}
