import Link from 'next/link';
import {
  Users, Building2, ShieldCheck, FileCheck2, Plane, ClipboardCheck, Search, Handshake,
  HardHat, Sprout, Factory, Truck, Hotel, Stethoscope, Wrench, ShoppingBag,
  Award, Globe2, Clock, BadgeCheck, ArrowRight, Briefcase, GraduationCap, HeartHandshake,
} from 'lucide-react';
import { company } from '@/lib/company';

const stats = [
  { value: '4', label: 'Grup şirketi' },
  { value: 'TR + AB', label: 'Hizmet koridoru' },
  { value: '8+', label: 'Ana sektör' },
  { value: '30/60/90', label: 'Gün işe uyum takibi' },
];

const employerServices = [
  { icon: Search, title: 'Yurt Dışı Personel Temini', desc: 'AB ve Türkiye için sertifikalı, akredite yetkinliğe sahip aday havuzundan hızlı kısa liste.' },
  { icon: Users, title: 'Toplu & Proje Bazlı İşe Alım', desc: 'İnşaat, tarım ve üretim projeleri için ekip bazlı planlama ve dalga dalga yerleştirme.' },
  { icon: FileCheck2, title: 'Belge & Sertifika Doğrulama', desc: 'Diploma, ustalık belgesi, sağlık ve sabıka kayıtlarının dijital takibi ve kontrolü.' },
  { icon: ClipboardCheck, title: 'Resmî Süreç Yönetimi', desc: 'Çalışma izni, vize ve konsolosluk adımlarının uçtan uca takibi.' },
  { icon: Plane, title: 'Seyahat & Karşılama', desc: 'Bilet, transfer, konaklama ve işe ilk gün organizasyonu.' },
  { icon: HeartHandshake, title: 'İşe Uyum & Takip', desc: '30/60/90 gün değerlendirmeleriyle kalıcılığı ölçen yerleştirme sonrası destek.' },
];

const candidateItems = [
  { icon: Briefcase, title: 'Yurt dışı iş fırsatları', desc: 'AB ve Türkiye’deki doğrulanmış işverenlerin açık pozisyonları.' },
  { icon: GraduationCap, title: 'Sertifika & kariyer desteği', desc: 'Belgelerinizi tek profilde toplayın, eksiklerinizi görün.' },
  { icon: ShieldCheck, title: 'Ücretsiz ve güvenli başvuru', desc: 'Kişisel verileriniz KVKK/GDPR ilkelerine uygun korunur.' },
];

const sectors = [
  { icon: HardHat, name: 'İnşaat & Altyapı' },
  { icon: Sprout, name: 'Tarım & Seracılık' },
  { icon: Factory, name: 'Üretim & Sanayi' },
  { icon: Wrench, name: 'Kaynak & Teknik Ustalık' },
  { icon: Truck, name: 'Lojistik & Depo' },
  { icon: Hotel, name: 'Turizm & Otelcilik' },
  { icon: Stethoscope, name: 'Sağlık & Bakım' },
  { icon: ShoppingBag, name: 'Perakende & Hizmet' },
];

const steps = [
  { title: 'Talep', desc: 'İşveren pozisyon, adet ve yetkinlik ihtiyacını iletir.' },
  { title: 'Eşleştirme', desc: 'Sertifikalı havuzdan uygun adaylar kısa listelenir.' },
  { title: 'Görüşme', desc: 'Online veya yüz yüze mülakat; iş teklifi hazırlanır.' },
  { title: 'Resmî Süreç', desc: 'İzin, vize ve belgeler dijital olarak takip edilir.' },
  { title: 'Yerleştirme', desc: 'Seyahat, karşılama ve 30/60/90 gün uyum takibi.' },
];

const trust = [
  { icon: Award, title: 'Akredite yetkinlik odağı', desc: 'Adaylar mesleki belge ve sertifikalarıyla değerlendirilir.' },
  { icon: ShieldCheck, title: 'Veri güvenliği', desc: 'Rol bazlı erişim, denetim kaydı (audit log) ve şifreli giriş.' },
  { icon: Globe2, title: 'Çok dilli iletişim', desc: 'Türkçe, İngilizce, Arnavutça ve Arapça destek.' },
  { icon: Clock, title: 'Şeffaf süreç', desc: 'İşveren ve aday her adımı portaldan anlık izler.' },
];

