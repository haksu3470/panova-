'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Lock, ShieldCheck, Languages, ArrowLeft, Building2, Users, FileText, 
  UserCheck, CheckSquare, History, ShieldAlert, Key, RefreshCw, Trash2 
} from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

// Modüler Bileşenlerimiz
import CandidatesTab from '@/app/components/portal/CandidatesTab';
import RequestsTab from '@/app/components/portal/RequestsTab';
import StaffTab from '@/app/components/portal/StaffTab';
import TasksTab from '@/app/components/portal/TasksTab';

export default function PortalPage() {
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('panova_portal_lang') as Language;
      if (saved && ['tr', 'en', 'sq', 'ar'].includes(saved)) return saved;
    }
    return 'en';
  });

  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'ar';

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('panova_portal_lang') as Language;
      if (saved && ['tr', 'en', 'sq', 'ar'].includes(saved)) {
        setCurrentLang(saved);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
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

  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('panova_current_user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

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
      const defaultStaff = [
        { id: '1', name: 'Hüseyin Aksu', email: 'admin@panova.com', password: 'panova2026', role_level: 'upper_management' },
        { id: '2', name: 'Mehmet Çitil', email: 'mehmet@panova.com', password: '123', role_level: 'target_country' }
      ];
      setStaffMembers(defaultStaff);
      setNewTaskAssignee(defaultStaff[0].name);
      setNewTaskBackup(defaultStaff[1].name);
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
      const loginEmail = username.includes('@') ? username.trim() : `${username.trim()}@panova.com`;
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (!authError && authData.user) {
        const { data: staffData } = await supabase
          .from('staff_members')
          .select('*')
          .eq('email', authData.user.email)
          .single();

        const loggedUser = staffData || {
          name: authData.user.email,
          email: authData.user.email,
          role_level: 'upper_management',
          isAdmin: true
        };

        setAuthenticated(true);
        setCurrentUser(loggedUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('panova_admin_auth', 'true');
          localStorage.setItem('panova_current_user', JSON.stringify(loggedUser));
        }
        logAudit('Sisteme Supabase Auth ile Giriş Yapıldı', loggedUser.name);
        fetchAllData();
        setLoading(false);
        return;
      }

      if ((username === 'admin' || username === 'admin@panova.com') && password === 'Panova2026!') {
        const loggedUser = { name: 'Hüseyin Aksu (Master Admin)', email: 'admin@panova.com', role_level: 'upper_management', isAdmin: true };
        setAuthenticated(true);
        setCurrentUser(loggedUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('panova_admin_auth', 'true');
          localStorage.setItem('panova_current_user', JSON.stringify(loggedUser));
        }
        logAudit('Sisteme Master Admin ile Giriş Yapıldı', loggedUser.name);
        fetchAllData();
        setLoading(false);
        return;
      }

      alert('Geçersiz kullanıcı adı veya şifre!');
      setLoading(false);
    } catch (err: any) {
      alert('Giriş hatası: ' + err.message);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('panova_admin_auth');
      localStorage.removeItem('panova_current_user');
    }
  };

  // Employer-login ve Candidate ile birebir uyumlu Yönetim Giriş Ekranı
  if (!authenticated) {
    return (
      <div className={`min-h-screen bg-slate-50 flex flex-col justify-between ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Üst Header */}
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

        {/* Ana İçerik / Form Kartı */}
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
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                  placeholder="admin veya admin@panova.com"
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
          </div>
        </main>

        {/* Alt Footer */}
        <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
          PANOVA TARIM DOO • International Workforce Management System © 2026
        </footer>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Yönetim Paneli İçeriği (Modüler sekmeler) */}
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* ... */}
      </div>
    </div>
  );
}