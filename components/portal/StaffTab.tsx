'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Trash2, ShieldCheck } from 'lucide-react';
import DemoBadge from './DemoBadge';
import { DELETE_BUTTON_CLASS, DELETE_ROW_CLASS } from './DeleteRecordButton';
import { ReferralCodeChip } from './ReferralCodeChip';
import { isCodeIssuingRole, isSourceCountryOfficer, normalizeReferralCode } from '@/lib/referralCode';
import { dateLocale, fill, portalUi } from '@/lib/portal-ui-copy';
import { useSiteLanguage } from '@/lib/site-language';
import { releaseCopy } from '@/lib/release-copy';
import { supabase } from '@/lib/supabase';
import { writeAudit } from '@/lib/audit';
import { isUpperManagementRole } from '@/lib/staffAccess';
import { staffViewLabels } from '@/lib/staffView';
import { demoLoginLabels } from '@/lib/demoLogin';
import DemoLoginButton from './DemoLoginButton';

interface StaffTabProps {
  staffMembers: any[];
  isUpperManagement: boolean;
  t: any;
  newStaffName: string;
  setNewStaffName: (val: string) => void;
  newStaffEmail: string;
  setNewStaffEmail: (val: string) => void;
  newStaffPassword: string;
  setNewStaffPassword: (val: string) => void;
  newStaffRoleLevel: string;
  setNewStaffRoleLevel: (val: string) => void;
  handleAddStaff: (e: React.FormEvent) => void;
  updateStaffRoleLevel: (staffId: string, newLevel: string) => void;
  setEditingStaff: (staff: any) => void;
  handleDeleteStaff: (staffId: string) => void;
  onChanged?: () => void;
  onMfaPolicyChanged?: () => void;
}

