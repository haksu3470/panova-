'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CheckCircle2, UserPlus, Languages, Send, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function RegisterPage() {
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('panova_portal_lang') as Language;
      if (saved && ['tr', 'en', 'sq', 'ar'].includes(saved)) return saved;
    }
    return 'tr';
  });

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('panova_portal_lang') as Language;
      if (saved && ['tr', 'en', 'sq', 'ar'].includes(saved)) {
        setCurrentLang(saved);
      }
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(handleStorage, 150);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('panova_portal_lang', lang);
    }
  };

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const t = translations[currentLang] || translations.tr;
  const isRtl = currentLang === 'ar';
  
  const selectableLanguages = languages.filter((lang) => lang.code !== currentLang);
  const activeLangObj = languages.find((l) => l.code === currentLang);

  const [formData, setFormData] = useState({
    fullName: '',
    passportNumber: '',
    nationality: 'Turkey',
    phone: '',
    email: '',
    sector: 'construction',
    profession: 'Electrician / Elektrikçi',
    customProfession: '',
    experienceYears: '0',
    certificateNo: '',
    issuingBody: '',
    videoUrl: '',
    expectedSalary: '',
    shiftSuitable: true,
    languageSkills: '',
    notes: '',
  });

  const professionOptions: Record<string, string[]> = {
    construction: [
      'Electrician / Elektrikçi',
      'Mason & Plasterer / Duvarcı & Sıvacı',
      'Welder / Kaynakçı',
      'Plumber / Tesisatçı',
      'Formwork Carpenter / Kalıpçı Usta',
      'Heavy Machinery Operator / İş Makinesi Operatörü',
      'General Construction Worker / İnşaat İşçisi',
      'Other / Diğer'
    ],
    agriculture: [
      'Fruit & Crop Picker / Meyve & Hasat Toplayıcı',
      'Tractor & Farm Operator / Traktör & Çiftlik Operatörü',
      'Greenhouse Worker / Sera İşçisi',
      'Irrigation Specialist / Sulama Uzmanı',
      'Agricultural Laborer / Tarım İşçisi',
      'Other / Diğer'
    ],
    hr: [
      'HR Specialist / İK Uzmanı',
      'Recruiter / İşe Alım Danışmanı',
      'Translator & Interpreter / Mütercim Tercüman',
      'Administrative Assistant / Büro Elemanı',
      'Other / Diğer'
    ],
    trade: [
      'Logistics Specialist / Lojistik Elemanı',
      'Warehouse Worker / Depo Görevlisi',
      'Forklift Driver / Forklift Operatörü',
      'Foreign Trade Specialist / Dış Ticaret Uzmanı',
      'Other / Diğer'
    ],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const cleanPhone = formData.phone.trim();
      const cleanPassport = formData.passportNumber.trim();
      
      const finalProfession = formData.profession === 'Other / Diğer'
        ? formData.customProfession
        : formData.profession;

      const { error: insertError } = await supabase.from('job_candidates').insert([
        {
          full_name: formData.fullName,
          passport_number: cleanPassport || null,
          nationality: formData.nationality,
          phone: cleanPhone,
          email: cleanEmail,
          sector: formData.sector,
          profession: finalProfession || 'General Worker',
          experience_years: parseInt(formData.experienceYears) || 0,
          certificate_no: formData.certificateNo,
          issuing_body: formData.issuingBody,
          video_url: formData.videoUrl,
          expected_salary: parseFloat(formData.expectedSalary) || null,
          shift_suitable: formData.shiftSuitable,
          language_skills: formData.languageSkills,
          notes: formData.notes,
          status: 'pending',
        },
      ]);

      if (insertError) {
        if (insertError.code === '23505' || insertError.message.includes('unique')) {
          setErrorMessage(
            currentLang === 'tr'
              ? 'Bu e-posta adresi, telefon numarası veya pasaport numarası ile daha önce başvuru yapılmıştır!'
              : 'A candidate with this email, phone, or passport number already exists in the system!'
          );
          setLoading(false);
          return;
        }
        throw insertError;
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage('Kayıt Hatası: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-900 text-slate-100 py-6 sm:py-12 px-3 sm:px-6 lg:px-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Üst Bar */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome}
          </Link>

          <div className="flex items-center bg-slate-800 rounded-xl px-2.5 py-1.5 border border-slate-700 shadow-sm">
            <Languages className="w-4 h-4 text-slate-300 mr-1.5 rtl:ml-1.5" />
            <select
              value={currentLang}
              onChange={(e) => changeLanguage(e.target.value as Language)}
              className="bg-transparent text-xs sm:text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value={currentLang} className="text-slate-900 font-bold">
                {activeLangObj?.flag} {activeLangObj?.name}
              </option>
              {selectableLanguages.map((lang) => (
                <option key={lang.code} value={lang.code} className="text-slate-900">{lang.flag} {lang.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-4 sm:p-10 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#2e7d32] rounded-2xl flex items-center justify-center text-white shrink-0">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">{t.regFormTitle}</h1>
              <p className="text-slate-400 text-xs mt-0.5">{t.regFormSub}</p>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-950/80 border border-red-800 rounded-2xl flex items-center gap-3 text-red-200 text-xs sm:text-sm font-medium">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {submitted ? (
            <div className="bg-emerald-950/60 border border-emerald-800 p-6 sm:p-8 rounded-2xl text-center space-y-4">
              <CheckCircle2 className="w-14 h-14 sm:w-16 sm:h-16 text-emerald-400 mx-auto" />
              <h2 className="text-lg sm:text-xl font-bold text-white">{t.regSuccessTitle}</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">{t.regSuccessDesc}</p>
              <Link href="/" className="inline-block bg-[#2e7d32] text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm hover:bg-[#1b5e20] transition">
                {t.returnHome}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">{t.nameLabel} *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">{t.passportLabel}</label>
                  <input
                    type="text"
                    value={formData.passportNumber}
                    onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">{t.sectorLabel}</label>
                  <select
                    value={formData.sector}
                    onChange={(e) => {
                      const sec = e.target.value;
                      const defaultProf = professionOptions[sec]?.[0] || 'Other / Diğer';
                      setFormData({ ...formData, sector: sec, profession: defaultProf });
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-xs sm:text-sm cursor-pointer"
                  >
                    <option value="construction">Construction / İnşaat</option>
                    <option value="agriculture">Agriculture / Tarım</option>
                    <option value="hr">General HR / İK</option>
                    <option value="trade">Foreign Trade / Dış Ticaret</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">{t.professionLabel} *</label>
                  <select
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-xs sm:text-sm cursor-pointer"
                  >
                    {(professionOptions[formData.sector] || ['Other / Diğer']).map((prof) => (
                      <option key={prof} value={prof}>{prof}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.profession === 'Other / Diğer' && (
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Mesleğinizi Belirtiniz *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: CNC Operatörü, İskele Kurulum Ustası"
                    value={formData.customProfession}
                    onChange={(e) => setFormData({ ...formData, customProfession: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-xs sm:text-sm"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">{t.certNoLabel}</label>
                  <input
                    type="text"
                    value={formData.certificateNo}
                    onChange={(e) => setFormData({ ...formData, certificateNo: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">{t.issuingBodyLabel}</label>
                  <input
                    type="text"
                    value={formData.issuingBody}
                    onChange={(e) => setFormData({ ...formData, issuingBody: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">{t.videoUrlLabel}</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/..."
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">{t.expectedSalaryLabel}</label>
                  <input
                    type="number"
                    value={formData.expectedSalary}
                    onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-xs sm:text-sm"
                  />
                </div>

                <div className="flex items-center pt-2 sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.shiftSuitable}
                      onChange={(e) => setFormData({ ...formData, shiftSuitable: e.target.checked })}
                      className="w-4 h-4 rounded text-[#2e7d32]"
                    />
                    {t.shiftSuitableLabel}
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">{t.emailLabel} *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">{t.phoneLabel} *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-xs sm:text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 sm:py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm mt-4 cursor-pointer"
              >
                <Send className="w-4 h-4" /> {loading ? t.submitting : t.completeReg}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}