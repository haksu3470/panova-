'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, UserPlus, Send, Building } from 'lucide-react';
import { Language, translations } from '@/lib/dictionary';
import { HeaderActions, PageHeader } from '@/components/site/PageHeader';
import { ProfessionField } from '@/components/site/ProfessionField';
import { fill, homeCopy } from '@/lib/home-copy';
import { professionForSectorChange } from '@/lib/professions';
import { isGmailAddress } from '@/lib/emailAddress';
import { readStoredLanguage, syncDocumentLanguage, writeStoredLanguage } from '@/lib/site-language';

export default function SupplierCandidateRegister() {
  const [currentLang, setCurrentLang] = useState<Language>('tr');

  useEffect(() => {
    const apply = () => {
      const next = readStoredLanguage('tr');
      setCurrentLang(next);
      syncDocumentLanguage(next);
    };
    apply();
    window.addEventListener('storage', apply);
    return () => window.removeEventListener('storage', apply);
  }, []);

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang);
    writeStoredLanguage(lang);
  };

  const [submitted, setSubmitted] = useState(false);
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [supplierName, setSupplierName] = useState('');

  const t = translations[currentLang] || translations.tr;
  const s = homeCopy[currentLang].supplier;
  const isRtl = currentLang === 'ar';
  
  const [formData, setFormData] = useState({
    fullName: '',
    passportNumber: '',
    phone: '',
    email: '',
    profession: '',
    sector: 'construction',
    expectedSalary: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.from('job_candidates').insert([
      {
        full_name: formData.fullName,
        passport_number: formData.passportNumber,
        phone: formData.phone,
        email: formData.email,
        profession: formData.profession,
        sector: formData.sector,
        expected_salary: parseFloat(formData.expectedSalary) || null,
        status: 'pending',
        notes: `Tedarikçi Partner Tarafından Kaydedildi: ${supplierName || 'Yetkili Tedarikçi'}`,
      },
    ]).select('referral_code').single();

    setLoading(false);
    if (!error) {
      setSavedCode(data?.referral_code?.trim() || null);
      setSubmitted(true);
    } else alert('Hata: ' + error.message);
  };

  return (
    <div className={`min-h-screen bg-slate-900 text-slate-100 py-6 sm:py-12 px-3 sm:px-6 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Üst Bar */}
        <PageHeader
          variant="plain"
          // eslint-disable-next-line @next/next/no-img-element -- same plain logo as the other page headers
          start={<img src="/logo.png" alt="PANOVA" width={1051} height={725} className="h-10 w-auto rounded-xl bg-white object-contain shrink-0" />}
          actions={<HeaderActions lang={currentLang} onLanguageChange={changeLanguage} homeLabel={t.returnHome} tone="dark" />}
        />

        <div className="bg-slate-800 p-4 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-white">{s.title}</h1>
              <p className="text-on-dark-muted text-xs mt-0.5">{s.subtitle}</p>
            </div>
          </div>

          {submitted ? (
            <div className="bg-emerald-950 p-6 sm:p-8 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-14 h-14 sm:w-16 sm:h-16 text-emerald-400 mx-auto" />
              <h2 className="text-base sm:text-lg font-bold text-white">{s.success}</h2>
              <p className="text-xs text-emerald-100 leading-relaxed">{savedCode ? fill(s.linkedCode, { code: savedCode }) : s.openRegistration}</p>
              {!isGmailAddress(formData.email) ? <p className="text-xs text-emerald-100 leading-relaxed">{t.supplierNonGmailHint}</p> : null}
              <button onClick={() => setSubmitted(false)} className="bg-brand-solid text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition hover:bg-brand">{s.another}</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-on-dark-muted uppercase mb-1">{s.company} *</label>
                <input type="text" required value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder={s.companyPh} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm outline-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-on-dark-muted uppercase mb-1">{s.name} *</label>
                  <input type="text" required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-on-dark-muted uppercase mb-1">{s.passport}</label>
                  <input type="text" value={formData.passportNumber} onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-on-dark-muted uppercase mb-1">{s.phone} *</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+389..." className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-on-dark-muted uppercase mb-1">{s.email} *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-on-dark-muted uppercase mb-1" htmlFor="supplier-sector">{t.sectorLabel} *</label>
                  <select
                    id="supplier-sector"
                    required
                    value={formData.sector}
                    onChange={(e) => {
                      const sector = e.target.value;
                      setFormData((current) => ({
                        ...current,
                        sector,
                        profession: professionForSectorChange(current.profession, sector),
                      }));
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm outline-none"
                  >
                    {homeCopy[currentLang].formSectors.map((sector) => (
                      <option key={sector.value} value={sector.value}>{sector.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-on-dark-muted uppercase mb-1" htmlFor="supplier-profession">{t.professionLabel} *</label>
                  <ProfessionField
                    id="supplier-profession"
                    lang={currentLang}
                    sector={formData.sector}
                    value={formData.profession}
                    required
                    onChange={(profession) => setFormData((current) => ({ ...current, profession }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm outline-none"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 sm:py-4 rounded-xl font-bold transition text-xs sm:text-sm cursor-pointer mt-4 shadow-lg">
                {loading ? s.saving : s.save}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}