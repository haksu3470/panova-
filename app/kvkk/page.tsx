import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/home/HomeSections';
import { company } from '@/lib/company';

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni | PANOVA TARIM DOO Struga',
  description: 'PANOVA TARIM DOO Struga kişisel verilerin korunması aydınlatma metni.',
};

export default function KvkkPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-black tracking-tight text-slate-900">PANOVA</Link>
          <Link href="/" className="text-sm font-semibold text-[#1b5e20]">Ana sayfa</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-sm leading-relaxed text-slate-700">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">KVKK Aydınlatma Metni</h1>
          <p className="mt-3">
            Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında; sitedeki iletişim formu,
            aday kaydı ve işveren kaydı sırasında paylaşılan kişisel verilere ilişkindir.
          </p>
        </div>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <h2 className="font-extrabold text-slate-900">Veri sorumlusu</h2>
          <p>{company.legalName}</p>
          <p>Kısa unvan: {company.shortName} / {company.shortNameMk}</p>
          <p>Adres: {company.address}</p>
          <p>
            E-posta:{' '}
            <a className="text-[#1b5e20] font-semibold" href={`mailto:${company.email}`}>{company.email}</a>
          </p>
          <ul>
            {company.phones.map((p) => (
              <li key={p.tel}><a className="text-[#1b5e20] font-semibold" href={`tel:${p.tel}`}>{p.display}</a></li>
            ))}
          </ul>
          <p>EMBS: {company.embs} · Vergi kimlik no: {company.taxId}</p>
          <p className="pt-2">
            Türkiye ofisi: {company.turkey.addressLines.join(', ')}. Tel:{' '}
            <a className="text-[#1b5e20] font-semibold" href={`tel:${company.turkey.phone.tel}`}>{company.turkey.phone.display}</a>
            . E-posta:{' '}
            <a className="text-[#1b5e20] font-semibold" href={`mailto:${company.turkey.email}`}>{company.turkey.email}</a>
            . {company.turkey.taxOffice}, VKN {company.turkey.vkn}.
          </p>
          <p>
            Bangladeş ofisi: {company.bangladesh.addressLines.join(', ')}. Tel:{' '}
            <a className="text-[#1b5e20] font-semibold" href={`tel:${company.bangladesh.phone.tel}`}>{company.bangladesh.phone.display}</a>
            . E-posta:{' '}
            <a className="text-[#1b5e20] font-semibold" href={`mailto:${company.bangladesh.email}`}>{company.bangladesh.email}</a>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-extrabold text-slate-900">İşlenen veriler ve amaç</h2>
          <p>
            İletişim formunda ad soyad, e-posta, telefon ve mesaj; aday kaydında kimlik, pasaport, telefon,
            e-posta ve meslek bilgileri; işveren kaydında şirket unvanı, yetkili, telefon ve e-posta işlenir.
            Amaç, taleplere dönüş yapmak ve personel ile işveren süreçlerini yürütmektir.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-extrabold text-slate-900">Haklar</h2>
          <p>
            KVKK madde 11 kapsamındaki taleplerinizi{' '}
            <a className="text-[#1b5e20] font-semibold" href={`mailto:${company.email}`}>{company.email}</a>,{' '}
            <a className="text-[#1b5e20] font-semibold" href={`mailto:${company.turkey.email}`}>{company.turkey.email}</a>
            {' '}veya{' '}
            <a className="text-[#1b5e20] font-semibold" href={`mailto:${company.bangladesh.email}`}>{company.bangladesh.email}</a>
            {' '}adresine, sitedeki iletişim formuna veya yukarıdaki telefon numaralarına iletebilirsiniz.
            Avrupa Birliği’nde bulunan kişiler, GDPR kapsamındaki erişim, düzeltme ve silme taleplerini aynı kanallardan iletebilir.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