export default function StaffTab({
  staffMembers,
  isUpperManagement,
  t,
  newStaffName,
  setNewStaffName,
  newStaffEmail,
  setNewStaffEmail,
  newStaffPassword,
  setNewStaffPassword,
  newStaffRoleLevel,
  setNewStaffRoleLevel,
  handleAddStaff,
  updateStaffRoleLevel,
  setEditingStaff,
  handleDeleteStaff,
  onChanged,
  onMfaPolicyChanged,
}: StaffTabProps) {
  const { currentLang } = useSiteLanguage('en');
  const ui = portalUi[currentLang];
  const copy = releaseCopy[currentLang];
  const [mfaRequired, setMfaRequired] = useState<boolean | null>(null);
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaMsg, setMfaMsg] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.rpc('staff_mfa_required');
      if (alive) setMfaRequired(data === true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setMfaPolicy = async (next: boolean) => {
    if (mfaBusy || mfaRequired === next) return;
    setMfaBusy(true);
    setMfaMsg('');
    const { data, error } = await supabase
      .from('app_settings')
      .update({ value: next, updated_at: new Date().toISOString() })
      .eq('key', 'staff_mfa_required')
      .select('key');
    setMfaBusy(false);
    if (error || !data?.length) {
      setMfaMsg(copy.mfaPolicyFailed);
      return;
    }
    setMfaRequired(next);
    setMfaMsg(copy.mfaPolicySaved);
    void writeAudit(
      next ? 'staff_mfa_required_on' : 'staff_mfa_required_off',
      'app_settings',
      'staff_mfa_required',
    );
    onMfaPolicyChanged?.();
  };

  const setMemberMfa = async (staffId: string, next: boolean) => {
    setMfaMsg('');
    const { data, error } = await supabase
      .from('staff_members')
      .update({ mfa_required: next, updated_at: new Date().toISOString() })
      .eq('id', staffId)
      .select('id');
    if (error || !data?.length) {
      setMfaMsg(copy.mfaMemberFailed);
      return;
    }
    void writeAudit(
      next ? 'staff_member_mfa_on' : 'staff_member_mfa_off',
      'staff_members',
      staffId,
    );
    onChanged?.();
    onMfaPolicyChanged?.();
  };

  const setMemberTestAccount = async (staffId: string, next: boolean) => {
    setMfaMsg('');
    const { data, error } = await supabase
      .from('staff_members')
      .update({ is_test_account: next, updated_at: new Date().toISOString() })
      .eq('id', staffId)
      .select('id');
    if (error || !data?.length) {
      setMfaMsg(demoLoginLabels[currentLang].failed);
      return;
    }
    void writeAudit(next ? 'staff_member_test_account_on' : 'staff_member_test_account_off', 'staff_members', staffId);
    onChanged?.();
  };

  const setMemberPortalView = async (staffId: string, next: boolean) => {
    setMfaMsg('');
    const { data, error } = await supabase
      .from('staff_members')
      .update({ can_view_candidate_portal: next, updated_at: new Date().toISOString() })
      .eq('id', staffId)
      .select('id');
    if (error || !data?.length) {
      setMfaMsg(staffViewLabels[currentLang].failed);
      return;
    }
    void writeAudit(next ? 'staff_member_portal_view_on' : 'staff_member_portal_view_off', 'staff_members', staffId);
    onChanged?.();
  };

  if (!isUpperManagement) {
    return (
      <div className="bg-white p-8 rounded-2xl border text-center text-muted-foreground text-sm">
        {ui.staffRestricted}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="bg-emerald-50 border border-emerald-200 p-4 sm:p-5 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-emerald-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" /> {copy.mfaPolicyTitle}
            </h3>
            <p className="text-[11px] text-emerald-900/80 leading-snug">{copy.mfaPolicyHint}</p>
            {mfaMsg ? <p className="text-[11px] font-bold text-emerald-800">{mfaMsg}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0" role="group" aria-label={copy.mfaPolicyTitle}>
            <button
              type="button"
              disabled={mfaBusy || mfaRequired === null}
              aria-pressed={mfaRequired === true}
              onClick={() => setMfaPolicy(true)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition disabled:bg-disabled disabled:text-on-dark disabled:opacity-100 ${
                mfaRequired === true
                  ? 'bg-brand-solid text-on-dark shadow'
                  : 'bg-white border border-emerald-300 text-slate-800 hover:bg-white/80'
              }`}
            >
              {copy.mfaPolicyOn}
            </button>
            <button
              type="button"
              disabled={mfaBusy || mfaRequired === null}
              aria-pressed={mfaRequired === false}
              onClick={() => setMfaPolicy(false)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition disabled:bg-disabled disabled:text-on-dark disabled:opacity-100 ${
                mfaRequired === false
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-white border border-emerald-300 text-slate-800 hover:bg-white/80'
              }`}
            >
              {copy.mfaPolicyOff}
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4 h-fit">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-emerald-700" /> {t.addStaffTitle}
        </h3>
        <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">{t.staffNameLabel}</label>
            <input type="text" required value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} placeholder="Ahmet Yilmaz" className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium text-slate-900 bg-white text-xs sm:text-sm" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">{t.staffEmailLabel}</label>
            <input type="email" required value={newStaffEmail} onChange={(e) => setNewStaffEmail(e.target.value)} placeholder="ahmet@panova.com" className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium text-slate-900 bg-white text-xs sm:text-sm" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground leading-snug">{ui.staffInviteHint}</p>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">{t.staffPermLabel}</label>
            <select 
              value={newStaffRoleLevel} 
              onChange={(e) => setNewStaffRoleLevel(e.target.value)} 
              className="w-full px-3.5 py-3 rounded-xl border font-bold text-slate-900 bg-white cursor-pointer text-xs sm:text-sm shadow-sm"
            >
              <option value="upper_management" className="text-slate-900 bg-white">👑 {t.roleUpperManagement}</option>
              <option value="source_country" className="text-slate-900 bg-white">🌍 {t.roleSourceCountry}</option>
              <option value="target_country" className="text-slate-900 bg-white">🏢 {t.roleTargetCountry}</option>
              <option value="field_officer" className="text-slate-900 bg-white">✈️ {t.roleFieldOfficer}</option>
            </select>
            {newStaffRoleLevel === 'source_country' ? (
              <p className="mt-2 text-[11px] font-medium text-muted-foreground leading-snug">{ui.referralCodeOnInvite}</p>
            ) : null}
          </div>
          <button type="submit" className="w-full bg-brand-solid hover:bg-brand text-white py-3.5 rounded-xl font-bold transition cursor-pointer shadow-md text-xs sm:text-sm">
            {ui.sendInvite}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span>{t.staffMatrixTitle}</span>
          <span className="text-[11px] font-normal text-muted-foreground">{t.staffMatrixSub}</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {staffMembers.map((staff) => (
            <div key={staff.id} className="p-4 bg-slate-50 rounded-2xl border space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="min-w-0 font-extrabold text-slate-900 text-sm [overflow-wrap:anywhere]">{staff.name}<DemoBadge show={staff.is_demo} /></h4>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => setEditingStaff(staff)} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold transition cursor-pointer">{ui.edit}</button>
                  </div>
                </div>
                <p dir="ltr" className="text-xs text-muted-foreground [overflow-wrap:anywhere] rtl:text-right">{staff.email}</p>
                {isCodeIssuingRole(staff.role_level) && normalizeReferralCode(staff.referral_code) ? (
                  <div className="space-y-1">
                    <ReferralCodeChip
                      code={normalizeReferralCode(staff.referral_code) as string}
                      label={ui.referralCode}
                      copyLabel={ui.referralCodeCopy}
                      copiedLabel={ui.referralCodeCopied}
                    />
                    <p className="text-[10px] font-medium text-muted-foreground leading-snug">{ui.referralCodeImmutable}</p>
                  </div>
                ) : null}
                {isSourceCountryOfficer(staff.role_level) && !normalizeReferralCode(staff.referral_code) ? (
                  <p className="text-[11px] font-medium text-amber-700 leading-snug">{ui.sourceOfficerMissingCode}</p>
                ) : null}
                {!staff.auth_user_id && staff.invited_at ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button type="button" onClick={async () => {
                      const { data } = await supabase.auth.getSession();
                      await fetch('/api/staff-invite', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}` },
                        body: JSON.stringify({ name: staff.name, email: staff.email, role: staff.role_level, locale: currentLang }),
                      });
                      onChanged?.();
                    }} className="px-2 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-bold">{releaseCopy[currentLang].inviteResend}</button>
                    <button type="button" onClick={async () => { await supabase.rpc('cancel_staff_invite', { p_staff_id: staff.id }); onChanged?.(); }} className="px-2 py-1 rounded-lg border text-[11px] font-bold">{releaseCopy[currentLang].inviteCancel}</button>
                    <span className="text-[11px] text-muted-foreground">{staff.invite_cancelled_at ? releaseCopy[currentLang].inviteCancelled : staff.invite_expires_at && new Date(staff.invite_expires_at) < new Date() ? releaseCopy[currentLang].inviteExpired : `${releaseCopy[currentLang].inviteExpires}: ${staff.invite_expires_at ? new Date(staff.invite_expires_at).toLocaleDateString(dateLocale[currentLang]) : '—'}`}</span>
                  </div>
                ) : null}
                <p className="text-[11px] font-bold">{staff.auth_user_id
                  ? <span className="text-emerald-700">● {ui.activeAccount}</span>
                  : staff.invited_at
                    ? <span className="text-amber-800">● {fill(ui.invitePending, { date: new Date(staff.invited_at).toLocaleDateString(dateLocale[currentLang]) })}</span>
                    : <span className="text-muted-foreground">● {ui.accountUnlinked}</span>}</p>
              </div>

              <div className="pt-2 border-t space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600 block">
                  {t.permLevelText}
                </span>
                <select
                  value={staff.role_level || 'source_country'}
                  onChange={(e) => updateStaffRoleLevel(staff.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-white text-slate-900 cursor-pointer outline-none shadow-sm"
                >
                  <option value="upper_management" className="text-slate-900 bg-white">👑 {t.roleUpperManagement}</option>
                  <option value="source_country" className="text-slate-900 bg-white">🌍 {t.roleSourceCountry}</option>
                  <option value="target_country" className="text-slate-900 bg-white">🏢 {t.roleTargetCountry}</option>
                  <option value="field_officer" className="text-slate-900 bg-white">✈️ {t.roleFieldOfficer}</option>
                </select>
                <span className="text-[11px] font-bold text-slate-600 block pt-1">
                  {copy.mfaMemberLabel}
                </span>
                <div className="flex flex-wrap gap-2" role="group" aria-label={copy.mfaMemberLabel}>
                  <button
                    type="button"
                    aria-pressed={staff.mfa_required === true || mfaRequired === true}
                    disabled={mfaRequired === true}
                    title={mfaRequired === true ? copy.mfaPolicyOn : undefined}
                    onClick={() => setMemberMfa(staff.id, true)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition disabled:bg-disabled disabled:text-on-dark disabled:opacity-100 ${
                      staff.mfa_required === true || mfaRequired === true
                        ? 'bg-brand-solid text-on-dark shadow'
                        : 'bg-white border text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {copy.mfaMemberOn}
                  </button>
                  <button
                    type="button"
                    aria-pressed={staff.mfa_required !== true && mfaRequired !== true}
                    disabled={mfaRequired === true}
                    title={mfaRequired === true ? copy.mfaPolicyOn : undefined}
                    onClick={() => setMemberMfa(staff.id, false)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition disabled:bg-disabled disabled:text-on-dark disabled:opacity-100 ${
                      staff.mfa_required !== true && mfaRequired !== true
                        ? 'bg-slate-900 text-white shadow'
                        : 'bg-white border text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {copy.mfaMemberOff}
                  </button>
                </div>
                <span className="text-[11px] font-bold text-slate-600 block pt-1">
                  {staffViewLabels[currentLang].memberLabel}
                </span>
                {isUpperManagementRole(staff.role_level) ? (
                  <span className="text-[11px] font-semibold text-slate-600 block">{staffViewLabels[currentLang].always}</span>
                ) : (
                  <div className="flex flex-wrap gap-2" role="group" aria-label={staffViewLabels[currentLang].memberLabel}>
                    {([true, false] as const).map((value) => (
                      <button
                        key={String(value)}
                        type="button"
                        aria-pressed={(staff.can_view_candidate_portal === true) === value}
                        onClick={() => setMemberPortalView(staff.id, value)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                          (staff.can_view_candidate_portal === true) === value
                            ? value ? 'bg-brand-solid text-on-dark shadow' : 'bg-slate-900 text-white shadow'
                            : 'bg-white border text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {value ? staffViewLabels[currentLang].on : staffViewLabels[currentLang].off}
                      </button>
                    ))}
                  </div>
                )}
                <span className="text-[11px] font-bold text-slate-600 block pt-1">
                  {demoLoginLabels[currentLang].testAccount}
                </span>
                <div className="flex flex-wrap gap-2" role="group" aria-label={demoLoginLabels[currentLang].testAccount}>
                  {([true, false] as const).map((value) => (
                    <button
                      key={String(value)}
                      type="button"
                      aria-pressed={(staff.is_test_account === true) === value}
                      onClick={() => setMemberTestAccount(staff.id, value)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                        (staff.is_test_account === true) === value
                          ? value ? 'bg-brand-solid text-on-dark shadow' : 'bg-slate-900 text-white shadow'
                          : 'bg-white border text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {value ? demoLoginLabels[currentLang].on : demoLoginLabels[currentLang].off}
                    </button>
                  ))}
                </div>
                {staff.is_test_account === true && staff.auth_user_id ? (
                  <DemoLoginButton kind="staff" id={staff.id} lang={currentLang} />
                ) : null}
              </div>
              <div data-delete-row className={DELETE_ROW_CLASS}>
                <button type="button" onClick={() => handleDeleteStaff(staff.id)} className={DELETE_BUTTON_CLASS}>
                  <Trash2 aria-hidden className="w-3.5 h-3.5" /> {ui.deleteRecord}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}