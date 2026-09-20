'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CheckCircle2, UserPlus, Languages, Send, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function RegisterPage() {
  const [currentLang, setCurrentLang] = useState<Language>('tr');
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
    profession: '',
    experienceYears: '0',
    certificateNo: '',
    issuingBody: '',
    videoUrl: '',
    expectedSalary: '',
    shiftSuitable: true,
    languageSkills: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const cleanPhone = formData.phone.trim();
      const cleanPassport = formData.passportNumber.trim();

      // 1. Aday Kaydı
      const { error: insertError } = await supabase.from('job_candidates').insert([
        {
          full_name: formData.fullName,
          passport_number: cleanPassport || null,
          nationality: formData.nationality,
          phone: cleanPhone,
          email: cleanEmail,
          sector: formData.sector,
          profession: formData.profession,
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
        // Unique Constraint Hatası (23505 = Mükerrer Kayıt)
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
    <div className={`min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome}
          </Link>

          <div className="flex items-center bg-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-700 shadow-sm">
            <Languages className="w-4 h-4 text-slate-300 mr-1.5 rtl:ml-1.5" />
            <select
              value={currentLang}
              onChange={(e) => setCurrentLang(e.target.value as Language)}
              className="bg-transparent text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer"
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

        {/* Form Container */}
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-10 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#2e7d32] rounded-2xl flex items-center justify-center text-white">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{t.regFormTitle}</h1>
              <p className="text-slate-400 text-xs mt-0.5">{t.regFormSub}</p>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-950/80 border border-red-800 rounded-2xl flex items-center gap-3 text-red-200 text-sm font-medium">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {submitted ? (
            <div className="bg-emerald-950/60 border border-emerald-800 p-8 rounded-2xl text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">{t.regSuccessTitle}</h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">{t.regSuccessDesc}</p>
              <Link href="/" className="inline-block mt-6 bg-[#2e7d32] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#1b5e20] transition">
                {t.returnHome}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t.nameLabel} *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t.passportLabel}</label>
                  <input
                    type="text"
                    value={formData.passportNumber}
                    onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t.sectorLabel}</label>
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                  >
                    <option value="construction">Construction / İnşaat</option>
                    <option value="agriculture">Agriculture / Tarım</option>
                    <option value="hr">General HR / İK</option>
                    <option value="trade">Foreign Trade / Dış Ticaret</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t.professionLabel} *</label>
                  <input
                    type="text"
                    required
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t.certNoLabel}</label>
                  <input
                    type="text"
                    value={formData.certificateNo}
                    onChange={(e) => setFormData({ ...formData, certificateNo: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t.issuingBodyLabel}</label>
                  <input
                    type="text"
                    value={formData.issuingBody}
                    onChange={(e) => setFormData({ ...formData, issuingBody: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t.videoUrlLabel}</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/..."
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t.expectedSalaryLabel}</label>
                  <input
                    type="number"
                    value={formData.expectedSalary}
                    onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-300">
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
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t.emailLabel} *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t.phoneLabel} *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer"
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