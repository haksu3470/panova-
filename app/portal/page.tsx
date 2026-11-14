'use client';

import OAuthButtons from '@/components/auth/OAuthButtons';
import { AuthFooter } from '@/components/site/AuthFooter';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ensureStaff, signOut } from '@/lib/auth';
import { consumeOAuthIntent, listenerMayRevokeSharedSession, PORTAL_OAUTH_PATH } from '@/lib/staffSession';
import { AccountExistsNotice } from '@/components/auth/AccountExistsNotice';
import EmailVerifyNotice from '@/components/auth/EmailVerifyNotice';
import ForgotPasswordPanel, { ForgotPasswordLink } from '@/components/auth/ForgotPasswordPanel';
import {
  beginPasswordSignup,
  emailGateListenerPaused,
  gateSession,
  isEmailNotConfirmedMessage,
  pauseEmailGateListener,
  rememberVerifyEmail,
  storedVerifyEmail,
} from '@/lib/emailVerification';
import { 
  Lock, ShieldCheck, Building2, Users, FileText, 
  UserCheck, CheckSquare, History, ShieldAlert, Key, RefreshCw, Trash2, BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { candidateProfessionLabel } from '@/lib/candidateLabels';
import { localizeCatalogTitle } from '@/lib/professions';
import { Language, translations } from '@/lib/dictionary';
import { dateLocale, portalUi } from '@/lib/portal-ui-copy';
import { benefitPhrase, displayedRequestSalary } from '@/lib/workforceRequest';
import { HeaderActions, PageHeader } from '@/components/site/PageHeader';
import { formatContractDuration } from '@/lib/contractDuration';
import { homeCopy } from '@/lib/home-copy';
import { readStoredLanguage, syncDocumentLanguage, writeStoredLanguage } from '@/lib/site-language';
import { guideNavLabel } from '@/lib/guides-nav';
import { releaseCopy } from '@/lib/release-copy';
import { threadForTicket, type SupportMessage } from '@/lib/supportTickets';
import StaffMfaPanel from '@/components/portal/StaffMfaPanel';
import EmployerLoginInvite from '@/components/portal/EmployerLoginInvite';
import { taskIsOverdue } from '@/lib/demandStatus';

// Modüler Bileşenlerimiz (Kök dizindeki components klasörüne göre göreceli yol)
import CandidatesTab from '../../components/portal/CandidatesTab';
import { ReferralCodeChip } from '../../components/portal/ReferralCodeChip';
import { isSourceCountryOfficer, normalizeReferralCode } from '@/lib/referralCode';
import RequestsTab from '../../components/portal/RequestsTab';
import { writeAudit } from '@/lib/audit';
import DemoBadge from '@/components/portal/DemoBadge';
import DeleteRecordButton, { DELETE_ROW_CLASS } from '@/components/portal/DeleteRecordButton';
import ListExportBar from '@/components/portal/ListExportBar';
import ScrollTable from '@/components/portal/ScrollTable';
import StaffTab from '../../components/portal/StaffTab';
import TasksTab from '../../components/portal/TasksTab';
import { employerExportRows, offerExportRows, requestExportRows } from '@/lib/exportLists';
import { canAssignCandidate, canUpdateRequestStatus, isPermissionError, isUpperManagementRole, overviewCardTarget, tabsForStaffRole, type OverviewCard as OverviewCardId, type StaffTab as StaffTabId } from '@/lib/staffAccess';
import { countOpenRequests } from '@/lib/requestPipelineCounts';
import OverviewCard from '@/components/portal/OverviewCard';
import DemoDataCard from '@/components/portal/DemoDataCard';
import { statusErrorKey, type StatusErrorKey } from '@/lib/requestStatusChange';
import type { CandidateStatusErrorKey } from '@/lib/candidateStatusChange';
import { candidateService } from '@/lib/services/candidateService';

export default function PortalPage() {
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const langRef = useRef(currentLang);
  langRef.current = currentLang;

  useEffect(() => {
    const onStorage = () => {
      const next = readStoredLanguage('en');
      setCurrentLang(next);
      syncDocumentLanguage(next);
    };
    onStorage();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const t = translations[currentLang] || translations.en;
  const ui = portalUi[currentLang];
  const isRtl = currentLang === 'ar';

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang);
    writeStoredLanguage(lang);
  };

  const [authenticated, setAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'verify' | 'forgot' | 'exists'>('signin');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [currentUser, setCurrentUser] = useState<any>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'requests' | 'staff' | 'tasks' | 'audit' | 'employers' | 'support'>('overview');
  
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobRequests, setJobRequests] = useState<any[]>([]);
  const [employers, setEmployers] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const [selectedDemandDetail, setSelectedDemandDetail] = useState<any | null>(null);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [newTaskLinkType, setNewTaskLinkType] = useState('');
  const [newTaskLinkId, setNewTaskLinkId] = useState('');

  const [loading, setLoading] = useState(false);
  const [mfaMode, setMfaMode] = useState<'off' | 'challenge' | 'optional'>('off');

  useEffect(() => {
    if (!authenticated) return;
    let alive = true;
    (async () => {
      const [level, factors, required] = await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
        supabase.rpc('staff_mfa_required'),
      ]);
      if (!alive) return;
      const verified = (factors.data?.totp ?? []).some((factor) => factor.status === 'verified');
      if (verified && level.data?.currentLevel !== 'aal2') setMfaMode('challenge');
      else if (required.data === true && !verified) setMfaMode('challenge');
      else setMfaMode('optional');
    })();
    return () => {
      alive = false;
    };
  }, [authenticated]);

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRoleLevel, setNewStaffRoleLevel] = useState('source_country');

  const [editingStaff, setEditingStaff] = useState<any | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskBackup, setNewTaskBackup] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  
  const userRole = currentUser?.role_level?.toLowerCase() || '';
  const isUpperManagement = isUpperManagementRole(userRole);
  const allowedTabs = tabsForStaffRole(userRole);
  const showTab = (tab: StaffTabId) => !currentUser || allowedTabs.includes(tab);

  useEffect(() => {
    if (!currentUser) return;
    const tabs = tabsForStaffRole(userRole);
    if (!tabs.includes(activeTab)) setActiveTab(tabs[0]);
  }, [currentUser, userRole, activeTab]);

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
    if (ticketData) {
      setSupportTickets(ticketData);
      const ids = ticketData.map((ticket: { id?: string }) => ticket.id).filter(Boolean);
      if (ids.length) {
        const { data: msgs } = await supabase
          .from('support_ticket_messages')
          .select('id, ticket_id, author_role, author_name, body, created_at, read_at')
          .in('ticket_id', ids)
          .order('created_at', { ascending: true });
        if (msgs) setSupportMessages(msgs);
      } else {
        setSupportMessages([]);
      }
    }

    const { data: staffData } = await supabase.from('staff_members').select('*').order('created_at', { ascending: false });
    if (staffData && staffData.length > 0) {
      setStaffMembers(staffData);
      setCurrentUser((prev: any) => {
        if (!prev) return prev;
        const mine = staffData.find((member: any) => member.id === prev.id || (prev.auth_user_id && member.auth_user_id === prev.auth_user_id));
        return mine ? { ...prev, ...mine } : prev;
      });
      if (!newTaskAssignee && staffData[0]) {
        setNewTaskAssignee(staffData[0].name);
        setNewTaskBackup(staffData[1]?.name || staffData[0].name);
      }
    } else {
      setStaffMembers([]);
    }

    const { data: auditData } = await supabase.from('audit_logs').select('id, action, actor_name, entity_type, created_at, is_demo').order('created_at', { ascending: false }).limit(200);
    if (auditData) {
      setAuditLogs(auditData.map((a: any) => ({ id: a.id, action: a.action, performer: a.actor_name || '—', entity: a.entity_type, is_demo: a.is_demo, time: new Date(a.created_at).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) })));
    }

    const { data: taskData } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (taskData && taskData.length > 0) {
      setTasks(taskData);
    } else {
      setTasks([
        { id: '1', title: 'taskPassportCheck', assignee: 'Hüseyin Aksu', backup_assignee: 'Aleksandar Petrov', due_date: '2026-10-01', status: 'pending' },
        { id: '2', title: 'taskSaveDemand', assignee: 'Mehmet Citil', backup_assignee: 'Rabia Aksu', due_date: '2026-09-25', status: 'completed' }
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
    setAuditLogs(prev => [newLog, ...prev]);
    writeAudit(actionText);
  };

  const enterStaff = async (
    userId: string,
    email: string | undefined,
    fullName?: string,
    announce = false,
    audit = announce,
    revokeOnFailure = false,
  ) => {
    const staffOk = await ensureStaff(fullName || email || undefined);
    if (!staffOk) {
      // signOut is global for this browser. Only an explicit portal login,
      // or OAuth that this tab started, may revoke. A candidate signed in
      // on /candidate shares this session.
      if (revokeOnFailure) await signOut();
      if (announce) {
        const copy = translations[langRef.current] || translations.en;
        alert(copy.staffNotInvited);
      }
      return false;
    }
    const { data: staffData } = await supabase.from('staff_members').select('*').eq('auth_user_id', userId).maybeSingle();
    let roleLevel = staffData?.role_level as string | undefined;
    if (!roleLevel) {
      const { data: profile } = await supabase.from('profiles').select('staff_role').eq('id', userId).maybeSingle();
      roleLevel = profile?.staff_role || undefined;
    }
    const loggedUser = { ...(staffData || { name: fullName || email, email }), role_level: roleLevel || 'limited' };
    setAuthenticated(true);
    setCurrentUser(loggedUser);
    if (audit) logAudit(portalUi[langRef.current].signedIn, loggedUser.name);
    return true;
  };

  useEffect(() => {
    const pending = storedVerifyEmail();
    if (pending && new URLSearchParams(window.location.search).get('verify') === '1') {
      setVerifyEmail(pending);
      setAuthMode('verify');
    }
    let alive = true;
    let handledUserId: string | null = null;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') return;
      setTimeout(async () => {
        if (!alive || emailGateListenerPaused() || !session) return;
        // A hidden portal tab hears every sign-in on this origin. Adopting it
        // would run claim_first_staff and, previously, signOut the candidate.
        if (document.visibilityState !== 'visible') return;
        const gate = await gateSession();
        if (!alive) return;
        if (gate.status === 'verify') {
          setVerifyEmail(gate.email);
          setAuthMode('verify');
          setAuthenticated(false);
          return;
        }
        if (gate.status !== 'ready') return;
        // Google dönüşü INITIAL_SESSION veya SIGNED_IN olabilir. Personel değilse
        // ikisinde de uyarı göster; sessiz dönüş giriş formunda kalmasın.
        // Oturumu silmek yalnız bu sekmenin kendi Google dönüşünde olur.
        // Denetim kaydı yalnız yeni oturumda yazılır, sayfa yenilemesinde değil.
        if (handledUserId === session.user.id) return;
        handledUserId = session.user.id;
        const revoke = listenerMayRevokeSharedSession(consumeOAuthIntent(PORTAL_OAUTH_PATH), true);
        // handledUserId stays set so the paired INITIAL_SESSION / SIGNED_IN
        // does not alert twice. The portal form still calls enterStaff itself.
        await enterStaff(
          session.user.id,
          session.user.email || undefined,
          undefined,
          true,
          event === 'SIGNED_IN',
          revoke,
        );
      }, 0);
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const resume = pauseEmailGateListener();
    try {
      const loginEmail = username.trim().toLowerCase();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (authError || !authData.user) {
        if (isEmailNotConfirmedMessage(authError?.message)) {
          rememberVerifyEmail(loginEmail, 'signup');
          setVerifyEmail(loginEmail);
          setAuthMode('verify');
          return;
        }
        alert(t.authInvalidCredentials);
        return;
      }

      const gate = await gateSession();
      if (gate.status === 'verify') {
        setVerifyEmail(gate.email || loginEmail);
        setAuthMode('verify');
        return;
      }
      await enterStaff(authData.user.id, authData.user.email || loginEmail, undefined, true, true, true);
    } catch (err: any) {
      alert((t.loginError || '{message}').replace('{message}', err.message));
    } finally {
      resume();
      setLoading(false);
    }
  };

  const handleStaffSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || regPassword.length < 8) {
      alert(t.staffSignupFieldsRequired);
      return;
    }
    setLoading(true);
    const resume = pauseEmailGateListener();
    const email = regEmail.trim().toLowerCase();
    try {
      const result = await beginPasswordSignup({
        email,
        password: regPassword,
        redirectPath: '/portal',
        metadata: { role: 'staff', full_name: regName.trim() },
        locale: currentLang,
      });
      if (result.status === 'exists') {
        setUsername(email);
        setAuthMode('exists');
        return;
      }
      if (result.status === 'error') {
        alert((t.signupError || '{message}').replace('{message}', result.message));
        return;
      }
      setVerifyEmail(result.email);
      setAuthMode('verify');
    } finally {
      resume();
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setAuthenticated(false);
    setCurrentUser(null);
  };

  // Candidate status follows the official process (set by the database).
  // Upper management may override it with a reason through the RPC; then the
  // row is read back so the list shows what the database stored.
  const updateCandidateStatus = async (id: string, newStatus: string, reason: string): Promise<CandidateStatusErrorKey | null> => {
    const result = await candidateService.setStatus(id, newStatus, reason);
    if (result.errorKey) return result.errorKey;
    const { data: row } = await supabase.from('job_candidates').select('*').eq('id', id).maybeSingle();
    const patch = row || { status: result.status };
    setCandidates((rows) => rows.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    logAudit(`${ui.candidateWord} → ${result.status}`, currentUser?.name);
    return null;
  };

  // Manual status change, upper management only. The RPC checks the role and
  // the reason, sets closed_reason / closed_at itself and writes the audit
  // row, so nothing else is sent from here. Resolves to an error key or null.
  const updateRequestStatus = async (id: string, newStatus: string, reason: string): Promise<StatusErrorKey | null> => {
    const { error } = await supabase.rpc('staff_set_request_status', {
      p_request_id: id,
      p_status: newStatus,
      p_reason: reason,
    });
    if (error) return statusErrorKey(error);
    const { data: row } = await supabase
      .from('job_requests')
      .select('id, status, closed_reason, closed_at')
      .eq('id', id)
      .maybeSingle();
    const patch = row || { status: newStatus };
    setJobRequests((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    if (selectedDemandDetail && selectedDemandDetail.id === id) {
      setSelectedDemandDetail({ ...selectedDemandDetail, ...patch });
    }
    return null;
  };

  const updateCandidateAssignee = async (id: string, assignee: string) => {
    const { error } = await supabase.from('job_candidates').update({ assigned_to: assignee || null }).eq('id', id);
    if (error) {
      alert(isPermissionError(error) ? ui.permissionDenied : `${ui.errorPrefix} ${error.message}`);
      return;
    }
    setCandidates(candidates.map(c => c.id === id ? { ...c, assigned_to: assignee } : c));
    logAudit(`${ui.candidateWord} → ${assignee}`, currentUser?.name);
  };

  const updateStaffRoleLevel = async (staffId: string, newLevel: string) => {
    if (!isUpperManagement) {
      alert(ui.upperManagementOnly);
      return;
    }
    const { data, error } = await supabase
      .from('staff_members')
      .update({ role_level: newLevel })
      .eq('id', staffId)
      .select('id, role_level, referral_code')
      .maybeSingle();
    if (error) {
      const detail = /source_officer|referral_code_role|referral_code_immutable/.test(error.message)
        ? ui.sourceOfficerMissingCode
        : error.message;
      alert(`${ui.updateFailed} ${detail}`);
      return;
    }
    if (newLevel === 'source_country' && !normalizeReferralCode(data?.referral_code)) {
      alert(ui.sourceOfficerMissingCode);
      return;
    }
    setStaffMembers(staffMembers.map(s => s.id === staffId ? { ...s, ...data, role_level: newLevel } : s));
    logAudit(ui.staffUpdated, currentUser?.name);
    fetchAllData();
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUpperManagement) {
      alert(ui.upperManagementOnly);
      return;
    }
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;

    const { data: sess } = await supabase.auth.getSession();
    const res = await fetch('/api/staff-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sess.session?.access_token || ''}` },
      body: JSON.stringify({ name: newStaffName, email: newStaffEmail.trim().toLowerCase(), role: newStaffRoleLevel, locale: currentLang }),
    });
    const result = await res.json().catch(() => ({ error: ui.serverUnreadable }));
    if (!res.ok || result.error) {
      alert(`${ui.errorPrefix} ${result.error || res.statusText}`);
      return;
    }

    logAudit(`Personel Davet Edildi: ${newStaffName} (${newStaffEmail})`, currentUser?.name);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPassword('');
    alert(result.emailSent ? ui.inviteSent : result.warning);
    fetchAllData();
  };

  const handleSaveStaffEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUpperManagement || !editingStaff) return;

    try {
      let saved = await supabase.from('staff_members').update({
        name: editingStaff.name,
        email: editingStaff.email,
        role_level: editingStaff.role_level,
        scope_country: editingStaff.scope_country || null,
      }).eq('id', editingStaff.id).select('id, role_level, referral_code, scope_country').maybeSingle();

      if (saved.error) {
        saved = await supabase.from('staff_members').update({
          name: editingStaff.name,
          role_level: editingStaff.role_level
        }).eq('email', editingStaff.email).select('id, role_level, referral_code').maybeSingle();
      }

      if (saved.error) {
        alert(`${ui.updateFailed} ${saved.error.message}`);
        return;
      }
      if (editingStaff.role_level === 'source_country' && !normalizeReferralCode(saved.data?.referral_code)) {
        alert(ui.sourceOfficerMissingCode);
        return;
      }

      logAudit(`${ui.staffUpdated} ${editingStaff.name}`, currentUser?.name);
      setEditingStaff(null);
      alert(ui.staffUpdated);
      fetchAllData();
    } catch (err: any) {
      alert(`${ui.updateFailed} ${err.message}`);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!isUpperManagement) {
      alert(ui.upperManagementOnly);
      return;
    }
    if (confirm(ui.confirmDeleteStaff)) {
      await supabase.from('staff_members').delete().eq('id', staffId);
      setStaffMembers(staffMembers.filter(s => s.id !== staffId));
      logAudit(ui.staffDeleted, currentUser?.name);
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
      status: 'pending',
      related_entity_type: newTaskLinkType && newTaskLinkId ? newTaskLinkType : null,
      related_entity_id: newTaskLinkType && newTaskLinkId ? newTaskLinkId : null,
      created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    };

    const { error } = await supabase.from('tasks').insert([newTaskPayload]);

    if (error) {
      alert(`${ui.taskSaveFailed} ${error.message}`);
      return;
    }

    logAudit(`${ui.taskSaved} ${newTaskTitle} (${newTaskPayload.assignee})`, currentUser?.name);
    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskLinkType('');
    setNewTaskLinkId('');
    alert(ui.taskSaved);
    fetchAllData();
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    await supabase.from('tasks').update({ status: nextStatus }).eq('id', taskId);
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
    logAudit(ui.taskSaved, currentUser?.name);
  };

  if (!authenticated) {
    return (
      <div className={`min-h-screen bg-slate-50 flex flex-col justify-between ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <PageHeader
          variant="bar"
          start={
            <>
              <img src="/logo.png" alt="PANOVA" width={1051} height={725} className="h-10 w-auto object-contain shrink-0" />
              <span className="font-extrabold text-slate-800 text-sm tracking-wide">PANOVA PORTAL</span>
            </>
          }
          actions={<HeaderActions lang={currentLang} onLanguageChange={changeLanguage} homeLabel={t.returnHome} />}
        />

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md w-full text-center">
            <div className="w-14 h-14 bg-emerald-100 text-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Lock className="w-7 h-7" />
            </div>
            {(authMode === 'signin' || authMode === 'signup') && <>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-1">{authMode === 'signup' ? t.staffSignupTitle : t.portalTitle}</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mb-6">{authMode === 'signup' ? t.staffSignupSub : t.portalSub}</p>
            </>}

            {authMode === 'verify' ? (
              <div className="space-y-4 text-left rtl:text-right">
                <EmailVerifyNotice
                  email={verifyEmail}
                  lang={currentLang}
                  redirectPath="/portal"
                  onVerified={async () => {
                    const { data } = await supabase.auth.getSession();
                    const user = data.session?.user;
                    if (!user) return;
                    await enterStaff(user.id, user.email || verifyEmail, regName || undefined, true, true, true);
                  }}
                  onSignIn={() => { setUsername(verifyEmail); setAuthMode('signin'); }}
                  onResetPassword={() => { setUsername(verifyEmail); setAuthMode('forgot'); }}
                />
                <button type="button" onClick={() => setAuthMode('signin')} className="w-full text-xs font-bold text-muted-foreground cursor-pointer">{t.verifyEmailBack}</button>
                <OAuthButtons redirectPath="/portal" orLabel={homeCopy[currentLang].oauthOr} googleLabel={homeCopy[currentLang].oauthGoogle} />
              </div>
            ) : authMode === 'exists' ? (
              <AccountExistsNotice
                message={t.accountExists || ''}
                signInLabel={t.signInMenu || ''}
                resetLabel={t.forgotPassword || ''}
                onSignIn={() => setAuthMode('signin')}
                onReset={() => setAuthMode('forgot')}
              />
            ) : authMode === 'forgot' ? (
              <ForgotPasswordPanel
                lang={currentLang}
                initialEmail={username}
                audience="portal"
                onBack={() => setAuthMode('signin')}
              />
            ) : authMode === 'signup' ? (
              <form onSubmit={handleStaffSignup} className="space-y-4 text-left rtl:text-right">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.staffNameLabel}</label>
                  <input required value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.staffEmailLabel}</label>
                  <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.passwordLabel}</label>
                  <input type="password" required minLength={8} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium outline-none text-sm" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-brand-solid hover:bg-brand text-white py-3.5 rounded-xl font-bold text-sm cursor-pointer">
                  {t.staffSignupBtn}
                </button>
                <button type="button" onClick={() => setAuthMode('signin')} className="w-full text-xs font-bold text-muted-foreground cursor-pointer">{t.verifyEmailBack}</button>
              </form>
            ) : (
            <form onSubmit={handleLogin} className="space-y-4 text-left rtl:text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.usernameLabel} / {t.emailLabel}</label>
                <input
                  type="email"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                  placeholder={t.staffEmailPlaceholder}
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
              <ForgotPasswordLink label={t.forgotPassword || ''} onClick={() => setAuthMode('forgot')} />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-solid hover:bg-brand text-white py-3.5 rounded-xl font-bold transition shadow-lg mt-2 cursor-pointer text-sm"
              >
                {loading ? (t.submitting || t.signInBtn) : t.signInBtn}
              </button>
            </form>
            )}
            {authMode === 'signin' && (
              <div className="mt-4 space-y-3">
                <OAuthButtons redirectPath="/portal" orLabel={homeCopy[currentLang].oauthOr} googleLabel={homeCopy[currentLang].oauthGoogle} />
                <button type="button" onClick={() => setAuthMode('signup')} className="w-full text-xs font-bold text-brand cursor-pointer">{t.staffSignupTitle}</button>
              </div>
            )}
          </div>
        </main>

        <AuthFooter lang={currentLang} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        <PageHeader
          start={
          <>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PANOVA" width={1051} height={725} className="h-10 w-auto object-contain shrink-0" />
            <div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> {t.authSystem}
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">{t.mgmtTitle}</h1>
            </div>
          </div>

            <div data-header-user className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">{currentUser?.name}</span>
                <span className="text-[10px] text-emerald-800 uppercase font-semibold">
                  {getRoleDisplayName(currentUser?.role_level)}
                </span>
                {isSourceCountryOfficer(currentUser?.role_level) && normalizeReferralCode(currentUser?.referral_code) ? (
                  <span className="mt-1 block normal-case">
                    <ReferralCodeChip
                      code={normalizeReferralCode(currentUser.referral_code) as string}
                      label={ui.referralCodeYours}
                      copyLabel={ui.referralCodeCopy}
                      copiedLabel={ui.referralCodeCopied}
                    />
                    <span className="mt-0.5 block text-[10px] font-medium text-emerald-900">{ui.referralCodeImmutable}</span>
                  </span>
                ) : null}
              </div>
            </div>
          </>
          }
          actions={
            <HeaderActions
              lang={currentLang}
              onLanguageChange={changeLanguage}
              homeLabel={t.returnHome}
              logoutLabel={t.logoutBtn}
              onLogout={handleLogout}
            />
          }
        />

        {mfaMode === 'challenge' ? (
          <StaffMfaPanel copy={releaseCopy[currentLang]} blocking onVerified={() => setMfaMode('optional')} />
        ) : null}
        <div className={`flex flex-wrap items-center gap-2 border-b pb-3 text-xs font-bold ${mfaMode === 'challenge' ? 'hidden' : ''}`}>
          {showTab('overview') && (
          <button onClick={() => setActiveTab('overview')} className={`px-3 py-2 rounded-xl cursor-pointer transition text-start leading-snug whitespace-normal ${activeTab === 'overview' ? 'bg-brand-solid text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📊 {t.overviewTab}
          </button>
          )}
          {showTab('candidates') && (
          <button onClick={() => setActiveTab('candidates')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition text-start leading-snug whitespace-normal ${activeTab === 'candidates' ? 'bg-brand-solid text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            👥 {t.candidatesTab} ({candidates.length})
          </button>
          )}
          {showTab('requests') && (
          <button onClick={() => setActiveTab('requests')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition text-start leading-snug whitespace-normal ${activeTab === 'requests' ? 'bg-brand-solid text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📁 {t.requestsTab} ({jobRequests.length})
          </button>
          )}
          
          {showTab('staff') && isUpperManagement && (
            <button onClick={() => setActiveTab('staff')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition text-start leading-snug whitespace-normal ${activeTab === 'staff' ? 'bg-brand-solid text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
              🛡️ {t.staffTab} ({staffMembers.length})
            </button>
          )}

          {showTab('tasks') && (
          <button onClick={() => setActiveTab('tasks')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition text-start leading-snug whitespace-normal ${activeTab === 'tasks' ? 'bg-brand-solid text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            ✅ {t.tasksTab} ({tasks.filter(t => t.status === 'pending').length})
          </button>
          )}
          {showTab('audit') && (
          <button onClick={() => setActiveTab('audit')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition text-start leading-snug whitespace-normal ${activeTab === 'audit' ? 'bg-brand-solid text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📜 {t.auditTab} ({auditLogs.length})
          </button>
          )}
          {showTab('employers') && (
          <button onClick={() => setActiveTab('employers')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition text-start leading-snug whitespace-normal ${activeTab === 'employers' ? 'bg-brand-solid text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            🏢 {t.employersTab} ({employers.length})
          </button>
          )}
          {showTab('support') && (
          <button onClick={() => setActiveTab('support')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition text-start leading-snug whitespace-normal ${activeTab === 'support' ? 'bg-brand-solid text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            💬 {t.supportTab} ({supportTickets.length})
          </button>
          )}
          <Link href="/guides" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition text-start leading-snug whitespace-normal bg-white border text-slate-700 hover:bg-slate-50">
            <BookOpen className="w-3.5 h-3.5" aria-hidden /> {guideNavLabel[currentLang]}
          </Link>
        </div>

        {mfaMode !== 'challenge' && activeTab === 'overview' && showTab('overview') && (
          <div className="space-y-6">
            {(() => {
              // A card opens its tab only when the tab bar above shows that tab
              // (same showTab check; staff also needs upper management).
              const canSeeTab = (tab: StaffTabId) => showTab(tab) && (tab !== 'staff' || isUpperManagement);
              const goTo = (card: OverviewCardId, label: string, value: number) => {
                const tab = overviewCardTarget(card, canSeeTab);
                if (!tab) return {};
                const tabLabel = { candidates: t.candidatesTab, requests: t.requestsTab, employers: t.employersTab, staff: t.staffTab, support: t.supportTab }[card];
                return {
                  onOpen: () => setActiveTab(tab),
                  ariaLabel: `${label}: ${value}. ${(t.overviewGoToTab || '{tab}').replace('{tab}', tabLabel)}`,
                };
              };
              const requestCounts = countOpenRequests(jobRequests);
              const openTasks = tasks.filter(task => task.status === 'pending').length;
              return (
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${isUpperManagement ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
                  <OverviewCard
                    label={t.totalCandidatesCard}
                    value={candidates.length}
                    icon={<Users className="w-9 h-9 sm:w-10 sm:h-10 text-emerald-600 bg-emerald-50 p-2 rounded-xl shrink-0" aria-hidden="true" />}
                    {...goTo('candidates', t.totalCandidatesCard, candidates.length)}
                  />
                  <OverviewCard
                    label={t.requestsTab}
                    value={requestCounts.open}
                    sub={(t.overviewTotalOf || '{n}').replace('{n}', String(requestCounts.total))}
                    icon={<FileText className="w-9 h-9 sm:w-10 sm:h-10 text-amber-700 bg-amber-50 p-2 rounded-xl shrink-0" aria-hidden="true" />}
                    {...goTo('requests', t.requestsTab, requestCounts.open)}
                  />
                  <OverviewCard
                    label={t.activeEmployersCard}
                    value={employers.length}
                    icon={<Building2 className="w-9 h-9 sm:w-10 sm:h-10 text-blue-600 bg-blue-50 p-2 rounded-xl shrink-0" aria-hidden="true" />}
                    {...goTo('employers', t.activeEmployersCard, employers.length)}
                  />
                  {isUpperManagement && (
                    <OverviewCard
                      label={t.staffTab}
                      value={staffMembers.length}
                      valueClassName="text-indigo-600"
                      icon={<UserCheck className="w-9 h-9 sm:w-10 sm:h-10 text-indigo-600 bg-indigo-50 p-2 rounded-xl shrink-0" aria-hidden="true" />}
                      {...goTo('staff', t.staffTab, staffMembers.length)}
                    />
                  )}
                  <OverviewCard
                    label={t.openSupportCard}
                    value={openTasks}
                    valueClassName="text-emerald-700"
                    icon={<CheckSquare className="w-9 h-9 sm:w-10 sm:h-10 text-emerald-600 bg-emerald-50 p-2 rounded-xl shrink-0" aria-hidden="true" />}
                    {...goTo('support', t.openSupportCard, openTasks)}
                  />
                </div>
              );
            })()}

            {mfaMode === 'optional' ? (
              <StaffMfaPanel
                copy={releaseCopy[currentLang]}
                blocking={false}
                onVerified={() => setMfaMode('optional')}
              />
            ) : null}
            <div className="bg-amber-50 border border-amber-200 p-4 sm:p-6 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-start gap-4">
                <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-amber-900 text-xs sm:text-sm">{t.delayAlertsTitle}</h4>
                  <p className="text-xs text-amber-800">{t.delayAlertsDesc}</p>
                </div>
              </div>
              {(() => {
                const copy = releaseCopy[currentLang];
                const now = Date.now();
                const visaLate = candidates.filter((cand) => cand.status === 'visa_processing' && cand.updated_at && now - new Date(cand.updated_at).getTime() > 15 * 86400000);
                const missingDocs = candidates.filter((cand) => !cand.passport_number);
                const lateTasks = tasks.filter((task) => taskIsOverdue(task.due_date, task.status));
                const lateDemands = jobRequests.filter((req) => taskIsOverdue(req.target_start_date, req.status === 'completed' ? 'completed' : 'pending'));
                const blocks = [
                  [copy.delayVisa, visaLate.map((cand) => cand.full_name)],
                  [copy.delayDocs, missingDocs.map((cand) => cand.full_name)],
                  [copy.delayTasks, lateTasks.map((task) => task.title)],
                  [copy.delayDemands, lateDemands.map((req) => localizeCatalogTitle(req.position_title, currentLang))],
                ].filter(([, names]) => (names as string[]).length);
                if (!blocks.length) return <p className="text-xs text-amber-900">{copy.delayNone}</p>;
                return blocks.map(([title, names]) => (
                  <div key={String(title)} className="text-xs text-amber-950">
                    <p className="font-bold">{title}</p>
                    <p>{(names as string[]).filter(Boolean).join(', ')}</p>
                  </div>
                ));
              })()}
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">{t.portalSummaryTitle}</h3>
              <p className="text-xs sm:text-sm text-slate-600">{t.portalSummaryDesc}</p>
            </div>

            {isUpperManagement && <DemoDataCard t={t} onChanged={fetchAllData} />}
          </div>
        )}

        {mfaMode !== 'challenge' && activeTab === 'candidates' && showTab('candidates') && (
          <CandidatesTab 
            candidates={candidates}
            staffMembers={staffMembers}
            currentLang={currentLang}
            t={t}
            fetchAllData={fetchAllData}
            updateCandidateAssignee={updateCandidateAssignee}
            updateCandidateStatus={updateCandidateStatus}
            canChangeStatus={canUpdateRequestStatus(userRole)}
            canAssign={canAssignCandidate(userRole)}
            logAudit={logAudit}
            currentUser={currentUser}
            isUpperManagement={isUpperManagement}
          />
        )}

        {mfaMode !== 'challenge' && activeTab === 'requests' && showTab('requests') && (
          <RequestsTab 
            jobRequests={jobRequests}
            t={t}
            updateRequestStatus={updateRequestStatus}
            setSelectedDemandDetail={setSelectedDemandDetail}
            isUpperManagement={isUpperManagement}
            canChangeStatus={canUpdateRequestStatus(userRole)}
            onChanged={fetchAllData}
          />
        )}

        {mfaMode !== 'challenge' && activeTab === 'staff' && showTab('staff') && isUpperManagement && (
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
            onChanged={fetchAllData}
          />
        )}

        {mfaMode !== 'challenge' && activeTab === 'tasks' && showTab('tasks') && (
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
            linkType={newTaskLinkType}
            setLinkType={(v: string) => { setNewTaskLinkType(v); setNewTaskLinkId(''); }}
            linkId={newTaskLinkId}
            setLinkId={setNewTaskLinkId}
            linkOptions={{
              candidate: candidates.map((c: any) => ({ id: c.id, label: c.full_name || c.name || c.id })),
              request: jobRequests.map((r: any) => ({ id: r.id, label: `${localizeCatalogTitle(r.position_title, currentLang) || 'Talep'} · ${r.employer_name || ''}` })),
              employer: employers.map((e: any) => ({ id: e.id, label: e.company_name || e.name || e.id })),
            }}
          />
        )}

        {mfaMode !== 'challenge' && activeTab === 'audit' && showTab('audit') && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-700" /> {t.auditLogTitle}
            </h3>
            <p className="text-xs text-muted-foreground">{t.auditLogSub}</p>

            <ScrollTable stickyFirstColumn>
              <table className="w-full text-left rtl:text-right text-xs sm:text-sm text-slate-600 [&_td:first-child]:min-w-[10rem] [&_td:last-child]:whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b">
                  <tr>
                    <th className="p-4">{t.colAction}</th>
                    <th className="p-4">{t.colPerformer}</th>
                    <th className="p-4">{t.colTime}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length === 0 && (<tr><td colSpan={3} className="p-4 text-center text-muted-foreground">{ui.noAuditYet}</td></tr>)}
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">
                        {log.actionKey ? (t as any)[log.actionKey] || log.actionKey : log.action}
                      </td>
                      <td className="p-4">{log.performer}{log.entity ? <span className="ml-1 text-[10px] text-muted-foreground">({log.entity})</span> : null}{log.is_demo ? <span className="ml-1 text-[10px] px-1 rounded bg-amber-100 text-amber-700">demo</span> : null}</td>
                      <td className="p-4 text-[11px] text-muted-foreground">{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
          </div>
        )}

        {mfaMode !== 'challenge' && activeTab === 'employers' && showTab('employers') && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">{t.employersTab}</h3>
              <ListExportBar
                filename="employers"
                title={t.employersTab || 'Employers'}
                rows={employerExportRows(employers, currentLang)}
                lang={currentLang}
                dir={isRtl ? 'rtl' : 'ltr'}
                labels={{ csv: ui.exportCsv, excel: ui.exportExcel, print: ui.exportPrint, empty: ui.exportEmpty, popupBlocked: ui.exportPopupBlocked }}
              />
            </div>
            {employers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">{t.noEmployers}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employers.map((emp) => (
                  <div key={emp.id} className="p-4 bg-slate-50 rounded-2xl border space-y-2 text-xs sm:text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/portal/employers/${emp.id}`} className="font-extrabold text-slate-900 hover:underline">
                        {emp.company_name}<DemoBadge show={emp.is_demo} />
                      </Link>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                      <Link href={`/portal/employers/${emp.id}`} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm">📂 {ui.employerFile}</Link>
                      <button
                        onClick={() => {
                          localStorage.setItem('panova_employer_user', JSON.stringify({
                            id: emp.id,
                            company_name: emp.company_name,
                            isAdminImpersonation: true,
                          }));
                          window.location.href = `/employer?as=${emp.id}`;
                        }}
                        className="px-3 py-1.5 bg-brand-solid hover:bg-brand text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                      >
                        {ui.viewEmployerPortal}
                      </button>
                      {isUpperManagement && emp.compliance_status === 'pending' ? (
                        <button type="button" className="px-3 py-1.5 bg-amber-800 text-on-dark rounded-xl text-xs font-bold" onClick={async () => {
                          const { error } = await supabase.from('employers').update({ compliance_status: 'approved' }).eq('id', emp.id);
                          if (error) alert(error.message);
                          else fetchAllData();
                        }}>{releaseCopy[currentLang].employerApprove}</button>
                      ) : null}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Contact: <strong>{emp.contact_person}</strong> | Country: {emp.country}</p>
                    <EmployerLoginInvite
                      compact
                      staff={{ role: userRole, scopeCountry: currentUser?.scope_country }}
                      employerId={emp.id}
                      email={emp.email}
                      country={emp.country}
                      locale={emp.locale}
                      authUserId={emp.auth_user_id}
                      invitedAt={emp.invited_at}
                      onSent={(result) => setEmployers((rows) => rows.map((row) => row.id === emp.id ? {
                        ...row,
                        invited_at: result.invitedAt || row.invited_at,
                        auth_user_id: result.linked ? (result.authUserId || row.auth_user_id) : row.auth_user_id,
                      } : row))}
                    />
                    {isUpperManagement ? (
                      <div data-delete-row className={DELETE_ROW_CLASS}>
                        <DeleteRecordButton
                          table="employers"
                          id={emp.id}
                          name={emp.company_name || emp.id}
                          isDemo={emp.is_demo}
                          allowed={isUpperManagement}
                          onDeleted={fetchAllData}
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {mfaMode !== 'challenge' && activeTab === 'support' && showTab('support') && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{t.supportTab}</h3>
            {supportTickets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">{t.noSupport}</div>
            ) : (
              <div className="space-y-3">
                {supportTickets.map((tkt) => (
                  <div key={tkt.id} className="p-4 bg-slate-50 rounded-2xl border space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-slate-900 gap-2">
                      <span>{tkt.subject} ({tkt.candidate_name})</span>
                      <span className={`uppercase text-[10px] ${String(tkt.status).toLowerCase() === 'answered' ? 'text-emerald-700' : 'text-red-600'}`}>{tkt.status}</span>
                    </div>
                    <p className="text-muted-foreground">{tkt.created_at ? String(tkt.created_at).slice(0, 16).replace('T', ' ') : ''}</p>
                    <p className="text-foreground">{t.message}: {tkt.message}</p>
                    {threadForTicket(tkt, supportMessages).length === 0 ? (
                      <p className="text-muted-foreground">{releaseCopy[currentLang].supportNoReply}</p>
                    ) : threadForTicket(tkt, supportMessages).map((message) => (
                      <div key={message.id} className="rounded-xl border border-line bg-card px-3 py-2">
                        <p className="font-bold text-foreground">
                          {message.author_role === 'staff'
                            ? (message.author_name || releaseCopy[currentLang].supportReply)
                            : (message.author_name || tkt.candidate_name)}
                          {message.created_at ? (
                            <span className="ms-2 font-semibold text-muted-foreground">
                              {new Date(message.created_at).toLocaleString(dateLocale[currentLang])}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-foreground">{message.body}</p>
                      </div>
                    ))}
                    {String(tkt.status).toLowerCase() !== 'closed' ? (
                      <form className="flex flex-col sm:flex-row gap-2" onSubmit={async (event) => {
                        event.preventDefault();
                        const form = event.currentTarget;
                        const reply = String(new FormData(form).get('reply') || '').trim();
                        if (!reply) return;
                        const repliedAt = new Date().toISOString();
                        const userId = (await supabase.auth.getUser()).data.user?.id ?? null;
                        await supabase.from('support_ticket_messages').insert({
                          ticket_id: tkt.id,
                          author_role: 'staff',
                          author_name: currentUser?.name || null,
                          body: reply,
                        });
                        const { error } = await supabase.from('candidate_support_tickets').update({
                          admin_reply: reply,
                          status: 'answered',
                          replied_at: repliedAt,
                          replied_by: userId,
                          replied_by_name: currentUser?.name || null,
                        }).eq('id', tkt.id);
                        if (error) {
                          alert(error.message);
                          return;
                        }
                        form.reset();
                        if (tkt.candidate_id) {
                          const { data: sess } = await supabase.auth.getSession();
                          const sent = await fetch('/api/support/reply-email', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${sess.session?.access_token || ''}`,
                            },
                            body: JSON.stringify({ ticketId: tkt.id }),
                          });
                          if (!sent.ok) alert(releaseCopy[currentLang].supportEmailFailed);
                        }
                        fetchAllData();
                      }}>
                        <input name="reply" required placeholder={releaseCopy[currentLang].supportReplyPh} className="flex-1 px-3 py-2 rounded-xl border bg-white text-slate-900" />
                        <button type="submit" className="px-3 py-2 rounded-xl bg-[#2e7d32] text-white font-bold">{releaseCopy[currentLang].supportSendReply}</button>
                        <button type="button" className="px-3 py-2 rounded-xl border font-bold" onClick={async () => {
                          await supabase.from('candidate_support_tickets').update({ status: 'closed' }).eq('id', tkt.id);
                          fetchAllData();
                        }}>{releaseCopy[currentLang].supportClose}</button>
                      </form>
                    ) : null}
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
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">{localizeCatalogTitle(selectedDemandDetail.position_title, currentLang)} - {selectedDemandDetail.employer_name}</h3>
              </div>
              <button onClick={() => setSelectedDemandDetail(null)} className="text-muted-foreground hover:text-slate-600 font-bold text-xl cursor-pointer p-2">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
              <div className="bg-slate-50 p-4 rounded-2xl border space-y-2">
                <h4 className="font-extrabold text-slate-900 uppercase text-xs text-emerald-800 border-b pb-1">📌 Demand Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div><strong>Employer:</strong> {selectedDemandDetail.employer_name}</div>
                  <div><strong>Country / City:</strong> {selectedDemandDetail.country} / {selectedDemandDetail.city || 'Center'}</div>
                  <div><strong>Sector:</strong> {selectedDemandDetail.sector}</div>
                  <div><strong>Position:</strong> {localizeCatalogTitle(selectedDemandDetail.position_title, currentLang)}</div>
                  <div><strong>Headcount:</strong> {selectedDemandDetail.headcount}</div>
                  <div><strong>Created Date:</strong> {selectedDemandDetail.created_at ? selectedDemandDetail.created_at.substring(0, 10) : 'N/A'}</div>
                  <div><strong>Target Start:</strong> {selectedDemandDetail.target_start_date || '2026-10-15'}</div>
                  <div><strong>Status:</strong> <span className="uppercase font-bold text-emerald-700">{selectedDemandDetail.status}</span></div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border space-y-2">
                <h4 className="font-extrabold text-slate-900 uppercase text-xs text-emerald-800 border-b pb-1">💼 Working Conditions & Benefits</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div><strong>Salary:</strong> {displayedRequestSalary(selectedDemandDetail, dateLocale[currentLang]) || 'Negotiable'}</div>
                  <div><strong>Working Hours:</strong> {selectedDemandDetail.working_hours || '40-45 hrs/week'}</div>
                  <div><strong>Weekly Days:</strong> {selectedDemandDetail.weekly_days || '5-6 Days'}</div>
                  <div><strong>Overtime:</strong> {selectedDemandDetail.overtime_policy || 'Standard Legal'}</div>
                  <div><strong>{t.facilityAccommodation}:</strong> {benefitPhrase({ provided: t.benefitProvided || '', notProvided: t.benefitNotProvided || '', unanswered: t.benefitUnanswered || '' }, selectedDemandDetail.accommodation_provided ?? selectedDemandDetail.accommodation)}</div>
                  <div><strong>{t.facilityFood}:</strong> {benefitPhrase({ provided: t.benefitProvided || '', notProvided: t.benefitNotProvided || '', unanswered: t.benefitUnanswered || '' }, selectedDemandDetail.food_provided ?? selectedDemandDetail.food_allowance)}</div>
                  <div><strong>{t.facilityTransport}:</strong> {benefitPhrase({ provided: t.benefitProvided || '', notProvided: t.benefitNotProvided || '', unanswered: t.benefitUnanswered || '' }, selectedDemandDetail.transport_provided ?? selectedDemandDetail.transportation)}</div>
                  <div><strong>Flight Ticket:</strong> {selectedDemandDetail.flight_ticket ? '✅ Employer Covers' : 'Candidate'}</div>
                  <div><strong>{t.durationLabel}:</strong> {formatContractDuration(selectedDemandDetail.contract_type || selectedDemandDetail.contract_term, currentLang, t) || '—'}</div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border space-y-2">
                <h4 className="font-extrabold text-slate-900 uppercase text-xs text-emerald-800 border-b pb-1">🎯 Candidate Criteria & Qualifications</h4>
                <div className="space-y-1 text-slate-700">
                  <div><strong>Experience:</strong> {selectedDemandDetail.experience_required || 'Min 2 years'}</div>
                  <div><strong>Certificate:</strong> {selectedDemandDetail.certificate_required || 'Professional Certificate Required'}</div>
                  <div><strong>Language:</strong> {selectedDemandDetail.required_language || selectedDemandDetail.language_required || 'Basic English or Local Language'}</div>
                  <div><strong>Special Req:</strong> {selectedDemandDetail.special_requirements || selectedDemandDetail.special_reqs || 'Shift suitability.'}</div>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-2">
                <h4 className="font-extrabold text-emerald-900 uppercase text-xs border-b border-emerald-200 pb-1">📊 Process Counts & Metrics</h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border">
                    <span className="block text-muted-foreground text-[10px]">Requested</span>
                    <strong className="text-base text-slate-900">{selectedDemandDetail.headcount}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border">
                    <span className="block text-muted-foreground text-[10px]">Connected</span>
                    <strong className="text-base text-blue-600">{candidates.length}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border">
                    <span className="block text-muted-foreground text-[10px]">Approved</span>
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
                      <strong>{cand.full_name}</strong> ({candidateProfessionLabel(cand.profession, ui.general, currentLang)}) - <span className="text-muted-foreground">{cand.nationality || cand.country}</span>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg font-bold uppercase text-[10px]">
                      {cand.status}
                    </span>
                  </div>
                ))}
                {candidates.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No candidates assigned yet.</p>
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
                className="bg-brand-solid hover:bg-brand text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow cursor-pointer"
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
              <button onClick={() => setEditingStaff(null)} className="text-muted-foreground hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
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
                {(editingStaff.role_level === 'source_country' || editingStaff.role_level === 'target_country') ? (
                  <div className="mt-2 space-y-1">
                    <label className="block font-bold text-slate-700 uppercase mb-1">{releaseCopy[currentLang].scopeCountry}</label>
                    <input value={editingStaff.scope_country || ''} onChange={(e) => setEditingStaff({ ...editingStaff, scope_country: e.target.value })} placeholder="Turkey" className="w-full px-3.5 py-2.5 rounded-xl border font-medium text-slate-900 bg-white" />
                    <p className="text-[11px] text-muted-foreground">{releaseCopy[currentLang].scopeHint}</p>
                  </div>
                ) : null}
                {editingStaff.role_level === 'source_country' ? (
                  <div className="mt-2 space-y-1">
                    <p className="font-bold text-slate-700 uppercase">{ui.referralCode}</p>
                    {normalizeReferralCode(editingStaff.referral_code) ? (
                      <p className="font-mono font-bold text-slate-900">{normalizeReferralCode(editingStaff.referral_code)}</p>
                    ) : null}
                    <p className="text-[11px] font-medium text-muted-foreground leading-snug">
                      {normalizeReferralCode(editingStaff.referral_code) ? ui.referralCodeImmutable : ui.referralCodeOnInvite}
                    </p>
                  </div>
                ) : null}
              </div>
              <button type="submit" className="w-full bg-brand-solid hover:bg-brand text-white py-3 rounded-xl font-bold transition shadow cursor-pointer text-xs">
                Save Changes and Password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}