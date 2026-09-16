'use client';

import { useState } from 'react';
import { Send, CheckCircle2, UserCheck, ArrowLeft, Languages, Award, Video } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Language, languages, translations } from '@/lib/dictionary';

export default function RegisterPage() {
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'ar';
  const selectableLanguages = languages.filter((lang) => lang.code !== 'en');

  const [formData, setFormData] = useState({
    fullName: '',
    passportNumber: '',
    nationality: 'Bangladesh',
    phone: '',
    email: '',
    sector: 'construction',
    profession: '',
    experienceYears: 0,
    languageSkills: '',
    certificateNo: '',
    issuingBody: '',
    videoUrl: '',
    expectedSalary: '',
    shiftSuitable: true,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('job_candidates').insert([
        {
          full_name: formData.fullName,
          passport_number: formData.passportNumber,
          nationality: formData.nationality,
          phone: formData.phone,
          email: formData.email,
          sector: formData.sector,
          profession: formData.profession,
          experience_years: Number(formData.experienceYears),
          language_skills: formData.languageSkills,
          certificate_no: formData.certificateNo,
          issuing_body: formData.issuingBody,
          video_url: formData.videoUrl,
          expected_salary: formData.expectedSalary ? Number(formData.expectedSalary) : null,
          shift_suitable: formData.shiftSuitable,
          notes: `[Lang: ${currentLang.toUpperCase()}] - ${formData.notes}`,
          status: 'pending',
          is_verified: false
        },
      ]);

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-800 py-12 px-4 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto">
        {/* Navigation & Language Picker */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-[#2e7d32] font-semibold hover:underline">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome}
          </Link>

          <div className="relative flex items-center bg-white rounded-lg px-2.5 py-1.5 border border-slate-200 shadow-sm">
            <Languages className="w-4 h-4 text-slate-600 mr-1.5 rtl:ml-1.5" />
            <select
              value={currentLang}
              onChange={(e) => setCurrentLang(e.target.value as Language)}
              className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              {currentLang === 'en' && (
                <option value="en" disabled>🌐 Language</option>
              )}
              {selectableLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t.regFormTitle}</h1>
            <p className="text-slate-500 text-sm mt-1">{t.regFormSub}</p>
          </div>

          {submitted ? (
            <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-emerald-800">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-600" />
              <h2 className="text-2xl font-bold mb-2">{t.regSuccessTitle}</h2>
              <p className="text-sm">{t.regSuccessDesc}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t.nameLabel}</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t.passportLabel}</label>
                  <input
                    type="text"
                    value={formData.passportNumber}
                    onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t.nationalityLabel}</label>
                  <select
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                  >
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="Turkey">Turkey</option>
                    <option value="North Macedonia">North Macedonia</option>
                    <option value="Pakistan">Pakistan</option>
                    <option value="India">India</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t.phoneLabel}</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                    placeholder="+880 / +90 / +389"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t.emailLabel}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                  />
                </div>
              </div>

              {/* Profession Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t.sectorLabel}</label>
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                  >
                    <option value="construction">Construction</option>
                    <option value="agriculture">Agriculture</option>
                    <option value="hr">General HR</option>
                    <option value="trade">Foreign Trade</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t.professionLabel}</label>
                  <input
                    type="text"
                    required
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                    placeholder="e.g. Mason, Welder, Worker"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t.expLabel}</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                  />
                </div>
              </div>

              {/* Certificate Verification Fields */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                  <Award className="w-4 h-4 text-[#2e7d32]" /> Qualification & Certificate Verification
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{t.certNoLabel}</label>
                    <input
                      type="text"
                      value={formData.certificateNo}
                      onChange={(e) => setFormData({ ...formData, certificateNo: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32] text-sm"
                      placeholder="e.g. BTEB-998231"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{t.issuingBodyLabel}</label>
                    <input
                      type="text"
                      value={formData.issuingBody}
                      onChange={(e) => setFormData({ ...formData, issuingBody: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32] text-sm"
                      placeholder="e.g. Technical Education Board"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-slate-500" /> {t.videoUrlLabel}
                  </label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32] text-sm"
                    placeholder="https://youtube.com/watch?v=... or Drive link"
                  />
                </div>
              </div>

              {/* Salary & Additional Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t.expectedSalaryLabel}</label>
                  <input
                    type="number"
                    value={formData.expectedSalary}
                    onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                    placeholder="e.g. 700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t.langSkillsLabel}</label>
                  <input
                    type="text"
                    value={formData.languageSkills}
                    onChange={(e) => setFormData({ ...formData, languageSkills: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                    placeholder="e.g. English (Basic), Arabic (Fluent)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t.addNotesLabel}</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2 text-lg"
              >
                {loading ? t.submitting : t.completeReg}
                <Send className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
