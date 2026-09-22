'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Lock, ShieldCheck, Search, Filter, Languages, ArrowLeft, Award, Video, 
  CheckCircle, Clock, Star, Calendar, Building2, Users, FileText, Plane, AlertCircle, Briefcase, UserCheck, User, CheckSquare, Plus, UserPlus 
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
  
  // Sekmeler: 'overview' | 'candidates' | 'requests' | 'staff' | 'tasks' | 'employers' | 'matching' | 'travel' | 'employees' | 'support'
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'requests' | 'staff' | 'tasks' | 'employers' | 'matching' | 'travel' | 'employees' | 'support'>('overview');
  
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobRequests, setJobRequests] = useState<any[]>([]);
  const [employers, setEmployers] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  
  // Dinamik Ekip Üyeleri Listesi (Varsayılan kurucu ve operasyon kadrosu)
  const [staffMembers, setStaffMembers] = useState<any[]>([
    { id: '1', name: 'Hüseyin Aksu', email: 'huseyin@panova.com', role: 'Admin / Kurucu' },
    { id: '2', name: 'Mehmet Çitil', email: 'mehmet@panova.com', role: 'Ortak / Operasyon' },
    { id: '3', name: 'Aleksandar Petrov', email: 'aleksandar@panova.com', role: 'Bölge Sorumlusu' },
    { id: '4', name: 'Rabia Aksu', email: 'rabia@panova.com', role: 'İnsan Kaynakları' }
  ]);

  const [tasks, setTasks] = useState<any[]>([
    { id: '1', title: 'Pasaport ve vize evraklarını kontrol et', assignee: 'Hüseyin Aksu', due_date: '2026-10-01', status: 'pending' },
    { id: '2', title: 'PANOVA Construction işverenini ara', assignee: 'Mehmet Çitil', due_date: '2026-09-25', status: 'completed' },
    { id: '3', title: 'Elektrikçi adayları için mülakat planla', assignee: 'Aleksandar Petrov', due_date: '2026-09-28', status: 'pending' }
  ]);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Toplu işlem state'leri
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('reviewing');
  const [bulkAssignee, setBulkAssignee] = useState('Hüseyin Aksu');

  // Yeni ekip üyesi ekleme state'leri
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Operasyon Uzmanı');

  // Yeni görev ekleme state'leri
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Hüseyin Aksu');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

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
    // Hem genel admin hem de ekip üyeleri giriş yapabilir
    if ((username === 'admin' && password === 'panova2026') || staffMembers.some(s => s.email === username)) {
      setAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('panova_admin_auth', 'true');
      }
      fetchAllData();
    } else {
      alert('Geçersiz kullanıcı adı veya şifre! (admin / panova2026 veya ekip e-postası)');
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('panova_admin_auth');
    }
  };

  const updateCandidateStatus = async (id: string, newStatus: string) => {
    await supabase.from('job_candidates').update({ status: newStatus }).eq('id', id);
    setCandidates(candidates.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const updateRequestStatus = async (id: string, newStatus: string) => {
    await supabase.from('job_requests').update({ status: newStatus }).eq('id', id);
    setJobRequests(jobRequests.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const updateCandidateAssignee = async (id: string, assignee: string) => {
    await supabase.from('job_candidates').update({ assigned_to: assignee }).eq('id', id);
    setCandidates(candidates.map(c => c.id === id ? { ...c, assigned_to: assignee } : c));
  };

  const updateRequestAssignee = async (id: string, assignee: string) => {
    await supabase.from('job_requests').update({ assigned_to: assignee }).eq('id', id);
    setJobRequests(jobRequests.map(r => r.id === id ? { ...r, assigned_to: assignee } : r));
  };

  const toggleVerification = async (id: string, currentVerified: boolean) => {
    const { error } = await supabase.from('job_candidates').update({ is_verified: !currentVerified }).eq('id', id);
    if (!error) setCandidates(candidates.map(c => c.id === id ? { ...c, is_verified: !currentVerified } : c));
  };

  // Yeni Ekip Üyesi Ekleme Fonksiyonu
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;

    const newStaff = {
      id: Date.now().toString(),
      name: newStaffName,
      email: newStaffEmail,
      role: newStaffRole
    };

    setStaffMembers([...staffMembers, newStaff]);
    setNewStaffName('');
    setNewStaffEmail('');
    alert('Yeni ekip üyesi başarıyla eklendi!');
  };

  // Toplu İşlemler
  const handleSelectAllCandidates = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCandidateIds(filteredCandidates.map(c => c.id));
    } else {
      setSelectedCandidateIds([]);
    }
  };

  const handleToggleCandidateSelect = (id: string) => {
    if (selectedCandidateIds.includes(id)) {
      setSelectedCandidateIds(selectedCandidateIds.filter(i => i !== id));
    } else {
      setSelectedCandidateIds([...selectedCandidateIds, id]);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedCandidateIds.length === 0) return alert('Lütfen en az bir aday seçin!');
    for (const id of selectedCandidateIds) {
      await supabase.from('job_candidates').update({ status: bulkStatus }).eq('id', id);
    }
    setCandidates(candidates.map(c => selectedCandidateIds.includes(c.id) ? { ...c, status: bulkStatus } : c));
    setSelectedCandidateIds([]);
    alert('Seçilen adayların durumu güncellendi!');
  };

  const handleBulkAssigneeUpdate = async () => {
    if (selectedCandidateIds.length === 0) return alert('Lütfen en az bir aday seçin!');
    for (const id of selectedCandidateIds) {
      await supabase.from('job_candidates').update({ assigned_to: bulkAssignee }).eq('id', id);
    }
    setCandidates(candidates.map(c => selectedCandidateIds.includes(c.id) ? { ...c, assigned_to: bulkAssignee } : c));
    setSelectedCandidateIds([]);
    alert('Seçilen adayların sorumlusu güncellendi!');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      assignee: newTaskAssignee,
      due_date: newTaskDueDate || '2026-10-15',
      status: 'pending'
    };
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setNewTaskDueDate('');
    alert('Görev eklendi!');
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: t.status === 'pending' ? 'completed' : 'pending' } : t));
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
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kullanıcı Adı veya E-Posta</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                placeholder="admin veya huseyin@panova.com"
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
          <div className="mt-4 text-xs text-slate-600 bg-slate-100 p-2.5 rounded-xl">
            Demo Admin: <strong>admin</strong> / <strong>panova2026</strong> <br />
            Personel E-Posta ile de giriş yapabilirsiniz.
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

        {/* Tab Navigation (Ekip ve Yetkiler Sekmesi Eklendi) */}
        <div className="flex flex-wrap gap-2 border-b pb-2 overflow-x-auto text-xs font-bold">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'overview' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📊 Genel Durum
          </button>
          <button onClick={() => setActiveTab('candidates')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'candidates' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            👥 Aday Havuzu ({candidates.length})
          </button>
          <button onClick={() => setActiveTab('requests')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'requests' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📁 Personel Talepleri ({jobRequests.length})
          </button>
          <button onClick={() => setActiveTab('staff')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'staff' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            🛡️ Ekip & Yetkiler ({staffMembers.length})
          </button>
          <button onClick={() => setActiveTab('tasks')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'tasks' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            ✅ Görevler ({tasks.filter(t => t.status === 'pending').length})
          </button>
          <button onClick={() => setActiveTab('employers')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'employers' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            🏢 İşverenler ({employers.length})
          </button>
          <button onClick={() => setActiveTab('matching')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'matching' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            🔗 Eşleştirmeler
          </button>
          <button onClick={() => setActiveTab('travel')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'travel' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            ✈️ Seyahatler & Vize
          </button>
          <button onClick={() => setActiveTab('employees')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'employees' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            🛡️ Aktif Çalışanlar
          </button>
          <button onClick={() => setActiveTab('support')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'support' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            💬 Sorunlar ({supportTickets.length})
          </button>
        </div>

        {/* Tab 1: Genel Durum */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-slate-500 text-xs font-bold uppercase">Toplam Aday</div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">{candidates.length}</div>
                </div>
                <Users className="w-10 h-10 text-emerald-600 bg-emerald-50 p-2 rounded-xl" />
              </div>

              <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-slate-500 text-xs font-bold uppercase">Aktif İşverenler</div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">{employers.length}</div>
                </div>
                <Building2 className="w-10 h-10 text-blue-600 bg-blue-50 p-2 rounded-xl" />
              </div>

              <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-slate-500 text-xs font-bold uppercase">Ekip Kadrosu</div>
                  <div className="text-3xl font-extrabold text-indigo-600 mt-1">{staffMembers.length}</div>
                </div>
                <UserCheck className="w-10 h-10 text-indigo-600 bg-indigo-50 p-2 rounded-xl" />
              </div>

              <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-slate-500 text-xs font-bold uppercase">Açık Görevler</div>
                  <div className="text-3xl font-extrabold text-emerald-700 mt-1">{tasks.filter(t => t.status === 'pending').length}</div>
                </div>
                <CheckSquare className="w-10 h-10 text-emerald-600 bg-emerald-50 p-2 rounded-xl" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">PANOVA Operasyon Özeti</h3>
              <p className="text-xs text-slate-600">
                Sistem üzerinden aday başvurularını yönetebilir, dinamik ekip üyelerine dosya ataması yapabilir ve tüm operasyonu takip edebilirsiniz.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Aday Havuzu (Dinamik Sorumlu Listesi ile) */}
        {activeTab === 'candidates' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Aday adı, pasaport veya meslek ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none text-slate-900 font-medium bg-white"
                />
              </div>

              {selectedCandidateIds.length > 0 && (
                <div className="flex items-center gap-2 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-900 px-2">{selectedCandidateIds.length} Seçildi</span>
                  <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="text-xs p-1.5 rounded-lg border bg-white font-bold">
                    <option value="pending">Beklemede</option>
                    <option value="reviewing">İnceleniyor</option>
                    <option value="visa_processing">Vize İşlemde</option>
                    <option value="approved">Onaylandı</option>
                  </select>
                  <button onClick={handleBulkStatusUpdate} className="bg-[#2e7d32] text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-[#1b5e20]">
                    Toplu Durum Değiştir
                  </button>
                  <select value={bulkAssignee} onChange={(e) => setBulkAssignee(e.target.value)} className="text-xs p-1.5 rounded-lg border bg-white font-bold ml-2">
                    {staffMembers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                  <button onClick={handleBulkAssigneeUpdate} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-800">
                    Sorumlu Ata
                  </button>
                </div>
              )}

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2.5 rounded-xl border text-sm font-semibold text-slate-700 bg-white cursor-pointer"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="pending">Beklemede</option>
                <option value="reviewing">İnceleniyor</option>
                <option value="visa_processing">Vize İşlemde</option>
                <option value="approved">Onaylandı</option>
              </select>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b">
                    <tr>
                      <th className="p-4 w-10">
                        <input type="checkbox" onChange={handleSelectAllCandidates} checked={selectedCandidateIds.length === filteredCandidates.length && filteredCandidates.length > 0} className="cursor-pointer" />
                      </th>
                      <th className="p-4">Aday</th>
                      <th className="p-4">Pasaport / Uyruk</th>
                      <th className="p-4">Meslek / Sektör</th>
                      <th className="p-4">🛡️ PANOVA Sorumlusu</th>
                      <th className="p-4">Vize Durumu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCandidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <input type="checkbox" checked={selectedCandidateIds.includes(candidate.id)} onChange={() => handleToggleCandidateSelect(candidate.id)} className="cursor-pointer" />
                        </td>
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
                        {/* Dinamik Ekip Üyesi Listesinden Sorumlu Seçimi */}
                        <td className="p-4">
                          <select
                            value={candidate.assigned_to || staffMembers[0]?.name}
                            onChange={(e) => updateCandidateAssignee(candidate.id, e.target.value)}
                            className="px-3 py-1.5 rounded-lg border text-xs font-bold bg-emerald-50 text-emerald-900 cursor-pointer outline-none"
                          >
                            {staffMembers.map((staff) => (
                              <option key={staff.id} value={staff.name}>{staff.name} ({staff.role})</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4">
                          <select
                            value={candidate.status || 'pending'}
                            onChange={(e) => updateCandidateStatus(candidate.id, e.target.value)}
                            className="px-3 py-1.5 rounded-lg border text-xs font-bold uppercase cursor-pointer bg-slate-50 text-slate-900"
                          >
                            <option value="pending">🟡 Beklemede</option>
                            <option value="reviewing">🔵 İnceleniyor</option>
                            <option value="visa_processing">🟣 Vize İşlemde</option>
                            <option value="approved">🟢 Onaylandı</option>
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
                    <th className="p-4">İşveren Şirket</th>
                    <th className="p-4">Pozisyon / Sektör</th>
                    <th className="p-4">Kişi Sayısı</th>
                    <th className="p-4">🛡️ Sorumlu Yetkili</th>
                    <th className="p-4">Talep Durumu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-900">{req.employer_name}</td>
                      <td className="p-4 font-bold text-slate-800">{req.position_title} <span className="text-xs text-slate-400 uppercase">({req.sector})</span></td>
                      <td className="p-4 font-bold">{req.headcount} Kişi</td>
                      <td className="p-4">
                        <select
                          value={req.assigned_to || staffMembers[0]?.name}
                          onChange={(e) => updateRequestAssignee(req.id, e.target.value)}
                          className="px-3 py-1.5 rounded-lg border text-xs font-bold bg-blue-50 text-blue-900 cursor-pointer outline-none"
                        >
                          {staffMembers.map((staff) => (
                            <option key={staff.id} value={staff.name}>{staff.name}</option>
                          ))}
                        </select>
                      </td>
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

        {/* Tab 4: Ekip ve Yetkiler (Staff Management) */}
        {activeTab === 'staff' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 h-fit">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-700" /> Yeni Ekip Üyesi Ekle
              </h3>
              <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Ad Soyad *</label>
                  <input type="text" required value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} placeholder="Örn: Ahmet Yılmaz" className="w-full px-3 py-2.5 rounded-xl border outline-none font-medium text-slate-900 bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">E-Posta (Giriş için) *</label>
                  <input type="email" required value={newStaffEmail} onChange={(e) => setNewStaffEmail(e.target.value)} placeholder="ahmet@panova.com" className="w-full px-3 py-2.5 rounded-xl border outline-none font-medium text-slate-900 bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Rol / Unvan</label>
                  <input type="text" value={newStaffRole} onChange={(e) => setNewStaffRole(e.target.value)} placeholder="Operasyon Uzmanı" className="w-full px-3 py-2.5 rounded-xl border outline-none font-medium text-slate-900 bg-white" />
                </div>
                <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3 rounded-xl font-bold transition cursor-pointer shadow-md">
                  Ekip Üyesini Kaydet
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-3">PANOVA Operasyon Kadrosu</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {staffMembers.map((staff) => (
                  <div key={staff.id} className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{staff.name}</h4>
                      <p className="text-xs text-slate-500">{staff.email}</p>
                      <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                        {staff.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Görevler */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 h-fit">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-700" /> Yeni Görev Ata
              </h3>
              <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Görev Açıklaması *</label>
                  <input type="text" required value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Örn: Pasaport fotokopisini doğrula" className="w-full px-3 py-2.5 rounded-xl border outline-none font-medium text-slate-900 bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Sorumlu Kişi</label>
                  <select value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border font-bold bg-white cursor-pointer">
                    {staffMembers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Son Tarih</label>
                  <input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border font-medium bg-white" />
                </div>
                <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3 rounded-xl font-bold transition cursor-pointer shadow-md">
                  Görevi Kaydet ve Ata
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Ekip Görevleri ve Yapılacaklar Listesi</h3>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className={`p-4 rounded-2xl border flex items-center justify-between transition ${task.status === 'completed' ? 'bg-slate-50 opacity-60' : 'bg-white shadow-sm'}`}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={task.status === 'completed'} onChange={() => toggleTaskStatus(task.id)} className="w-5 h-5 accent-[#2e7d32] cursor-pointer" />
                      <div>
                        <h4 className={`font-bold text-sm ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{task.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Sorumlu: <strong>{task.assignee}</strong> | Son Tarih: {task.due_date}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                      {task.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: İşverenler */}
        {activeTab === 'employers' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Kayıtlı İşveren Firmalar</h3>
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

        {/* Diğer Tablar (Matching, Travel, Employees, Support) */}
        {activeTab === 'matching' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Eşleştirmeler</h3>
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">Aktif eşleştirme kuyruğu boş.</div>
          </div>
        )}
        {activeTab === 'travel' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Seyahatler & Vize</h3>
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">Vize onaylanan personellerin planları burada yer alır.</div>
          </div>
        )}
        {activeTab === 'employees' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Aktif Çalışanlar (30/60/90)</h3>
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">Aktif çalışan bulunmuyor.</div>
          </div>
        )}
        {activeTab === 'support' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Sorunlar / Bildirimler</h3>
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