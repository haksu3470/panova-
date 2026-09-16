'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Users, Globe, Sprout, HardHat, Send, CheckCircle2, Building2, Languages } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Language, languages, translations } from '@/lib/dictionary';

type CompanyId = 'hr' | 'trade' | 'agriculture' | 'construction';

interface CompanyInfo {
  id: CompanyId;
  name: string;
  tagline: string;
  desc: string;
  icon: any;
  color: string;
  accentBg: string;
  services: string[];
}

export default function Home() {
  const [currentLang, setCurrentLang] = useState<Language>('tr');
  const [selectedCompany, setSelectedCompany] = useState<CompanyId>('hr');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const t = translations[currentLang] || translations.tr;
  const isRtl = currentLang === 'ar';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    notes: '',
  });

  const companies: Record<CompanyId, CompanyInfo> = {
    hr: {
      id: 'hr',
      name: 'PANOVA İnsan Kaynakları',
      tagline: 'Sınır Ötesi İstihdam ve Uluslararası İş Gücü',
      desc: 'Küresel pazarda doğru yeteneği doğru projeyle buluşturan uluslararası seçme, yerleştirme ve danışmanlık hizmetleri.',
      icon: Users,
      color: '#2e7d32',
      accentBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      services: [
        'Uluslararası Personel Tedariki',
        'Mavi & Beyaz Yaka Seçme Yerleştirme',
        'Çalışma İzni ve Vize Danışmanlığı',
        'Sektörel İş Gücü Planlaması'
      ]
    },
    trade: {
      id: 'trade',
      name: 'PANOVA Dış Ticaret',
      tagline: 'Küresel Tedarik Zinciri ve Ticaret Köprüsü',
      desc: 'Bölgesel ve uluslararası pazarlarda güvenilir ithalat, ihracat, lojistik ve pazar geliştirme operasyonları.',
      icon: Globe,
      color: '#1b5e20',
      accentBg: 'bg-green-50 border-green-200 text-green-800',
      services: [
        'Uluslararası Ürün İthalat & İhracatı',
        'Tedarik Zinciri Yönetimi',
        'Pazar Araştırması ve B2B Eşleştirme',
        'Gümrük ve Lojistik Danışmanlığı'
      ]
    },
    agriculture: {
      id: 'agriculture',
      name: 'PANOVA Tarım',
      tagline: 'Endüstriyel Üretim ve Tarımsal Danışmanlık',
      desc: 'Balkanlar ve Doğu Avrupa genelinde modern meyvecilik, ceviz ve meyve bahçesi kurulumu, sürdürülebilir tarım projeleri.',
      icon: Sprout,
      color: '#7cb342',
      accentBg: 'bg-[#f1f8e9] border-[#c5e1a5] text-[#33691e]',
      services: [
        'Arazide Modern Bahçe Kurulumu',
        'Ceviz ve Meyve Yetiştiriciliği Danışmanlığı',
        'Sulama ve Gübreleme Altyapısı',
        'Tarımsal Teşvik ve Devlet Desteği Takibi'
      ]
    },
    construction: {
      id: 'construction',
      name: 'PANOVA İnşaat',
      tagline: 'Endüstriyel Tesis ve Altyapı Çözümleri',
      desc: 'Tarımsal depolar, endüstriyel soğuk hava depoları, arazi alt/üst yapı projeleri ve mühendislik çözümleri.',
      icon: HardHat,
      color: '#00695c',
      accentBg: 'bg-teal-50 border-teal-200 text-teal-800',
      services: [
        'Endüstriyel & Tarımsal Depo İnşaatı',
        'Arazi Düzenleme ve Altyapı Projeleri',
        'Mühendislik ve Proje Taahhüt',
        'Saha Süreç Yönetimi'
      ]
    }
  };

  const current = companies[selectedCompany];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('applicants').insert([
        {
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          notes: `[Dil: ${currentLang.toUpperCase()}] [Şirket: ${current.name}] - ${formData.notes}`,
          sector: selectedCompany,
        },
      ]);

      if (error) throw error;
      setSubmitted(true);
      setFormData({ fullName: '', email: '', phone: '', notes: '' });
    } catch (err: any) {
      alert('Hata / Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-800 font-sans ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="PANOVA GROUP Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-wider text-[#2e7d32]">PANOVA</span>
              <span className="text-xl font-light text-[#7cb342] ml-1.5 rtl:mr-1.5 uppercase tracking-widest">GROUP</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            {/* Dil Seçici Dropdown */}
            <div className="relative flex items-center bg-slate-100 rounded-lg px-2 py-1">
              <Languages className="w-4 h-4 text-slate-600 mr-1.5 rtl:ml-1.5" />
              <select
                value={currentLang}
                onChange={(e) => setCurrentLang(e.target.value as Language)}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <a 
              href="#apply" 
              className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium transition shadow-md"
            >
              {t.contactUs}
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1b5e20] via-[#2e7d32] to-[#388e3c] text-white py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block bg-[#fbc02d] text-slate-900 font-bold px-4 py-1.5 rounded-full text-xs sm:text-sm mb-4 shadow-lg uppercase tracking-wider">
            {t.tagline}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight">
            {t.heroTitle}
          </h1>
          <p className="text-base sm:text-xl text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            {t.heroDesc}
          </p>
        </div>
      </section>

      {/* Şirket Seçim Tabları */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white p-2 sm:p-3 rounded-2xl shadow-xl border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-2">
          {(Object.keys(companies) as CompanyId[]).map((key) => {
            const comp = companies[key];
            const Icon = comp.icon;
            const isSelected = selectedCompany === key;

            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedCompany(key);
                  setSubmitted(false);
                }}
                className={`p-4 rounded-xl flex flex-col items-center justify-center text-center transition-all duration-200 ${
                  isSelected 
                    ? 'bg-[#2e7d32] text-white shadow-md scale-[1.02]' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-[#fbc02d]' : 'text-[#2e7d32]'}`} />
                <span className="font-bold text-sm sm:text-base">{comp.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Seçili Şirket Detay & Hizmet Alanı */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
            <div>
              <span className={`inline-block px-3 py-1 rounded-md text-xs font-semibold mb-2 border ${current.accentBg}`}>
                {t.selectedCompany}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{current.name}</h2>
              <p className="text-slate-500 font-medium mt-1">{current.tagline}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 max-w-md">
              <p className="text-slate-600 text-sm leading-relaxed">{current.desc}</p>
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#2e7d32]" />
            {t.scopeTitle}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {current.services.map((service, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-[#7cb342] shrink-0 mt-0.5" />
                <span className="text-slate-700 font-medium text-sm sm:text-base">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dinamik Başvuru / İletişim Formu */}
      <section id="apply" className="max-w-3xl mx-auto px-4 pb-20">
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-lg border border-slate-100">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900">
              {current.name} {t.formTitle}
            </h3>
            <p className="text-slate-600 text-sm mt-1">
              {t.formDesc}
            </p>
          </div>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-emerald-800">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-600" />
              <h4 className="text-lg font-bold">{t.successTitle}</h4>
              <p className="text-sm mt-1">
                {current.name} {t.successDesc}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t.nameLabel}</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32] transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t.emailLabel}</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t.phoneLabel}</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t.notesLabel}</label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32] transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2"
              >
                {loading ? t.submitting : t.submitBtn}
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-center text-sm">
        <p>© 2026 PANOVA GROUP (PANOVA TARIM DOO). Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}
