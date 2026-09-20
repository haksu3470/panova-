'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, ShieldCheck, Search, Filter, Languages, ArrowLeft, Award, Video, CheckCircle, Clock, Star, Calendar, Building2, Users } from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function PortalPage() {
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'candidates' | 'requests'>('candidates');
  
  // Data States
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobRequests, setJobRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCandidateForFollowup, setSelectedCandidateForFollowup] = useState<any | null>(null);

  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'ar';
  const selectableLanguages = languages.filter((lang) => lang.code !== 'en');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'panova2026') {
      setAuthenticated(true);
      fetchCandidates();
      fetchJobRequests();
    } else {
      alert('Invalid username or password!');
    }
  };

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

  const fetchJobRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setJobRequests(data);
    }
    setLoading(false);
  };

  const updateCandidateStatus = async (id: string, newStatus: string) => {
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

  const updateRequestStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('job_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setJobRequests(jobRequests.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } else {
      alert('Update Error: ' + error.message);
    }
  };

  const toggleVerification = async (id: string, currentVerified: boolean) => {
    const { error } = await supabase
      .from('job_candidates')
      .update({ is_verified: !currentVerified })
      .eq('id', id);

    if (!error) {
      setCandidates(candidates.map(c => c.id === id ? { ...c, is_verified: !currentVerified } : c));
    }
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
            onChange={(e) => setCurrentLang(e.target.value as Language)}
            className="bg-transparent text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer"
          >
            {currentLang === 'en' && <option value="en" disabled>🌐 Language</option>}
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none"
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-lg mt-2 cursor-pointer"
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-1">
              <ShieldCheck className="w-4 h-4" /> {t.authSystem}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">{t.mgmtTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex items-center bg-slate-100 rounded-lg px-2.5 py-1.5 border border-slate-200">
              <Languages className="w-4 h-4 text-slate-600 mr-1.5 rtl:ml-1.5" />
              <select
                value={currentLang}
                onChange={(e) => setCurrentLang(e.target.value as Language)}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                {currentLang === 'en' && <option value="en" disabled>🌐 Language</option>}
                {selectableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setAuthenticated(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
            >
              {t.logoutBtn}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => { setActiveTab('candidates'); fetchCandidates(); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition cursor-pointer ${
              activeTab === 'candidates'
                ? 'bg-[#2e7d32] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> {currentLang === 'tr' ? 'Aday Havuzu' : 'Candidate Pool'} ({candidates.length})
          </button>

          <button
            onClick={() => { setActiveTab('requests'); fetchJobRequests(); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-[#2e7d32] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" /> {t.dossierTitle} ({jobRequests.length})
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:right-3 rtl:left-auto top-3.5" />
            <input
              type="text"
              placeholder={activeTab === 'candidates' ? t.searchPlaceholder : (currentLang === 'tr' ? "İşveren, pozisyon veya sektor ara..." : "Search employer, position or sector...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 rtl:pr-9 rtl:pl-4 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-[#2e7d32] text-slate-900 font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 outline-none cursor-pointer bg-white"
            >
              <option value="all">{t.allStatuses}</option>
              {activeTab === 'candidates' ? (
                <>
                  <option value="pending">{t.pendingStatus}</option>
                  <option value="reviewing">{t.reviewingStatus}</option>
                  <option value="visa_processing">{t.visaProcessingStatus}</option>
                  <option value="approved">{t.approvedStatus}</option>
                </>
              ) : (
                <>
                  <option value="new_request">{currentLang === 'tr' ? 'Yeni Talep' : 'New Request'}</option>
                  <option value="searching_candidates">{currentLang === 'tr' ? 'Aday Aranıyor' : 'Searching Candidates'}</option>
                  <option value="candidates_submitted">{currentLang === 'tr' ? 'Adaylar Sunuldu' : 'Candidates Submitted'}</option>
                  <option value="completed">{currentLang === 'tr' ? 'Tamamlandı' : 'Completed'}</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* TAB 1: Candidates Table */}
        {activeTab === 'candidates' && (
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
                      <th className="p-4">{currentLang === 'tr' ? 'Sertifika & Video' : 'Certificate & Video'}</th>
                      <th className="p-4">{currentLang === 'tr' ? 'Ücret & Vardiya' : 'Salary & Shift'}</th>
                      <th className="p-4">{t.colVisaStatus}</th>
                      <th className="p-4">{currentLang === 'tr' ? '30-60-90 Gün Takip' : '30-60-90 Tracking'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCandidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            {candidate.full_name}
                            <button
                              onClick={() => toggleVerification(candidate.id, candidate.is_verified)}
                              title={candidate.is_verified ? 'Verified Certificate' : 'Click to Verify'}
                              className={`p-1 rounded-full transition cursor-pointer ${candidate.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400 hover:text-emerald-600'}`}
                            >
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
                        <td className="p-4">
                          <div className="text-xs space-y-1">
                            {candidate.certificate_no ? (
                              <div className="flex items-center gap-1 text-slate-700 font-medium">
                                <Award className="w-3.5 h-3.5 text-amber-500" />
                                {candidate.certificate_no} ({candidate.issuing_body || 'N/A'})
                              </div>
                            ) : (
                              <span className="text-slate-400">{currentLang === 'tr' ? 'Sertifika Yok' : 'No Cert'}</span>
                            )}
                            {candidate.video_url && (
                              <a
                                href={candidate.video_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-semibold"
                              >
                                <Video className="w-3.5 h-3.5" /> {currentLang === 'tr' ? 'Videoyu İzle' : 'Watch Video'}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-xs font-semibold">
                          <div>{candidate.expected_salary ? `€${candidate.expected_salary} / ${currentLang === 'tr' ? 'ay' : 'month'}` : 'N/A'}</div>
                          <div className="text-slate-400 font-normal">
                            {candidate.shift_suitable ? (currentLang === 'tr' ? 'Vardiyaya Uygun' : 'Shift Suitable') : (currentLang === 'tr' ? 'Standart Vardiya' : 'Standard Shift')}
                          </div>
                        </td>
                        <td className="p-4">
                          <select
                            value={candidate.status || 'pending'}
                            onChange={(e) => updateCandidateStatus(candidate.id, e.target.value)}
                            className="px-3 py-1.5 rounded-lg border text-xs font-bold uppercase cursor-pointer outline-none bg-slate-50 text-slate-900"
                          >
                            <option value="pending">🟡 {t.pendingStatus}</option>
                            <option value="reviewing">🔵 {t.reviewingStatus}</option>
                            <option value="visa_processing">🟣 {t.visaProcessingStatus}</option>
                            <option value="approved">🟢 {t.approvedStatus}</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => setSelectedCandidateForFollowup(candidate)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-[#2e7d32] border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" /> {currentLang === 'tr' ? 'Süreci Takip Et' : 'Track Period'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredCandidates.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          {t.noRecords}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Employer Job Requests Table */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500">{t.submitting}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left rtl:text-right text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100">
                    <tr>
                      <th className="p-4">{currentLang === 'tr' ? 'İşveren Şirket' : 'Employer Company'}</th>
                      <th className="p-4">{t.colPosSec}</th>
                      <th className="p-4">{t.colHeadcount}</th>
                      <th className="p-4">{t.colSalary}</th>
                      <th className="p-4">{t.colBenefits}</th>
                      <th className="p-4">{t.colDemandStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">
                          {req.employer_name}
                          <div className="text-xs text-slate-400 font-normal">{currentLang === 'tr' ? 'Tarih' : 'Created'}: {new Date(req.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {req.position_title}
                          <div className="text-xs text-slate-400 font-normal uppercase">{req.sector}</div>
                        </td>
                        <td className="p-4 font-bold text-slate-800">{req.headcount} {currentLang === 'tr' ? 'Kişi' : 'Person(s)'}</td>
                        <td className="p-4 font-semibold text-emerald-700">€{req.monthly_net_salary} / {currentLang === 'tr' ? 'ay' : 'mo'}</td>
                        <td className="p-4 text-xs space-y-1 text-slate-500">
                          <div>{t.accommodation}: {req.accommodation_provided ? (currentLang === 'tr' ? '✅ Karşılanıyor' : '✅ Covered') : '❌'}</div>
                          <div>{t.foodAllowance} / {t.flightTicket}: {req.food_provided ? '✅' : '❌'} | {req.flight_covered ? '✅' : '❌'}</div>
                        </td>
                        <td className="p-4">
                          <select
                            value={req.status || 'new_request'}
                            onChange={(e) => updateRequestStatus(req.id, e.target.value)}
                            className="px-3 py-1.5 rounded-lg border text-xs font-bold uppercase cursor-pointer outline-none bg-slate-50 text-slate-900"
                          >
                            <option value="new_request">🟡 {currentLang === 'tr' ? 'Yeni Talep' : 'New Request'}</option>
                            <option value="searching_candidates">🔵 {currentLang === 'tr' ? 'Aday Aranıyor' : 'Searching Candidates'}</option>
                            <option value="candidates_submitted">🟣 {currentLang === 'tr' ? 'Adaylar Sunuldu' : 'Candidates Submitted'}</option>
                            <option value="completed">🟢 {currentLang === 'tr' ? 'Tamamlandı' : 'Completed'}</option>
                            <option value="cancelled">🔴 {currentLang === 'tr' ? 'İptal Edildi' : 'Cancelled'}</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {filteredRequests.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          {currentLang === 'tr' ? 'İşveren talebi bulunamadı.' : 'No employer demand dossiers found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 30-60-90 Tracking Modal */}
        {selectedCandidateForFollowup && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">{currentLang === 'tr' ? 'Yerleştirme Takip Sistemi' : 'Placement Follow-up Tracking'}</h3>
                  <p className="text-xs text-slate-500">{currentLang === 'tr' ? 'Aday' : 'Candidate'}: {selectedCandidateForFollowup.full_name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCandidateForFollowup(null)}
                  className="text-[#2e7d32] font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <div>
                      <div className="font-bold text-sm text-slate-800">{currentLang === 'tr' ? '1. Hafta Kontrolü' : 'Week 1 Check'}</div>
                      <div className="text-xs text-slate-500">{currentLang === 'tr' ? 'Varış & Konaklama Denetimi' : 'Arrival & Accommodation Audit'}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-bold">{currentLang === 'tr' ? 'Tamamlandı' : 'Completed'}</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-bold text-sm text-slate-800">{currentLang === 'tr' ? '30. Gün Değerlendirmesi' : 'Day 30 Review'}</div>
                      <div className="text-xs text-slate-500">{currentLang === 'tr' ? 'İş Uyum Durumu & Maaş Kontrolü' : 'Workforce Adaptation & Salary Status'}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-bold">{currentLang === 'tr' ? 'Devam Ediyor' : 'In Progress'}</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="font-bold text-sm text-slate-800">{currentLang === 'tr' ? '60. ve 90. Gün Takibi' : 'Day 60 & 90 Assessment'}</div>
                      <div className="text-xs text-slate-500">{currentLang === 'tr' ? 'Uzun Dönem Performans Değerlendirmesi' : 'Long-term Performance & Compliance'}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-200 text-slate-600 rounded-md text-xs font-bold">{currentLang === 'tr' ? 'Bekliyor' : 'Upcoming'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCandidateForFollowup(null)}
                className="w-full mt-6 bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3 rounded-xl font-bold text-sm transition cursor-pointer"
              >
                {currentLang === 'tr' ? 'Kapat' : 'Close Tracking View'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}