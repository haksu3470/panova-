'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Lock, ShieldCheck, Search, Filter, Languages, ArrowLeft, Award, Video, 
  CheckCircle, Clock, Star, Calendar, Building2, Users, FileText, Plane, AlertCircle, Briefcase, UserCheck 
} from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function PortalPage() {
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('panova_portal_lang') as Language;
      if (saved && ['tr', 'en', 'sq', 'ar'].includes(saved)) return saved;
    }
    return 'en';
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

  const [authenticated, setAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('panova_admin_auth') === 'true';
    }
    return false;
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'requests' | 'employers' | 'matching' | 'travel' | 'employees' | 'support'>('overview');
  
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobRequests, setJobRequests] = useState<any[]>([]);
  const [employers, setEmployers] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'ar';
  
  const selectableLanguages = languages.filter((lang) => lang.code !== currentLang);
  const activeLangObj = languages.find((l) => l.code === currentLang);

  useEffect(() => {
    if (authenticated) {
      fetchAllData();
    }
  }, [authenticated]);

  const fetchAllData = async () => {
    setLoading(true);
    const { data: candData } = await supabase.from('job_candidates').select('*').order('created_at', { ascending: false });
    if (candData) setCandidates(candData);

    const { data: reqData } = await supabase.from('job_requests').select('*').order('created_at', { ascending: false });
    if (reqData) setJobRequests(reqData);

    const { data: empData } = await supabase.from('employers').select('*').order('created_at', { ascending: false });
    if (empData) setEmployers(empData);

    const { data: ticketData } = await supabase.from('candidate_support_tickets').select('*').order('created_at', { ascending: false });
    if (ticketData) setSupportTickets(ticketData);

    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'panova2026') {
      setAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('panova_admin_auth', 'true');
      }
      fetchAllData();
    } else {
      alert('Invalid username or password! (admin / panova2026)');
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('panova_admin_auth');
    }
  };

  const updateCandidateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('job_candidates').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setCandidates(candidates.map(c => c.id === id ? { ...c, status: newStatus } : c));
    }
  };

  const updateRequestStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('job_requests').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setJobRequests(jobRequests.map(r => r.id === id ? { ...r, status: newStatus } : r));
    }
  };

  const toggleVerification = async (id: string, currentVerified: boolean) => {
    const { error } = await supabase.from('job_candidates').update({ is_verified: !currentVerified }).eq('id', id);
    if (!error) setCandidates(candidates.map(c => c.id === id ? { ...c, is_verified: !currentVerified } : c));
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.passport_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.profession?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredRequests = jobRequests.filter(r => {
    const matchesSearch = r.employer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.position_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.sector?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  if (!authenticated) {
    return (
      <div className={`min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="absolute top-6 right-6 flex items-center bg-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-700 shadow-sm">
          <Languages className="w-4 h-4 text-slate-300 mr-1.5 rtl:ml-1.5" />
          <select
            value={currentLang}
            onChange={(e) => changeLanguage(e.target.value as Language)}
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-lg mt-2 cursor-pointer text-sm"
            >
              {t.signInBtn}
            </button>
          </form>
          <div className="mt-4 text-xs text-slate-600 bg-slate-100 p-2 rounded-xl">
            Demo Login: <strong>admin</strong> / <strong>panova2026</strong>
          </div>
          <Link href="/" className="inline-flex items-center gap-1.5 mt-6 text-sm text-slate-500 hover:underline">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 p-4 sm:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PANOVA" className="h-10 w-auto object-contain" />
            <div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> {t.authSystem}
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">{t.mgmtTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition border"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome}
            </Link>

            <div className="relative flex items-center bg-slate-100 rounded-lg px-2.5 py-1.5 border border-slate-200">
              <Languages className="w-4 h-4 text-slate-600 mr-1.5 rtl:ml-1.5" />
              <select
                value={currentLang}
                onChange={(e) => changeLanguage(e.target.value as Language)}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value={currentLang} className="font-bold">
                  {activeLangObj?.flag} {activeLangObj?.name}
                </option>
                {selectableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {t.logoutBtn}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b pb-2 overflow-x-auto text-xs font-bold">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'overview' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📊 {t.overviewTab || 'Genel Durum'}
          </button>
          <button onClick={() => setActiveTab('candidates')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'candidates' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            👥 {t.candidatesTab || 'Aday Havuzu'} ({candidates.length})
          </button>
          <button onClick={() => setActiveTab('requests')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'requests' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📁 {t.requestsTab || 'Personel Talepleri'} ({jobRequests.length})
          </button>
          <button onClick={() => setActiveTab('employers')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'employers' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            🏢 {t.employersTab || 'İşverenler'} ({employers.length})
          </button>
          <button onClick={() => setActiveTab('matching')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'matching' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            🔗 {t.matchingTab || 'Eşleştirmeler'}
          </button>
          <button onClick={() => setActiveTab('travel')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'travel' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            ✈️ {t.travelTab || 'Seyahatler & Vize'}
          </button>
          <button onClick={() => setActiveTab('employees')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'employees' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            🛡️ {t.employeesTab || 'Aktif Çalışanlar'}
          </button>
          <button onClick={() => setActiveTab('support')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'support' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            💬 {t.supportTab || 'Sorunlar / Bildirimler'} ({supportTickets.length})
          </button>
        </div>

        {/* Tab 1: Genel Durum (Overview) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-slate-500 text-xs font-bold uppercase">{t.totalCandidatesCard || 'TOPLAM ADAY'}</div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">{candidates.length}</div>
                </div>
                <Users className="w-10 h-10 text-emerald-600 bg-emerald-50 p-2 rounded-xl" />
              </div>

              <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-slate-500 text-xs font-bold uppercase">{t.activeEmployersCard || 'AKTİF İŞVERENLER'}</div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">{employers.length}</div>
                </div>
                <Building2 className="w-10 h-10 text-blue-600 bg-blue-50 p-2 rounded-xl" />
              </div>

              <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-slate-500 text-xs font-bold uppercase">{t.openRequestsCard || 'AÇIK TALEPLER'}</div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">{jobRequests.filter(r => r.status !== 'completed').length}</div>
                </div>
                <FileText className="w-10 h-10 text-amber-600 bg-amber-50 p-2 rounded-xl" />
              </div>

              <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-slate-500 text-xs font-bold uppercase">{t.openSupportCard || 'AÇIK SORUNLAR / DESTEK'}</div>
                  <div className="text-3xl font-extrabold text-red-600 mt-1">{supportTickets.filter(st => st.status === 'open').length}</div>
                </div>
                <AlertCircle className="w-10 h-10 text-red-600 bg-red-50 p-2 rounded-xl" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">{t.portalSummaryTitle || 'PANOVA Operasyon Özeti'}</h3>
              <p className="text-xs text-slate-600">
                {t.portalSummaryDesc || 'Sistem üzerinden aday başvurularını yönetebilir, işverenlerin personel taleplerine aday eşleştirmesi yapabilir, vize ve seyahat süreçlerini takip edebilirsiniz.'}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Aday Havuzu */}
        {activeTab === 'candidates' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder || 'Arama yapın...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none text-slate-900 font-medium bg-white"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2.5 rounded-xl border text-sm font-semibold text-slate-700 bg-white cursor-pointer"
              >
                <option value="all">{t.allstatuses}</option>
                <option value="pending">{t.pendingStatus}</option>
                <option value="reviewing">{t.reviewingStatus}</option>
                <option value="visa_processing">{t.visaProcessingStatus}</option>
                <option value="approved">{t.approvedStatus}</option>
              </select>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b">
                    <tr>
                      <th className="p-4">{t.colCandidate}</th>
                      <th className="p-4">{t.colPassportNat}</th>
                      <th className="p-4">{t.colProfSector}</th>
                      <th className="p-4">{t.certAndVideo}</th>
                      <th className="p-4">{t.colVisaStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCandidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <Link href={`/portal/candidates/${candidate.id}`} className="hover:text-[#2e7d32] hover:underline">
                              {candidate.full_name}
                            </Link>
                            <button onClick={() => toggleVerification(candidate.id, candidate.is_verified)} className={`p-1 rounded-full cursor-pointer ${candidate.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>{candidate.passport_number || 'N/A'}</div>
                          <div className="text-xs text-slate-400">{candidate.nationality}</div>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-slate-800">{candidate.profession}</span>
                          <div className="text-xs text-slate-400 uppercase">{candidate.sector}</div>
                        </td>
                        <td className="p-4 text-xs">
                          {candidate.certificate_no ? <span className="text-amber-700 font-bold">Sertifikalı</span> : 'Yok'} | {candidate.video_url ? <a href={candidate.video_url} target="_blank" rel="noreferrer" className="text-emerald-700 underline">Video</a> : 'Video Yok'}
                        </td>
                        <td className="p-4">
                          <select
                            value={candidate.status || 'pending'}
                            onChange={(e) => updateCandidateStatus(candidate.id, e.target.value)}
                            className="px-3 py-1.5 rounded-lg border text-xs font-bold uppercase cursor-pointer bg-slate-50 text-slate-900"
                          >
                            <option value="pending">🟡 {t.pendingStatus}</option>
                            <option value="reviewing">🔵 {t.reviewingStatus}</option>
                            <option value="visa_processing">🟣 {t.visaProcessingStatus}</option>
                            <option value="approved">🟢 {t.approvedStatus}</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Personel Talepleri */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b">
                  <tr>
                    <th className="p-4">{t.employerCompany}</th>
                    <th className="p-4">{t.colPosSec}</th>
                    <th className="p-4">{t.colHeadcount}</th>
                    <th className="p-4">{t.colSalary}</th>
                    <th className="p-4">{t.colDemandStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-900">{req.employer_name}</td>
                      <td className="p-4 font-bold text-slate-800">{req.position_title} <span className="text-xs text-slate-400 uppercase">({req.sector})</span></td>
                      <td className="p-4 font-bold">{req.headcount} {t.personCount}</td>
                      <td className="p-4 font-semibold text-emerald-700">€{req.monthly_net_salary} / {t.monthText}</td>
                      <td className="p-4">
                        <select
                          value={req.status || 'new_request'}
                          onChange={(e) => updateRequestStatus(req.id, e.target.value)}
                          className="px-3 py-1.5 rounded-lg border text-xs font-bold uppercase cursor-pointer bg-slate-50 text-slate-900"
                        >
                          <option value="new_request">🟡 Yeni Talep</option>
                          <option value="searching_candidates">🔵 Aday Aranıyor</option>
                          <option value="candidates_submitted">🟣 Adaylar Sunuldu</option>
                          <option value="completed">🟢 Tamamlandı</option>
                          <option value="cancelled">🔴 İptal</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: İşverenler */}
        {activeTab === 'employers' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">{t.employersTab || 'Kayıtlı İşveren Firmalar'}</h3>
            {employers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">Kayıtlı işveren bulunmuyor.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employers.map((emp) => (
                  <div key={emp.id} className="p-4 bg-slate-50 rounded-2xl border space-y-2">
                    <h4 className="font-extrabold text-slate-900 text-sm">{emp.company_name}</h4>
                    <p className="text-xs text-slate-500">Yetkili: <strong>{emp.contact_person}</strong> | Ülke: {emp.country}</p>
                    <p className="text-xs text-slate-600">E-Posta: {emp.email} | Tel: {emp.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Eşleştirmeler */}
        {activeTab === 'matching' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">{t.matchingTab || 'Eşleştirmeler'}</h3>
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
              Aktif eşleştirme kuyruğu boş. Talepler üzerinden aday ataması yapabilirsiniz.
            </div>
          </div>
        )}

        {/* Tab 6: Seyahatler & Vize */}
        {activeTab === 'travel' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">{t.travelTab || 'Seyahatler & Vize'}</h3>
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
              Vize onaylanan personellerin biletleme ve karşılama planları burada listelenir.
            </div>
          </div>
        )}

        {/* Tab 7: Aktif Çalışanlar */}
        {activeTab === 'employees' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">{t.employeesTab || 'Aktif Çalışanlar (30/60/90)'}</h3>
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
              İşe başlayan personellerin performans ve adaptasyon takip kayıtları burada yer alır.
            </div>
          </div>
        )}

        {/* Tab 8: Sorunlar / Bildirimler */}
        {activeTab === 'support' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">{t.supportTab || 'Sorunlar / Bildirimler'}</h3>
            {supportTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">Aktif sorun bildirimi bulunmuyor.</div>
            ) : (
              <div className="space-y-3">
                {supportTickets.map((tkt) => (
                  <div key={tkt.id} className="p-4 bg-slate-50 rounded-2xl border space-y-1">
                    <div className="flex justify-between font-bold text-xs text-slate-900">
                      <span>{tkt.subject} ({tkt.candidate_name})</span>
                      <span className="text-red-600 uppercase text-[10px]">{tkt.status}</span>
                    </div>
                    <p className="text-xs text-slate-600">{tkt.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}