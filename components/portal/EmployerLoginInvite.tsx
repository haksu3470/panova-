'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/portal/file/ui';
import { canInviteEmployer, employerInviteLocale, EMPLOYER_INVITE_LOCALES, type EmployerInviteLocale } from '@/lib/employerInvite';
import { dateLocale, fill, portalUi } from '@/lib/portal-ui-copy';
import { useSiteLanguage } from '@/lib/site-language';
import { supabase } from '@/lib/supabase';

type Sent = {
  linked: boolean;
  authUserId: string | null;
  invitedAt: string | null;
  emailSent: boolean;
  error?: string;
  retryAfterSeconds?: number;
};

export default function EmployerLoginInvite({
  employerId,
  email,
  country,
  locale,
  authUserId,
  invitedAt,
  compact = false,
  staff,
  onSent,
  onLocale,
}: {
  employerId: string;
  email: string | null;
  country: string | null;
  locale: string | null;
  authUserId: string | null;
  invitedAt: string | null;
  compact?: boolean;
  /** When the parent already knows the staff row, skip a per-card lookup. */
  staff?: { role?: string | null; scopeCountry?: string | null };
  onSent?: (result: Sent) => void;
  onLocale?: (locale: EmployerInviteLocale) => void;
}) {
  const { currentLang } = useSiteLanguage('tr');
  const copy = portalUi[currentLang].employerInvite;
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'ok' | 'err'>('ok');
  const [savedLocale, setSavedLocale] = useState<EmployerInviteLocale>(employerInviteLocale(locale));

  useEffect(() => {
    setSavedLocale(employerInviteLocale(locale));
  }, [locale]);

  const staffRole = staff?.role;
  const staffScope = staff?.scopeCountry;
  const staffKnown = staff !== undefined;

  useEffect(() => {
    if (staffKnown) {
      setAllowed(canInviteEmployer({
        role: staffRole,
        scopeCountry: staffScope,
        employerCountry: country,
      }));
      return;
    }
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        if (alive) setAllowed(false);
        return;
      }
      const [staffRow, profile] = await Promise.all([
        supabase.from('staff_members').select('role_level, scope_country').eq('auth_user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('staff_role').eq('id', user.id).maybeSingle(),
      ]);
      const role = staffRow.data?.role_level || profile.data?.staff_role;
      if (alive) {
        setAllowed(canInviteEmployer({
          role,
          scopeCountry: staffRow.data?.scope_country,
          employerCountry: country,
        }));
      }
    })();
    return () => {
      alive = false;
    };
  }, [country, staffKnown, staffRole, staffScope]);

  if (allowed !== true) return null;

  const hasEmail = Boolean(email && email.includes('@'));
  const linked = Boolean(authUserId);
  const invitedLabel = invitedAt
    ? fill(copy.invitedAt, { date: new Date(invitedAt).toLocaleDateString(dateLocale[currentLang]) })
    : '';

  const send = async () => {
    setBusy(true);
    setMessage('');
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setTone('err');
      setMessage(copy.forbidden);
      setBusy(false);
      return;
    }
    let payload: Sent & { ok?: boolean; error?: string; retryAfterSeconds?: number };
    try {
      const response = await fetch('/api/employer-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ employerId }),
      });
      payload = await response.json();
    } catch {
      setTone('err');
      setMessage(copy.failed);
      setBusy(false);
      return;
    }
    const code = payload.error;
    if (!payload.emailSent) {
      setTone('err');
      const text = code === 'invite_cooldown'
        ? fill(copy.cooldown, { seconds: payload.retryAfterSeconds || 120 })
        : code === 'staff_account' ? copy.staffAccount
          : code === 'email_linked_elsewhere' ? copy.emailTaken
            : code === 'account_other_role' ? copy.otherRole
              : code === 'employer_email_missing' ? copy.noEmail
                : code === 'forbidden' ? copy.forbidden
                  : code === 'email_unavailable' ? copy.unavailable
                    : code === 'email_failed' ? copy.emailFailed
                      : copy.failed;
      setMessage(text);
      if (payload.invitedAt || payload.linked) onSent?.(payload);
      setBusy(false);
      return;
    }
    setTone('ok');
    setMessage(payload.linked ? copy.sentReset : copy.sentInvite);
    onSent?.(payload);
    setBusy(false);
  };

  const saveLocale = async (next: EmployerInviteLocale) => {
    setSavedLocale(next);
    const { error } = await supabase.from('employers').update({ locale: next }).eq('id', employerId);
    if (error) {
      setTone('err');
      setMessage(copy.failed);
      return;
    }
    onLocale?.(next);
  };

  const body = (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {linked ? <span className="font-bold text-emerald-800">{copy.linked}</span> : null}
        {invitedLabel ? <span className="font-bold text-slate-800">{invitedLabel}</span> : null}
      </div>
      {!compact ? (
        <label className="block text-sm font-bold text-slate-800 space-y-1">
          <span>{copy.localeLabel}</span>
          <select
            value={savedLocale}
            onChange={(event) => { void saveLocale(employerInviteLocale(event.target.value)); }}
            className="w-full max-w-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900"
          >
            {EMPLOYER_INVITE_LOCALES.map((code) => (
              <option key={code} value={code}>{code.toUpperCase()}</option>
            ))}
          </select>
        </label>
      ) : null}
      <button
        type="button"
        onClick={() => { void send(); }}
        disabled={busy || !hasEmail}
        aria-busy={busy}
        aria-describedby={hasEmail ? undefined : `invite-hint-${employerId}`}
        className="bg-[#2e7d32] hover:bg-[#1b5e20] disabled:opacity-60 text-white px-3 py-2 rounded-xl text-xs font-bold"
      >
        {busy ? '…' : linked ? copy.resend : copy.send}
      </button>
      {!hasEmail ? (
        <p id={`invite-hint-${employerId}`} className="text-sm font-medium text-slate-800">{copy.noEmail}</p>
      ) : null}
      {message ? (
        <p role="status" className={`text-sm font-bold ${tone === 'err' ? 'text-red-800' : 'text-slate-800'}`}>{message}</p>
      ) : null}
    </div>
  );

  if (compact) return body;
  return <Card title={copy.title}>{body}</Card>;
}
