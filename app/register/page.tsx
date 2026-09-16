'use client';

import { useState } from 'react';
import { Send, CheckCircle2, UserCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
          notes: formData.notes,
          status: 'pending',
        },
      ]);

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      alert('Error / Hata: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[#2e7d32] font-semibold mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Return to Home Page / Ana Sayfa
        </Link>

        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              International Candidate Application Form
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Uluslararası Aday & İş Gücü Kayıt Formu (PANOVA GROUP)
            </p>
          </div>

          {submitted ? (
            <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-emerald-800">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-600" />
              <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
              <p className="text-sm">
                Your application has been registered. Our HR team will evaluate your profile and contact you for visa and employment processes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Kişisel Bilgiler */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name / Ad Soyad *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Passport No / Pasaport No</label>
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nationality / Uyruk *</label>
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Phone / Telefon *</label>
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email / E-posta</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                  />
                </div>
              </div>

              {/* Mesleki Detaylar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Sector / Sektör *</label>
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                  >
                    <option value="construction">Construction / İnşaat</option>
                    <option value="agriculture">Agriculture / Tarım</option>
                    <option value="hr">General HR / İnsan Kaynakları</option>
                    <option value="trade">Foreign Trade / Dış Ticaret</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Profession / Meslek *</label>
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Experience (Years) / Tecrübe</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Language Skills / Dil Bilgisi</label>
                <input
                  type="text"
                  value={formData.languageSkills}
                  onChange={(e) => setFormData({ ...formData, languageSkills: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e7d32]"
                  placeholder="e.g. English (Basic), Arabic (Fluent)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Additional Notes / Ek Açıklama</label>
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
                {loading ? 'Submitting...' : 'Complete Registration / Kaydı Tamamla'}
                <Send className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
