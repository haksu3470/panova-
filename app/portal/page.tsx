'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Lock, ShieldCheck, Search, Filter, Languages, ArrowLeft, Award, Video, 
  CheckCircle, Clock, Star, Calendar, Building2, Users, FileText, Plane, AlertCircle, Briefcase, UserCheck, User, CheckSquare, Plus, UserPlus, Settings, History, ShieldAlert, Trash2 
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
  
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'requests' | 'staff' | 'tasks' | 'audit' | 'employers' | 'matching' | 'travel' | 'employees' | 'support'>('overview');
  
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobRequests, setJobRequests] = useState<any[]>([]);
  const [employers, setEmployers] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  
  const [staffMembers, setStaffMembers] = useState<any[]>([
    { id: '1', name: 'Hüseyin Aksu', email: 'huseyin@panova.com', roleLevel: 'upper_management' },
    { id: '2', name: 'Mehmet Çitil', email: 'mehmet@panova.com', roleLevel: 'target_country' },
    { id: '3', name: 'Aleksandar Petrov', email: 'aleksandar@panova.com', roleLevel: 'source_country' },
    { id: '4', name: 'Rabia Aksu', email: 'rabia@panova.com', roleLevel: 'field_officer' }
  ]);

  const [tasks, setTasks] = useState<any[]>([
    { id: '1', title: 'Pasaport ve vize evraklarını kontrol et', assignee: 'Hüseyin Aksu', backup_assignee: 'Aleksandar Petrov', due_date: '2026-10-01', status: 'pending' },
    { id: '2', title: 'PANOVA Construction işveren iş görüşmesi', assignee: 'Mehmet Çitil', backup_assignee: 'Rabia Aksu', due_date: '2026-09-25', status: 'completed' }
  ]);

  const [auditLogs, setAuditLogs] = useState<any[]>([
    { id: '1', action: 'Sistem Başlatıldı & Rol Matrisi Kuruldu', performer: 'Hüseyin Aksu', time: '2026-09-22 12:00' },
    { id: '2', action: 'Aday vize süreci güncellendi', performer: 'Mehmet Çitil', time: '2026-09-22 14:30' }
  ]);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRoleLevel, setNewStaffRoleLevel] = useState('source_country');

  // Personel Düzenleme Modalı State'leri
  const [editingStaff, setEditingStaff] = useState<any | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Hüseyin Aksu');
  const [newTaskBackup, setNewTaskBackup] = useState('Aleksandar Petrov');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'ar';
  
  const selectableLanguages = languages.filter((lang) => lang.code !== currentLang);
  const activeLangObj = languages.find((l) => l.code === currentLang);

  const getRoleText = (level: string) => {
    switch (level) {
      case 'upper_management': return t.roleUpperManagement;
      case 'source_country': return t.roleSourceCountry;
      case 'target_country': return t.roleTargetCountry;
      case 'field_officer': return t.roleFieldOfficer;
      default: return level;
    }
  };

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

  const logAudit = (actionText: string, performerName: string = 'Hüseyin Aksu') => {
    const newLog = {
      id: Date.now().toString(),
      action: actionText,
      performer: performerName,
      time: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if ((username === 'admin' && password === 'panova2026') || staffMembers.some(s => s.email === username)) {
      setAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('panova_admin_auth', 'true');
      }
      logAudit('Sisteme Giriş Yapıldı', username);
      fetchAllData();
    } else {
      alert('Geçersiz kullanıcı adı veya şifre! (admin / panova2026)');
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
    logAudit(`Aday Durumu Değiştirildi -> ${newStatus}`);
  };

  const updateRequestStatus = async (id: string, newStatus: string) => {
    await supabase.from('job_requests').update({ status: newStatus }).eq('id', id);
    setJobRequests(jobRequests.map(r => r.id === id ? { ...r, status: newStatus } : r));
    logAudit(`Talep Durumu Değiştirildi -> ${newStatus}`);
  };

  const updateCandidateAssignee = async (id: string, assignee: string) => {
    await supabase.from('job_candidates').update({ assigned_to: assignee }).eq('id', id);
    setCandidates(candidates.map(c => c.id === id ? { ...c, assigned_to: assignee } : c));
    logAudit(`Aday Sorumlusu Atandı -> ${assignee}`);
  };

  const updateStaffRoleLevel = (staffId: string, newLevel: string) => {
    setStaffMembers(staffMembers.map(s => s.id === staffId ? { ...s, roleLevel: newLevel } : s));
    logAudit(`Personel Rol Seviyesi Güncellendi`);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;

    const newStaff = {
      id: Date.now().toString(),
      name: newStaffName,
      email: newStaffEmail,
      roleLevel: newStaffRoleLevel
    };

    setStaffMembers([...staffMembers, newStaff]);
    logAudit(`Yeni Ekip Üyesi Eklendi: ${newStaffName}`);
    setNewStaffName('');
    setNewStaffEmail('');
    alert('Yeni ekip üyesi başarıyla eklendi!');
  };

  const handleSaveStaffEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setStaffMembers(staffMembers.map(s => s.id === editingStaff.id ? editingStaff : s));
    logAudit(`Personel Bilgileri Düzenlendi: ${editingStaff.name}`);
    setEditingStaff(null);
    alert('Personel bilgileri güncellendi!');
  };

  const handleDeleteStaff = (staffId: string) => {
    if (confirm('Bu personel kaydını silmek istediğinizden emin misiniz?')) {
      setStaffMembers(staffMembers.filter(s => s.id !== staffId));
      logAudit('Personel Kaydı Silindi');
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      assignee: newTaskAssignee,
      backup_assignee: newTaskBackup,
      due_date: newTaskDueDate || '2026-10-15',
      status: 'pending'
    };
    setTasks([newTask, ...tasks]);
    logAudit(`Yeni Görev Atandı: ${newTaskTitle}`);
    setNewTaskTitle('');
    setNewTaskDueDate('');
    alert('Görev ve sorumlu eşleştirmesi kaydedildi!');
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: t.status === 'pending' ? 'completed' : 'pending' } : t));
    logAudit('Görev durumu güncellendi');
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
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center bg-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-700 shadow-sm">
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

        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="w-14 h-14 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-1">{t.portalTitle}</h1>
          <p className="text-slate-500 text-xs sm:text-sm mb-6">{t.portalSub}</p>

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
          <Link href="/" className="inline-flex items-center gap-1.5 mt-6 text-xs sm:text-sm text-slate-500 hover:underline">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PANOVA" className="h-10 w-auto object-contain shrink-0" />
            <div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> {t.authSystem}
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">{t.mgmtTitle}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome}
            </Link>

            <div className="flex items-center bg-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-200">
              <Languages className="w-4 h-4 text-slate-600 mr-1.5 rtl:ml-1.5" />
              <select
                value={currentLang}
                onChange={(e) => changeLanguage(e.target.value as Language)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
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
              className="bg-red-50 hover:bg-red-100 text-red-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {t.logoutBtn}
            </button>
          </div>
        </div>

        {/* Tab Navigation (Mobilde Yatay Kaydırılabilir) */}
        <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto whitespace-nowrap text-xs font-bold scrollbar-none">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'overview' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📊 {t.overviewTab}
          </button>
          <button onClick={() => setActiveTab('candidates')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'candidates' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            👥 {t.candidatesTab} ({candidates.length})
          </button>
          <button onClick={() => setActiveTab('requests')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'requests' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📁 {t.requestsTab} ({jobRequests.length})
          </button>
          <button onClick={() => setActiveTab('staff')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'staff' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            🛡️ {t.staffTab} ({staffMembers.length})
          </button>
          <button onClick={() => setActiveTab('tasks')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'tasks' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            ✅ {t.tasksTab} ({tasks.filter(t => t.status === 'pending').length})
          </button>
          <button onClick={() => setActiveTab('audit')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'audit' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📜 {t.auditTab} ({auditLogs.length})
          </button>
          <button onClick={() => setActiveTab('employers')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'employers' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            🏢 {t.employersTab} ({employers.length})
          </button>
          <button onClick={() => setActiveTab('support')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'support' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            💬 {t.supportTab} ({supportTickets.length})
          </button>
        </div>

        {/* Tab 1: Genel Durum */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-slate-500 text-[11px] sm:text-xs font-bold uppercase">{t.totalCandidatesCard}</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{candidates.length}</div>
                </div>
                <Users className="w-9 h-9 sm:w-10 sm:h-10 text-emerald-600 bg-emerald-50 p-2 rounded-xl" />
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl border shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-slate-500 text-[11px] sm:text-xs font-bold uppercase">{t.activeEmployersCard}</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{employers.length}</div>
                </div>
                <Building2 className="w-9 h-9 sm:w-10 sm:h-10 text-blue-600 bg-blue-50 p-2 rounded-xl" />
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl border shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-slate-500 text-[11px] sm:text-xs font-bold uppercase">{t.staffTab}</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-1">{staffMembers.length}</div>
                </div>
                <UserCheck className="w-9 h-9 sm:w-10 sm:h-10 text-indigo-600 bg-indigo-50 p-2 rounded-xl" />
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl border shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-slate-500 text-[11px] sm:text-xs font-bold uppercase">{t.openSupportCard}</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">{tasks.filter(t => t.status === 'pending').length}</div>
                </div>
                <CheckSquare className="w-9 h-9 sm:w-10 sm:h-10 text-emerald-600 bg-emerald-50 p-2 rounded-xl" />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 sm:p-6 rounded-2xl shadow-sm flex items-start gap-4">
              <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-amber-900 text-xs sm:text-sm">{t.delayAlertsTitle}</h4>
                <p className="text-xs text-amber-800">{t.delayAlertsDesc}</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">{t.portalSummaryTitle}</h3>
              <p className="text-xs sm:text-sm text-slate-600">{t.portalSummaryDesc}</p>
            </div>
          </div>
        )}

        {/* Tab 2: Aday Havuzu */}
        {activeTab === 'candidates' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm outline-none text-slate-900 font-medium bg-white"
                />
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-auto px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold text-slate-700 bg-white cursor-pointer"
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
                <table className="w-full text-left text-xs sm:text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b">
                    <tr>
                      <th className="p-4">{t.colCandidate}</th>
                      <th className="p-4">{t.colPassportNat}</th>
                      <th className="p-4">{t.colProfSector}</th>
                      <th className="p-4">🛡️ Sorumlu</th>
                      <th className="p-4">{t.colVisaStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCandidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">
                          <Link href={`/portal/candidates/${candidate.id}`} className="hover:text-[#2e7d32] hover:underline">
                            {candidate.full_name}
                          </Link>
                        </td>
                        <td className="p-4">
                          <div>{candidate.passport_number || 'N/A'}</div>
                          <div className="text-[11px] text-slate-400">{candidate.nationality}</div>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-slate-800">{candidate.profession}</span>
                          <div className="text-[11px] text-slate-400 uppercase">{candidate.sector}</div>
                        </td>
                        <td className="p-4">
                          <select
                            value={candidate.assigned_to || staffMembers[0]?.name}
                            onChange={(e) => updateCandidateAssignee(candidate.id, e.target.value)}
                            className="px-3 py-1.5 rounded-lg border text-xs font-bold bg-emerald-50 text-emerald-900 cursor-pointer outline-none"
                          >
                            {staffMembers.map((staff) => (
                              <option key={staff.id} value={staff.name}>{staff.name}</option>
                            ))}
                          </select>
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
              <table className="w-full text-left text-xs sm:text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b">
                  <tr>
                    <th className="p-4">{t.employerCompany}</th>
                    <th className="p-4">{t.colPosSec}</th>
                    <th className="p-4">{t.colHeadcount}</th>
                    <th className="p-4">{t.colDemandStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-900">{req.employer_name}</td>
                      <td className="p-4 font-bold text-slate-800">{req.position_title}</td>
                      <td className="p-4 font-bold">{req.headcount} {t.personCount}</td>
                      <td className="p-4">
                        <select
                          value={req.status || 'new_request'}
                          onChange={(e) => updateRequestStatus(req.id, e.target.value)}
                          className="px-3 py-1.5 rounded-lg border text-xs font-bold uppercase cursor-pointer bg-slate-50 text-slate-900"
                        >
                          <option value="new_request">🟡 Yeni Talep</option>
                          <option value="searching_candidates">🔵 Aday Aranıyor</option>
                          <option value="completed">🟢 Tamamlandı</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Ekip & Yönetici Personel Düzenleme */}
        {activeTab === 'staff' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4 h-fit">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-700" /> {t.addStaffTitle}
              </h3>
              <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.staffNameLabel}</label>
                  <input type="text" required value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} placeholder="Ahmet Yılmaz" className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium text-slate-900 bg-white text-xs sm:text-sm" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.staffEmailLabel}</label>
                  <input type="email" required value={newStaffEmail} onChange={(e) => setNewStaffEmail(e.target.value)} placeholder="ahmet@panova.com" className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium text-slate-900 bg-white text-xs sm:text-sm" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.staffPermLabel}</label>
                  <select 
                    value={newStaffRoleLevel} 
                    onChange={(e) => setNewStaffRoleLevel(e.target.value)} 
                    className="w-full px-3.5 py-3 rounded-xl border font-bold bg-white cursor-pointer text-xs sm:text-sm"
                  >
                    <option value="upper_management">👑 {t.roleUpperManagement}</option>
                    <option value="source_country">🌍 {t.roleSourceCountry}</option>
                    <option value="target_country">🏢 {t.roleTargetCountry}</option>
                    <option value="field_officer">✈️ {t.roleFieldOfficer}</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition cursor-pointer shadow-md text-xs sm:text-sm">
                  {t.saveStaffBtn}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span>{t.staffMatrixTitle}</span>
                <span className="text-[11px] font-normal text-slate-500">{t.staffMatrixSub}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {staffMembers.map((staff) => (
                  <div key={staff.id} className="p-4 bg-slate-50 rounded-2xl border space-y-3 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-slate-900 text-sm">{staff.name}</h4>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditingStaff(staff)} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold transition cursor-pointer">Düzenle</button>
                          <button onClick={() => handleDeleteStaff(staff.id)} className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">{staff.email}</p>
                    </div>

                    <div className="pt-2 border-t space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600 block">
                        {t.permLevelText}
                      </span>
                      <select
                        value={staff.roleLevel || 'source_country'}
                        onChange={(e) => updateStaffRoleLevel(staff.id, e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-indigo-50 text-indigo-900 cursor-pointer outline-none shadow-sm"
                      >
                        <option value="upper_management">👑 {t.roleUpperManagement}</option>
                        <option value="source_country">🌍 {t.roleSourceCountry}</option>
                        <option value="target_country">🏢 {t.roleTargetCountry}</option>
                        <option value="field_officer">✈️ {t.roleFieldOfficer}</option>
                      </select>
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
            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4 h-fit">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-700" /> {t.newTaskTitleHeader}
              </h3>
              <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.taskDescLabel}</label>
                  <input type="text" required value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Pasaport kontrolü" className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium text-slate-900 bg-white text-xs sm:text-sm" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.taskAssigneeLabel}</label>
                  <select value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border font-bold bg-white cursor-pointer text-xs sm:text-sm">
                    {staffMembers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.taskBackupAssigneeLabel}</label>
                  <select value={newTaskBackup} onChange={(e) => setNewTaskBackup(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border font-bold bg-white cursor-pointer text-xs sm:text-sm">
                    {staffMembers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.taskDueDateLabel}</label>
                  <input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border font-medium bg-white text-xs sm:text-sm" />
                </div>
                <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition cursor-pointer shadow-md text-xs sm:text-sm">
                  {t.saveTaskBtn}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{t.taskListHeader}</h3>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${task.status === 'completed' ? 'bg-slate-50 opacity-60' : 'bg-white shadow-sm'}`}>
                    <div className="flex items-start sm:items-center gap-3">
                      <input type="checkbox" checked={task.status === 'completed'} onChange={() => toggleTaskStatus(task.id)} className="w-5 h-5 accent-[#2e7d32] cursor-pointer mt-0.5 sm:mt-0 shrink-0" />
                      <div>
                        <h4 className={`font-bold text-xs sm:text-sm ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{task.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Sorumlu: <strong>{task.assignee}</strong> | Yedek: <strong>{task.backup_assignee}</strong> | Son Tarih: {task.due_date}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold uppercase w-fit ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                      {task.status === 'completed' ? t.statusCompleted : t.statusPending}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Audit Log */}
        {activeTab === 'audit' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-700" /> {t.auditLogTitle}
            </h3>
            <p className="text-xs text-slate-500">{t.auditLogSub}</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b">
                  <tr>
                    <th className="p-4">{t.colAction}</th>
                    <th className="p-4">{t.colPerformer}</th>
                    <th className="p-4">{t.colTime}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-900">{log.action}</td>
                      <td className="p-4">{log.performer}</td>
                      <td className="p-4 text-[11px] text-slate-400">{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Diğer Tablar */}
        {activeTab === 'employers' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{t.employersTab}</h3>
            {employers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">Kayıtlı işveren bulunmuyor.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employers.map((emp) => (
                  <div key={emp.id} className="p-4 bg-slate-50 rounded-2xl border space-y-2 text-xs sm:text-sm">
                    <h4 className="font-extrabold text-slate-900">{emp.company_name}</h4>
                    <p className="text-slate-500">Yetkili: <strong>{emp.contact_person}</strong> | Ülke: {emp.country}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'support' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{t.supportTab}</h3>
            {supportTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">Aktif sorun bildirimi bulunmuyor.</div>
            ) : (
              <div className="space-y-3">
                {supportTickets.map((tkt) => (
                  <div key={tkt.id} className="p-4 bg-slate-50 rounded-2xl border space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{tkt.subject} ({tkt.candidate_name})</span>
                      <span className="text-red-600 uppercase text-[10px]">{tkt.status}</span>
                    </div>
                    <p className="text-slate-600">{tkt.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Personel Düzenleme Modalı */}
      {editingStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Personel Bilgilerini Düzenle</h3>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveStaffEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Ad Soyad</label>
                <input type="text" required value={editingStaff.name} onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium text-slate-900 bg-white" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">E-Posta</label>
                <input type="email" required value={editingStaff.email} onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium text-slate-900 bg-white" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Rol / Yetki Seviyesi</label>
                <select value={editingStaff.roleLevel} onChange={(e) => setEditingStaff({ ...editingStaff, roleLevel: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border font-bold bg-white cursor-pointer">
                  <option value="upper_management">👑 {t.roleUpperManagement}</option>
                  <option value="source_country">🌍 {t.roleSourceCountry}</option>
                  <option value="target_country">🏢 {t.roleTargetCountry}</option>
                  <option value="field_officer">✈️ {t.roleFieldOfficer}</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3 rounded-xl font-bold transition shadow cursor-pointer text-xs">
                Değişiklikleri Kaydet
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}