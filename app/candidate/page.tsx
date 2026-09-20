'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, FileCheck, Briefcase, CalendarCheck, Plane, LifeBuoy, Languages, ArrowLeft, CheckCircle2, Clock, AlertCircle, Send, LogOut, FileText } from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function CandidateDashboard() {
  const [currentLang, setCurrentLang] = useState<Language>('tr');
  const [authenticated, setAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [candidate, setCandidate] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'jobs' | 'interviews' | 'support'>('overview');

  // Destek Talebi State
  const [supportNote, setSupportNote] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  const t = translations[currentLang] || translations.tr;
  const isRtl = currentLang === 'ar';

  const selectableLanguages = languages.filter((lang) => lang.code !== currentLang);
  const activeLangObj = languages.find((l) => l.code === currentLang);

  const handleCandidateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanInput = loginInput.trim().toLowerCase();

    const { data, error } = await supabase
      .from('job_candidates')
      .select('*')
      .or(`email.eq.${cleanInput},phone.eq.${cleanInput},passport_number.eq.${cleanInput}`)
      .single();

    setLoading(false);

    if (!error && data) {
      setCandidate(data);
      setAuthenticated(true);
    } else {
      alert(currentLang === 'tr' ? 'Girdiğiniz bilgilerle eşleşen aday kaydı bulunamadı!' : 'No candidate record found matching your input!');
    }
  };

  const candidateDocs = candidate?.documents_json ? JSON.parse(candidate.documents_json) : [];

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
            <option value={currentLang} className="text-slate-900 font-bold">{activeLangObj?.flag} {activeLangObj?.name}</option>
            {selectableLanguages.map((lang) => (
              <option key={lang.code} value={lang.code} className="text-slate-900">{lang.flag} {lang.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="w-14 h-14 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Aday Giriş Paneli</h1>
          <p className="text-slate-500 text-xs mb-6">Başvurunuzu ve resmi işlemlerinizi takip etmek için E-posta, Telefon veya Pasaport Numaranızı giriniz.</p>

          <form onSubmit={handleCandidateLogin} className="space-y-4 text-left rtl:text-right">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-Posta / Telefon / Pasaport No</label>
              <input
                type="text"
                required
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Örn: omeraksu97@gmail.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-lg mt-2 cursor-pointer text-sm"
            >
              {loading ? 'Sorgulanıyor...' : 'Başvurumu Sorgula'}
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
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center font-black text-xl">
              {candidate.full_name?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase bg-emerald-50 px-2.5 py-0.5 rounded-full w-fit mb-0.5">
                Hoş Geldiniz, {candidate.full_name}
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">Aday Takip & İşlem Portalı</h1>
            </div>
          </div>

          <button
            onClick={() => setAuthenticated(false)}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Çıkış Yap
          </button>
        </div>

        {/* Tab Menüsü */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'overview' ? 'bg-[#2e7d32] text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <User className="w-4 h-4" /> Genel Durum & Profilim
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'documents' ? 'bg-[#2e7d32] text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" /> Belgelerim ({candidateDocs.length})
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'jobs' ? 'bg-[#2e7d32] text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" /> İş Fırsatları & Teklifler
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'support' ? 'bg-[#2e7d32] text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <LifeBuoy className="w-4 h-4" /> Destek & Talep
          </button>
        </div>

        {/* Tab 1: Genel Durum */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-700" /> Başvurunun Mevcut Aşaması
              </h3>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-800 uppercase">Aşama</div>
                  <div className="text-lg font-black text-emerald-900 uppercase">{candidate.status || 'Beklemede'}</div>
                </div>
                <CheckCircle2 className="w-8 h-8 text-[#2e7d32]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-bold uppercase">Meslek & Sektör</span>
                  <strong className="text-slate-800 text-sm">{candidate.profession} ({candidate.sector})</strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-bold uppercase">Ücret Beklentisi</span>
                  <strong className="text-slate-800 text-sm">€{candidate.expected_salary || '0'} / ay</strong>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Kişisel Bilgiler</h3>
              <div className="space-y-2 text-xs text-slate-600">
                <div>Telefon: <strong className="text-slate-800">{candidate.phone}</strong></div>
                <div>E-Posta: <strong className="text-slate-800">{candidate.email}</strong></div>
                <div>Pasaport: <strong className="text-slate-800">{candidate.passport_number || 'Eksik'}</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Belgelerim */}
        {activeTab === 'documents' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-600" /> Belgelerim & Onay Durumları
            </h3>

            <div className="space-y-3">
              {candidateDocs.map((doc: any) => (
                <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">{doc.name}</div>
                      <div className="text-slate-400">{doc.file_name || 'Dosya bekleniyor'}</div>
                    </div>
                  </div>

                  <span className={`px-3 py-1.5 rounded-lg font-bold uppercase text-[10px] ${
                    doc.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {doc.status === 'approved' ? '🟢 Onaylandı' : '🟡 Beklemede / İnceleniyor'}
                  </span>
                </div>
              ))}

              {candidateDocs.length === 0 && (
                <div className="text-center text-slate-400 py-8 text-xs">Henüz listenize eklenmiş evrak bulunmuyor.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Destek Talebi */}
        {activeTab === 'support' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-amber-600" /> PANOVA Operasyon Ekibine Destek Talebi İletin
            </h3>

            {supportSubmitted ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl font-bold text-xs text-center">
                Talebiniz alınmıştır! Operasyon ekibimiz en kısa sürede sizinle iletişime geçecektir.
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  rows={4}
                  value={supportNote}
                  onChange={(e) => setSupportNote(e.target.value)}
                  placeholder="Belge, konaklama, seyahat veya resmi işlemlerle ilgili sorunuzu yazınız..."
                  className="w-full p-4 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-[#2e7d32]"
                />
                <button
                  onClick={() => setSupportSubmitted(true)}
                  className="bg-[#2e7d32] text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[#1b5e20] transition cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Talebi Gönder
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}