const faqs = [
  { q: 'Adaylar başvuru için ücret öder mi?', a: 'Hayır. Aday başvurusu ve profil oluşturma ücretsizdir.' },
  { q: 'Hangi ülkelere personel temin ediyorsunuz?', a: 'Öncelikli olarak Türkiye ve Avrupa Birliği ülkelerindeki işverenlere hizmet veriyoruz.' },
  { q: 'Bir işe alım süreci ne kadar sürer?', a: 'Pozisyon ve ülkeye göre değişir; resmî süreç adımları portaldan takip edilebilir.' },
  { q: 'Google hesabımla giriş yapabilir miyim?', a: 'Evet. Aday, işveren ve personel portallarında Google ile güvenli giriş desteklenir.' },
];

function SectionTitle({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="max-w-2xl mx-auto text-center mb-8 sm:mb-12">
      <span className="text-[#2e7d32] font-bold text-xs uppercase tracking-widest">{eyebrow}</span>
      <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-2 tracking-tight">{title}</h2>
      {desc && <p className="text-slate-600 text-sm sm:text-base mt-3">{desc}</p>}
    </div>
  );
}

export function StatsBar() {
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

export function AudienceSections() {
  return (
    <>
      <section id="isverenler" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <SectionTitle eyebrow="İşverenler için" title="Doğru personel, doğru zamanda" desc="Talebinizden işe uyuma kadar tüm insan kaynakları sürecini tek elden yönetiyoruz." />
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {employerServices.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-emerald-200 transition">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-4"><Icon className="w-6 h-6 text-[#2e7d32]" /></div>
              <h3 className="font-extrabold text-slate-900 text-lg">{title}</h3>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/employer-login" className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-800">
            <Building2 className="w-4 h-4" /> Personel talebi oluştur <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section id="adaylar" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#1b5e20] to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="font-bold text-xs uppercase tracking-widest text-emerald-200">Adaylar için</span>
            <h2 className="text-2xl sm:text-4xl font-black mt-2 tracking-tight">Kariyerinizi Avrupa ve Türkiye’ye taşıyın</h2>
            <p className="text-emerald-50 mt-4 text-sm sm:text-base">Profilinizi oluşturun, belgelerinizi yükleyin; size uygun pozisyonlar açıldığında ilk siz haberdar olun.</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link href="/candidate" className="inline-flex justify-center items-center gap-2 bg-white text-[#1b5e20] px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-50">Hemen başvur <ArrowRight className="w-4 h-4" /></Link>
              <Link href="/candidate" className="inline-flex justify-center items-center gap-2 border border-white/40 px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10">Aday girişi</Link>
            </div>
          </div>
          <div className="grid gap-4">
            {candidateItems.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 bg-white/10 rounded-2xl p-5 border border-white/15">
                <Icon className="w-7 h-7 text-emerald-200 flex-shrink-0" />
                <div><div className="font-extrabold">{title}</div><div className="text-sm text-emerald-50/90 mt-1">{desc}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sektorler" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <SectionTitle eyebrow="Sektörler" title="Uzmanlaştığımız alanlar" desc="Grup şirketlerimizin saha deneyimiyle, her sektörün yetkinlik ihtiyacını tanıyoruz." />
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          {sectors.map(({ icon: Icon, name }) => (
            <div key={name} className="rounded-2xl bg-slate-50 border border-slate-200 p-5 text-center hover:bg-emerald-50 transition">
              <Icon className="w-8 h-8 mx-auto text-[#2e7d32]" />
              <div className="font-bold text-slate-800 text-sm mt-3">{name}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="nasil-calisir" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <SectionTitle eyebrow="Nasıl çalışır" title="5 adımda yerleştirme" />
        <ol className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((s, i) => (
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

export function TrustSections() {
  return (
    <>
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <SectionTitle eyebrow="Neden Panova" title="Güven üzerine kurulu insan kaynakları" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {trust.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl border border-slate-200">
              <Icon className="w-8 h-8 text-[#2e7d32]" />
              <div className="font-extrabold text-slate-900 mt-3">{title}</div>
              <p className="text-sm text-slate-600 mt-1">{desc}</p>
            </div>
          ))}
        </div>
        <div className="max-w-5xl mx-auto mt-10 rounded-2xl bg-slate-50 border border-dashed border-slate-300 p-6 text-center">
          <BadgeCheck className="w-6 h-6 mx-auto text-slate-400" />
          <p className="text-sm text-slate-500 mt-2">Referans işverenler ve iş ortakları — logolar izinleri alındıktan sonra burada yer alacaktır.</p>
        </div>
      </section>

      <section id="sss" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <SectionTitle eyebrow="SSS" title="Sık sorulan sorular" />
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((f) => (
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
            <h2 className="text-2xl sm:text-3xl font-black">Ekibinizi birlikte kuralım</h2>
            <p className="text-slate-300 mt-2 text-sm sm:text-base">Personel ihtiyacınızı iletin, uzman ekibimiz 1 iş günü içinde dönüş yapsın.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <a href="#contact-form" className="inline-flex justify-center items-center gap-2 bg-[#2e7d32] px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-[#1b5e20]"><Handshake className="w-4 h-4" /> Teklif al</a>
            <Link href="/candidate" className="inline-flex justify-center items-center gap-2 bg-white text-slate-900 px-6 py-3.5 rounded-xl font-bold text-sm">İş arıyorum</Link>
          </div>
        </div>
      </section>
    </>
  );
}

export function CompanyAbout() {
  return (
    <section id="kurumsal" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200">
      <SectionTitle
        eyebrow="Kurumsal"
        title={company.shortName}
        desc={company.legalName}
      />
      <dl className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
          <dt className="text-xs font-bold uppercase text-slate-400">Adres</dt>
          <dd className="font-semibold text-slate-900 mt-1">{company.address}</dd>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <dt className="text-xs font-bold uppercase text-slate-400">E-posta</dt>
          <dd className="mt-1"><a className="font-semibold text-[#1b5e20]" href={`mailto:${company.email}`}>{company.email}</a></dd>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <dt className="text-xs font-bold uppercase text-slate-400">Telefon</dt>
          <dd className="mt-1 space-y-1">
            {company.phones.map((p) => (
              <div key={p.tel}>
                <a className="font-semibold text-[#1b5e20]" href={`tel:${p.tel}`}>{p.display}</a>
                <span className="text-slate-500"> · {p.name} ({p.place})</span>
              </div>
            ))}
          </dd>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <dt className="text-xs font-bold uppercase text-slate-400">Sicil</dt>
          <dd className="mt-1 text-slate-800">EMBS {company.embs}<br />Vergi no {company.taxId}</dd>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <dt className="text-xs font-bold uppercase text-slate-400">Kuruluş ve sermaye</dt>
          <dd className="mt-1 text-slate-800">{company.established}<br />Sermaye {company.capital}</dd>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
          <dt className="text-xs font-bold uppercase text-slate-400">Yöneticiler ve eşit paylı ortaklar</dt>
          <dd className="mt-1 font-semibold text-slate-900">{company.managers.join(' · ')} (%50 / %50)</dd>
          <dd className="text-slate-500 text-xs mt-2">Makedonca kısa unvan: {company.shortNameMk}</dd>
        </div>
      </dl>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 px-4 sm:px-6 lg:px-8 pt-14 pb-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="text-white font-black text-xl">PANOVA</div>
          <p className="text-sm text-white mt-3">{company.shortName}</p>
          <p className="text-xs mt-1">{company.shortNameMk}</p>
          <p className="text-sm mt-3">{company.address}</p>
          <p className="text-sm mt-2">
            <a className="hover:text-white" href={`mailto:${company.email}`}>{company.email}</a>
          </p>
          <ul className="text-sm mt-2 space-y-1">
            {company.phones.map((p) => (
              <li key={p.tel}>
                <a className="hover:text-white" href={`tel:${p.tel}`}>{p.display}</a>
                <span className="text-slate-500"> · {p.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-white font-bold mb-3">İşverenler</div>
          <ul className="space-y-2 text-sm">
            <li><a href="/#isverenler" className="hover:text-white">Hizmetler</a></li>
            <li><Link href="/employer-login" className="hover:text-white">İşveren girişi</Link></li>
            <li><a href="/#contact-form" className="hover:text-white">Teklif al</a></li>
          </ul>
        </div>
        <div>
          <div className="text-white font-bold mb-3">Adaylar</div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/candidate" className="hover:text-white">Başvuru & giriş</Link></li>
            <li><a href="/#sektorler" className="hover:text-white">Sektörler</a></li>
            <li><a href="/#sss" className="hover:text-white">SSS</a></li>
          </ul>
        </div>
        <div>
          <div className="text-white font-bold mb-3">Kurumsal</div>
          <ul className="space-y-2 text-sm">
            <li><a href="/#kurumsal" className="hover:text-white">Sicil bilgileri</a></li>
            <li><a href="/#nasil-calisir" className="hover:text-white">Nasıl çalışır</a></li>
            <li><Link href="/portal" className="hover:text-white">Personel portalı</Link></li>
            <li><Link href="/kvkk" className="hover:text-white">KVKK Aydınlatma Metni</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-slate-800 mt-10 pt-6 text-xs flex flex-col sm:flex-row justify-between gap-2">
        <span>© {new Date().getFullYear()} {company.shortName}. Tüm hakları saklıdır.</span>
        <span>EMBS {company.embs} · Vergi no {company.taxId}</span>
      </div>
    </footer>
  );
}
