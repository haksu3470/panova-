'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, ShieldCheck, Search, Filter, Languages, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function PortalPage() {
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'ar';
  const selectableLanguages = languages.filter((lang) => lang.code !== 'en');

  // Login Kontrolü
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'panova2026') {
      setAuthenticated(true);
      fetchCandidates();
    } else {
      alert('Invalid username or password!');
    }
  };

  // Aday Listesini Çekme
  const fetchCandidates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_candidates')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCandidates(data);
    }
    setLoading(false);
  };

  // Vize / Başvuru Durumunu Güncelleme
  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('job_candidates')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setCandidates(candidates.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } else {
      alert('Update Error: ' + error.message);
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.passport_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.profession?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  if (!authenticated) {
    return (
      <div className={`min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="absolute top-6 right-6 flex items-center bg-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-700 shadow-sm">
          <Languages className="w-4 h-4 text-slate-300 mr-1.5 rtl:ml-1.5" />
          <select
            value={currentLang}
            onChange={(e) => setCurrentLang(e.target.value as Language)}
            className="bg-transparent text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer"
          >
            {currentLang === 'en' && (
              <option value="en" disabled>
                🌐 Language
              </option>
            )}
            {selectableLanguages.map((lang) => (
              <option key={lang.code} value={lang.code} className="text-slate-900">
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="w-14 h-14 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">{t.portalTitle}</h1>
          <p className="text-slate-500 text-sm mb-6">{t.portalSub}</p>

          <form onSubmit={handleLogin} className="space-y-4 text-left rtl:text-right">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.usernameLabel}</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2e7d32] outline-none"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.passwordLabel}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2e7d32] outline-none"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-lg mt-2"
            >
              {t.signInBtn}
            </button>
          </form>
          <Link href="/" className="inline-flex items-center gap-1.5 mt-6 text-sm text-slate-500 hover:underline">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 p-4 sm:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-1">
              <ShieldCheck className="w-4 h-4" /> {t.authSystem}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">{t.mgmtTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Dil Seçici */}
            <div className="relative flex items-center bg-slate-100 rounded-lg px-2.5 py-1.5 border border-slate-200">
              <Languages className="w-4 h-4 text-slate-600 mr-1.5 rtl:ml-1.5" />
              <select
                value={currentLang}
                onChange={(e) => setCurrentLang(e.target.value as Language)}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                {currentLang === 'en' && (
                  <option value="en" disabled>
                    🌐 Language
                  </option>
                )}
                {selectableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setAuthenticated(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              {t.logoutBtn}
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:right-3 rtl:left-auto top-3.5" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 rtl:pr-9 rtl:pl-4 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-[#2e7d32]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">{t.allStatuses}</option>
              <option value="pending">{t.pendingStatus}</option>
              <option value="reviewing">{t.reviewingStatus}</option>
              <option value="visa_processing">{t.visaProcessingStatus}</option>
              <option value="approved">{t.approvedStatus}</option>
            </select>
          </div>
        </div>

        {/* Candidate Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">{t.submitting}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-4">{t.colCandidate}</th>
                    <th className="p-4">{t.colPassportNat}</th>
                    <th className="p-4">{t.colProfSector}</th>
                    <th className="p-4">{t.colContact}</th>
                    <th className="p-4">{t.colVisaStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCandidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-900">{candidate.full_name}</td>
                      <td className="p-4">
                        <div>{candidate.passport_number || 'N/A'}</div>
                        <div className="text-xs text-slate-400">{candidate.nationality}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-800">{candidate.profession}</span>
                        <div className="text-xs text-slate-400 uppercase">{candidate.sector}</div>
                      </td>
                      <td className="p-4">{candidate.phone}</td>
                      <td className="p-4">
                        <select
                          value={candidate.status || 'pending'}
                          onChange={(e) => updateStatus(candidate.id, e.target.value)}
                          className="px-3 py-1.5 rounded-lg border text-xs font-bold uppercase cursor-pointer outline-none bg-slate-50"
                        >
                          <option value="pending">🟡 {t.pendingStatus}</option>
                          <option value="reviewing">🔵 {t.reviewingStatus}</option>
                          <option value="visa_processing">🟣 {t.visaProcessingStatus}</option>
                          <option value="approved">🟢 {t.approvedStatus}</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {filteredCandidates.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        {t.noRecords}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
