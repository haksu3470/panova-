'use client';

import OAuthButtons from '@/components/auth/OAuthButtons';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getSessionUser, isStaff, ensureStaff, signOut } from '@/lib/auth';
import { 
  Lock, ShieldCheck, Languages, ArrowLeft, Building2, Users, FileText, 
  UserCheck, CheckSquare, History, ShieldAlert, Key, RefreshCw, Trash2 
} from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

// Modüler Bileşenlerimiz (Kök dizindeki components klasörüne göre göreceli yol)
import CandidatesTab from '../../components/portal/CandidatesTab';
import RequestsTab from '../../components/portal/RequestsTab';
import StaffTab from '../../components/portal/StaffTab';
import TasksTab from '../../components/portal/TasksTab';

export default function PortalPage() {
  const [currentLang, setCurrentLang] = useState<Language>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('panova_portal_lang') as Language;
      if (saved && ['tr', 'en', 'sq', 'ar'].includes(saved)) {
        setCurrentLang(saved);
      }
    }
  }, []);

  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'ar';

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('panova_portal_lang', lang);
    }
  };

  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Yerel bayrak yerine gerçek Supabase Auth oturumu + personel kontrolü
      (async () => {
        const user = await getSessionUser();
        if (user && (await ensureStaff(user.email || undefined))) {
          const { data: staffData } = await supabase.from('staff_members').select('*').eq('auth_user_id', user.id).maybeSingle();
          setCurrentUser(staffData || { name: user.email, email: user.email, role_level: 'upper_management' });
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      })();
    }
  }, []);

  const [currentUser, setCurrentUser] = useState<any>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'requests' | 'staff' | 'tasks' | 'audit' | 'employers' | 'support'>('overview');
  
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobRequests, setJobRequests] = useState<any[]>([]);
  const [employers, setEmployers] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const [selectedDemandDetail, setSelectedDemandDetail] = useState<any | null>(null);

  const [auditLogs, setAuditLogs] = useState<any[]>([
    { id: '1', actionKey: 'initialAuditLog', performer: 'Hüseyin Aksu', time: '2026-09-22 12:00' }
  ]);

  const [loading, setLoading] = useState(false);

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRoleLevel, setNewStaffRoleLevel] = useState('source_country');

  const [editingStaff, setEditingStaff] = useState<any | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskBackup, setNewTaskBackup] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  
  const selectableLanguages = languages.filter((lang) => lang.code !== currentLang);
  const activeLangObj = languages.find((l) => l.code === currentLang);

  const userRole = currentUser?.role_level?.toLowerCase() || '';
  const isUpperManagement = userRole === 'upper_management' || currentUser?.isAdmin || currentUser?.email === 'admin';

  const getRoleDisplayName = (role: string) => {
    const r = role?.toLowerCase() || '';
    if (r === 'upper_management') return `👑 ${t.roleUpperManagement}`;
    if (r === 'source_country') return `🌍 ${t.roleSourceCountry}`;
    if (r === 'target_country') return `🏢 ${t.roleTargetCountry}`;
    if (r === 'field_officer') return `✈️ ${t.roleFieldOfficer}`;
    return `🛡️ ${t.staffTab}`;
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

    const { data: staffData } = await supabase.from('staff_members').select('*').order('created_at', { ascending: false });
    if (staffData && staffData.length > 0) {
      setStaffMembers(staffData);
      if (!newTaskAssignee && staffData[0]) {
        setNewTaskAssignee(staffData[0].name);
        setNewTaskBackup(staffData[1]?.name || staffData[0].name);
      }
    } else {
      setStaffMembers([]);
    }

    const { data: taskData } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (taskData && taskData.length > 0) {
      setTasks(taskData);
    } else {
      setTasks([
        { id: '1', title: 'Pasaportu kontrol et', assignee: 'Hüseyin Aksu', backup_assignee: 'Aleksandar Petrov', due_date: '2026-10-01', status: 'pending' },
        { id: '2', title: 'İşvereni ara', assignee: 'Mehmet Çitil', backup_assignee: 'Rabia Aksu', due_date: '2026-09-25', status: 'completed' }
      ]);
    }

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loginEmail = username.trim().toLowerCase();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (authError || !authData.user) {
        alert('Geçersiz e-posta veya şifre!');
        setLoading(false);
        return;
      }

      // Personel değilse ve sistemde hiç personel yoksa ilk yönetici olarak claim_first_staff çağrılır
      const staffOk = await ensureStaff(authData.user.email || undefined);
      if (!staffOk) {
        await signOut();
        alert('Bu hesap personel yetkisine sahip değil.');
        setLoading(false);
        return;
      }

      const { data: staffData } = await supabase
        .from('staff_members')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle();

      const loggedUser = staffData || {
        name: authData.user.email,
        email: authData.user.email,
        role_level: 'upper_management',
      };

      setAuthenticated(true);
      setCurrentUser(loggedUser);
      logAudit('Sisteme Supabase Auth ile Giriş Yapıldı', loggedUser.name);
      setLoading(false);
    } catch (err: any) {
      alert('Giriş hatası: ' + err.message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setAuthenticated(false);
    setCurrentUser(null);
  };

  const updateCandidateStatus = async (id: string, newStatus: string) => {
    await supabase.from('job_candidates').update({ status: newStatus }).eq('id', id);
    setCandidates(candidates.map(c => c.id === id ? { ...c, status: newStatus } : c));
    logAudit(`Aday Durumu Değiştirildi -> ${newStatus}`, currentUser?.name);
  };

  const updateRequestStatus = async (id: string, newStatus: string, cancellationReason: string = '') => {
    const updatePayload: any = { status: newStatus };
    if (newStatus === 'cancelled' && cancellationReason) {
      updatePayload.cancellation_reason = cancellationReason;
      updatePayload.closed_at = new Date().toISOString();
    }
    await supabase.from('job_requests').update(updatePayload).eq('id', id);
    setJobRequests(jobRequests.map(r => r.id === id ? { ...r, ...updatePayload } : r));
    logAudit(`Talep Durumu Değiştirildi -> ${newStatus}`, currentUser?.name);
    if (selectedDemandDetail && selectedDemandDetail.id === id) {
      setSelectedDemandDetail({ ...selectedDemandDetail, ...updatePayload });
    }
  };

  const updateCandidateAssignee = async (id: string, assignee: string) => {
    await supabase.from('job_candidates').update({ assigned_to: assignee }).eq('id', id);
    setCandidates(candidates.map(c => c.id === id ? { ...c, assigned_to: assignee } : c));
    logAudit(`Aday Sorumlusu Atandı -> ${assignee}`, currentUser?.name);
  };

  const updateStaffRoleLevel = async (staffId: string, newLevel: string) => {
    if (!isUpperManagement) {
      alert('Bu işlem için Üst Yönetim yetkisi gereklidir!');
      return;
    }
    await supabase.from('staff_members').update({ role_level: newLevel }).eq('id', staffId);
    setStaffMembers(staffMembers.map(s => s.id === staffId ? { ...s, role_level: newLevel } : s));
    logAudit(`Personel Rol Seviyesi Güncellendi`, currentUser?.name);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUpperManagement) {
      alert('Bu işlem için Üst Yönetim yetkisi gereklidir!');
      return;
    }
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;

    const { error } = await supabase.from('staff_members').insert([
      {
        name: newStaffName,
        email: newStaffEmail.trim().toLowerCase(),
        role_level: newStaffRoleLevel
      }
    ]);

    if (error) {
      alert('Hata: ' + error.message);
      return;
    }

    logAudit(`Yeni Ekip Üyesi Eklendi: ${newStaffName}`, currentUser?.name);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPassword('');
    alert('Yeni ekip üyesi kaydedildi! Personel, bu e-posta ile Supabase Auth üzerinden hesap oluşturup giriş yapmalıdır.');
    fetchAllData();
  };

  const handleSaveStaffEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUpperManagement || !editingStaff) return;

    try {
      const { error } = await supabase.from('staff_members').update({
        name: editingStaff.name,
        email: editingStaff.email,
        role_level: editingStaff.role_level
      }).eq('id', editingStaff.id);

      if (error) {
        await supabase.from('staff_members').update({
          name: editingStaff.name,
          role_level: editingStaff.role_level
        }).eq('email', editingStaff.email);
      }

      logAudit(`Personel Bilgileri Düzenlendi: ${editingStaff.name}`, currentUser?.name);
      setEditingStaff(null);
      alert('Personel bilgileri başarıyla güncellendi!');
      fetchAllData();
    } catch (err: any) {
      alert('Güncelleme hatası: ' + err.message);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!isUpperManagement) {
      alert('Bu işlem için Üst Yönetim yetkisi gereklidir!');
      return;
    }
    if (confirm('Bu personel kaydını silmek istediğinizden emin misiniz?')) {
      await supabase.from('staff_members').delete().eq('id', staffId);
      setStaffMembers(staffMembers.filter(s => s.id !== staffId));
      logAudit('Personel Kaydı Silindi', currentUser?.name);
      fetchAllData();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const assignedStaffObj = staffMembers.find(s => s.name === (newTaskAssignee || staffMembers[0]?.name));

    const newTaskPayload = {
      title: newTaskTitle,
      assignee: assignedStaffObj?.name || 'Hüseyin Aksu',
      backup_assignee: newTaskBackup || staffMembers[1]?.name || staffMembers[0]?.name || 'Hüseyin Aksu',
      due_date: newTaskDueDate || '2026-10-15',
      status: 'pending'
    };

    const { error } = await supabase.from('tasks').insert([newTaskPayload]);

    if (error) {
      alert('Görev kaydedilirken hata oluştu: ' + error.message);
      return;
    }

    logAudit(`Yeni Görev Atandı: ${newTaskTitle} (${newTaskPayload.assignee})`, currentUser?.name);
    setNewTaskTitle('');
    setNewTaskDueDate('');
    alert('Görev kaydedildi ve sorumlu personele iletildi!');
    fetchAllData();
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    await supabase.from('tasks').update({ status: nextStatus }).eq('id', taskId);
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
    logAudit('Görev durumu güncellendi', currentUser?.name);
  };

  if (!authenticated) {
    return (
      <div className={`min-h-screen bg-slate-50 flex flex-col justify-between ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <header className="w-full bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PANOVA PORTAL" className="h-8 w-auto object-contain" />
            <span className="font-extrabold text-slate-800 text-sm tracking-wide">PANOVA PORTAL</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-200">
              <Languages className="w-4 h-4 text-slate-600 mr-1.5 rtl:ml-1.5" />
              <select
                value={currentLang}
                onChange={(e) => changeLanguage(e.target.value as Language)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value={currentLang} className="font-bold text-slate-900 bg-white">
                  {activeLangObj?.flag} {activeLangObj?.name}
                </option>
                {selectableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-slate-900 bg-white">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <Link href="/" className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-200">
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" /> {t.returnHome}
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md w-full text-center">
            <div className="w-14 h-14 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-1">{t.portalTitle}</h1>
            <p className="text-slate-500 text-xs sm:text-sm mb-6">{t.portalSub}</p>

            <form onSubmit={handleLogin} className="space-y-4 text-left rtl:text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kullanıcı Adı veya E-Posta</label>
                <input
                  type="email"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                  placeholder="ornek@panova.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.passwordLabel || 'Şifre'}</label>
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
                disabled={loading}
                className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-lg mt-2 cursor-pointer text-sm"
              >
                {loading ? 'Giriş Yapılıyor...' : (t.signInBtn || 'Giriş Yap')}
              </button>
            </form>
              <div className="mt-4"><OAuthButtons redirectPath="/portal" /></div>
          </div>
        </main>

        <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
          PANOVA TARIM DOO • International Workforce Management System © 2026
        </footer>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
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
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">{currentUser?.name}</span>
                <span className="text-[10px] text-emerald-800 uppercase font-semibold">
                  {getRoleDisplayName(currentUser?.role_level)}
                </span>
              </div>
            </div>

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
                <option value={currentLang} className="font-bold text-slate-900 bg-white">
                  {activeLangObj?.flag} {activeLangObj?.name}
                </option>
                {selectableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-slate-900 bg-white">
                    {lang.flag} {lang.name}
                  </option>
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

        <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto whitespace-nowrap text-xs font-bold scrollbar-none">
          <button onClick={() => setActiveTab('overview')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'overview' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📊 {t.overviewTab}
          </button>
          <button onClick={() => setActiveTab('candidates')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'candidates' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            👥 {t.candidatesTab} ({candidates.length})
          </button>
          <button onClick={() => setActiveTab('requests')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'requests' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📁 {t.requestsTab} ({jobRequests.length})
          </button>
          
          {isUpperManagement && (
            <button onClick={() => setActiveTab('staff')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'staff' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
              🛡️ {t.staffTab} ({staffMembers.length})
            </button>
          )}

          <button onClick={() => setActiveTab('tasks')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'tasks' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            ✅ {t.tasksTab} ({tasks.filter(t => t.status === 'pending').length})
          </button>
          <button onClick={() => setActiveTab('audit')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'audit' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📜 {t.auditTab} ({auditLogs.length})
          </button>
          <button onClick={() => setActiveTab('employers')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'employers' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            🏢 {t.employersTab} ({employers.length})
          </button>
          <button onClick={() => setActiveTab('support')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'support' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            💬 {t.supportTab} ({supportTickets.length})
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${isUpperManagement ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
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

              {isUpperManagement && (
                <div className="bg-white p-5 sm:p-6 rounded-2xl border shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-slate-500 text-[11px] sm:text-xs font-bold uppercase">{t.staffTab}</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-1">{staffMembers.length}</div>
                  </div>
                  <UserCheck className="w-9 h-9 sm:w-10 sm:h-10 text-indigo-600 bg-indigo-50 p-2 rounded-xl" />
                </div>
              )}

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

        {activeTab === 'candidates' && (
          <CandidatesTab 
            candidates={candidates}
            staffMembers={staffMembers}
            currentLang={currentLang}
            t={t}
            fetchAllData={fetchAllData}
            updateCandidateAssignee={updateCandidateAssignee}
            updateCandidateStatus={updateCandidateStatus}
            logAudit={logAudit}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'requests' && (
          <RequestsTab 
            jobRequests={jobRequests}
            t={t}
            updateRequestStatus={updateRequestStatus}
            setSelectedDemandDetail={setSelectedDemandDetail}
          />
        )}

        {activeTab === 'staff' && isUpperManagement && (
          <StaffTab 
            staffMembers={staffMembers}
            isUpperManagement={isUpperManagement}
            t={t}
            newStaffName={newStaffName}
            setNewStaffName={setNewStaffName}
            newStaffEmail={newStaffEmail}
            setNewStaffEmail={setNewStaffEmail}
            newStaffPassword={newStaffPassword}
            setNewStaffPassword={setNewStaffPassword}
            newStaffRoleLevel={newStaffRoleLevel}
            setNewStaffRoleLevel={setNewStaffRoleLevel}
            handleAddStaff={handleAddStaff}
            updateStaffRoleLevel={updateStaffRoleLevel}
            setEditingStaff={setEditingStaff}
            handleDeleteStaff={handleDeleteStaff}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksTab 
            tasks={tasks}
            staffMembers={staffMembers}
            isUpperManagement={isUpperManagement}
            userRole={userRole}
            t={t}
            newTaskTitle={newTaskTitle}
            setNewTaskTitle={setNewTaskTitle}
            newTaskAssignee={newTaskAssignee}
            setNewTaskAssignee={setNewTaskAssignee}
            newTaskBackup={newTaskBackup}
            setNewTaskBackup={setNewTaskBackup}
            newTaskDueDate={newTaskDueDate}
            setNewTaskDueDate={setNewTaskDueDate}
            handleCreateTask={handleCreateTask}
            toggleTaskStatus={toggleTaskStatus}
          />
        )}

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
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">
                        {log.actionKey ? (t as any)[log.actionKey] || log.actionKey : log.action}
                      </td>
                      <td className="p-4">{log.performer}</td>
                      <td className="p-4 text-[11px] text-slate-400">{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'employers' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{t.employersTab}</h3>
            {employers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">{t.noEmployers}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employers.map((emp) => (
                  <div key={emp.id} className="p-4 bg-slate-50 rounded-2xl border space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900">{emp.company_name}</h4>
                      <button
                        onClick={() => {
                          const employerSessionData = {
                            id: emp.id,
                            company_name: emp.company_name,
                            email: emp.email || 'huseyinaksu@gmail.com',
                            contact_person: emp.contact_person,
                            country: emp.country,
                            sector: emp.sector || 'Tarım / İnşaat',
                            isAdminImpersonation: true
                          };
                          localStorage.setItem('panova_employer_auth', 'true');
                          localStorage.setItem('panova_employer_user', JSON.stringify(employerSessionData));
                          window.location.href = '/employer';
                        }}
                        className="px-3 py-1.5 bg-[#2e7d32] hover:bg-[#1b5e20] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                      >
                        İşveren Dosyasını Aç & İncele
                      </button>
                    </div>
                    <p className="text-slate-500">Contact: <strong>{emp.contact_person}</strong> | Country: {emp.country}</p>
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
              <div className="p-8 text-center text-slate-400 text-xs">{t.noSupport}</div>
            ) : (
              <div className="space-y-3">
                {supportTickets.map((tkt) => (
                  <div key={tkt.id} className="p-4 bg-slate-50 rounded-2xl border space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{tkt.subject} ({tkt.candidate_name})</span>
                      <span className="text-red-600 uppercase text-[10px]">{tkt.status}</span>
                    </div>
                    <p className="text-slate-600">{t.message}: {tkt.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {selectedDemandDetail && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl border space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase bg-emerald-50 px-2.5 py-1 rounded-lg">
                  Personnel Demand Dossier (ID: {selectedDemandDetail.id})
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">{selectedDemandDetail.position_title} - {selectedDemandDetail.employer_name}</h3>
              </div>
              <button onClick={() => setSelectedDemandDetail(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer p-2">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
              <div className="bg-slate-50 p-4 rounded-2xl border space-y-2">
                <h4 className="font-extrabold text-slate-900 uppercase text-xs text-emerald-800 border-b pb-1">📌 Demand Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div><strong>Employer:</strong> {selectedDemandDetail.employer_name}</div>
                  <div><strong>Country / City:</strong> {selectedDemandDetail.country} / {selectedDemandDetail.city || 'Center'}</div>
                  <div><strong>Sector:</strong> {selectedDemandDetail.sector}</div>
                  <div><strong>Position:</strong> {selectedDemandDetail.position_title}</div>
                  <div><strong>Headcount:</strong> {selectedDemandDetail.headcount}</div>
                  <div><strong>Created Date:</strong> {selectedDemandDetail.created_at ? selectedDemandDetail.created_at.substring(0, 10) : 'N/A'}</div>
                  <div><strong>Target Start:</strong> {selectedDemandDetail.target_start_date || '2026-10-15'}</div>
                  <div><strong>Status:</strong> <span className="uppercase font-bold text-emerald-700">{selectedDemandDetail.status}</span></div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border space-y-2">
                <h4 className="font-extrabold text-slate-900 uppercase text-xs text-emerald-800 border-b pb-1">💼 Working Conditions & Benefits</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div><strong>Salary:</strong> {selectedDemandDetail.salary || 'Negotiable'}</div>
                  <div><strong>Working Hours:</strong> {selectedDemandDetail.working_hours || '40-45 hrs/week'}</div>
                  <div><strong>Weekly Days:</strong> {selectedDemandDetail.weekly_days || '5-6 Days'}</div>
                  <div><strong>Overtime:</strong> {selectedDemandDetail.overtime_policy || 'Standard Legal'}</div>
                  <div><strong>Accommodation:</strong> {selectedDemandDetail.accommodation ? '✅ Provided' : '❌ Not Provided'}</div>
                  <div><strong>Food / Transport:</strong> {selectedDemandDetail.food_allowance ? '✅ Yes' : '❌ No'} / {selectedDemandDetail.transportation ? '✅ Yes' : '❌ No'}</div>
                  <div><strong>Flight Ticket:</strong> {selectedDemandDetail.flight_ticket ? '✅ Employer Covers' : 'Candidate'}</div>
                  <div><strong>Contract Term:</strong> {selectedDemandDetail.contract_term || '1 Year'}</div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border space-y-2">
                <h4 className="font-extrabold text-slate-900 uppercase text-xs text-emerald-800 border-b pb-1">🎯 Candidate Criteria & Qualifications</h4>
                <div className="space-y-1 text-slate-700">
                  <div><strong>Experience:</strong> {selectedDemandDetail.experience_required || 'Min 2 years'}</div>
                  <div><strong>Certificate:</strong> {selectedDemandDetail.certificate_required || 'Professional Certificate Required'}</div>
                  <div><strong>Language:</strong> {selectedDemandDetail.language_required || 'Basic English or Local Language'}</div>
                  <div><strong>Special Req:</strong> {selectedDemandDetail.special_requirements || selectedDemandDetail.special_reqs || 'Shift suitability.'}</div>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-2">
                <h4 className="font-extrabold text-emerald-900 uppercase text-xs border-b border-emerald-200 pb-1">📊 Process Counts & Metrics</h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border">
                    <span className="block text-slate-500 text-[10px]">Requested</span>
                    <strong className="text-base text-slate-900">{selectedDemandDetail.headcount}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border">
                    <span className="block text-slate-500 text-[10px]">Connected</span>
                    <strong className="text-base text-blue-600">{candidates.length}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border">
                    <span className="block text-slate-500 text-[10px]">Approved</span>
                    <strong className="text-base text-emerald-700">{candidates.filter(c => c.status === 'approved').length}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-extrabold text-slate-900 text-sm">👥 Candidates Connected & Offered to This Demand</h4>
              <div className="bg-slate-50 rounded-2xl p-4 border max-h-48 overflow-y-auto space-y-2">
                {candidates.slice(0, 3).map((cand) => (
                  <div key={cand.id} className="flex items-center justify-between bg-white p-3 rounded-xl border text-xs">
                    <div>
                      <strong>{cand.full_name}</strong> ({cand.profession}) - <span className="text-slate-400">{cand.nationality || cand.country}</span>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg font-bold uppercase text-[10px]">
                      {cand.status}
                    </span>
                  </div>
                ))}
                {candidates.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2">No candidates assigned yet.</p>
                )}
              </div>
            </div>

            <div className="space-y-2 border-t pt-4 text-xs">
              <h4 className="font-extrabold text-slate-900 uppercase">📝 Internal Notes & Timeline</h4>
              <div className="bg-slate-50 p-3 rounded-xl border text-slate-600 space-y-1">
                <p>• {selectedDemandDetail.created_at ? selectedDemandDetail.created_at.substring(0, 10) : '2026-09-22'}: Employer demand registered in system and dossier opened.</p>
                <p>• Candidate sourcing and preliminary interviews initiated in source country.</p>
                {selectedDemandDetail.cancellation_reason && (
                  <p className="text-red-600 font-bold">• Cancellation Info: {selectedDemandDetail.cancellation_reason}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setSelectedDemandDetail(null)}
                className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editingStaff && isUpperManagement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-700" /> Edit Staff & Password
              </h3>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveStaffEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input type="text" required value={editingStaff.name} onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium text-slate-900 bg-white" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Email (For Login)</label>
                <input type="email" required value={editingStaff.email} onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium text-slate-900 bg-white" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Role Level</label>
                <select value={editingStaff.role_level} onChange={(e) => setEditingStaff({ ...editingStaff, role_level: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border font-bold text-slate-900 bg-white cursor-pointer">
                  <option value="upper_management" className="text-slate-900 bg-white">👑 {t.roleUpperManagement}</option>
                  <option value="source_country" className="text-slate-900 bg-white">🌍 {t.roleSourceCountry}</option>
                  <option value="target_country" className="text-slate-900 bg-white">🏢 {t.roleTargetCountry}</option>
                  <option value="field_officer" className="text-slate-900 bg-white">✈️ {t.roleFieldOfficer}</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3 rounded-xl font-bold transition shadow cursor-pointer text-xs">
                Save Changes and Password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}