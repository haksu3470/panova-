import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { isGoogleProvedUser } from '@/lib/emailAddress';

export type VerifyChannel = 'signup' | 'otp';

export type GateResult =
  | { status: 'none' }
  | { status: 'ready' }
  | { status: 'verify'; email: string };

const EMAIL_KEY = 'panova_verify_email';
const CHANNEL_KEY = 'panova_verify_channel';

let suppressCount = 0;
let listenerPause = 0;

/** Signup briefly holds a session before we know the mailbox is proved. */
export function emailGateSuppressed(): boolean {
  return suppressCount > 0;
}

export function pauseEmailGateListener(): () => void {
  listenerPause += 1;
  return () => {
    listenerPause = Math.max(0, listenerPause - 1);
  };
}

export function emailGateListenerPaused(): boolean {
  return listenerPause > 0;
}

export function rememberVerifyEmail(email: string, channel: VerifyChannel = 'signup') {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
  sessionStorage.setItem(CHANNEL_KEY, channel);
}

export function storedVerifyEmail(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(EMAIL_KEY) || '';
}

export function storedVerifyChannel(): VerifyChannel {
  if (typeof window === 'undefined') return 'signup';
  return sessionStorage.getItem(CHANNEL_KEY) === 'otp' ? 'otp' : 'signup';
}

export function clearVerifyEmail() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(EMAIL_KEY);
  sessionStorage.removeItem(CHANNEL_KEY);
}

export function isEmailNotConfirmedMessage(message: string | undefined): boolean {
  if (!message) return false;
  return /not confirmed|email_not_confirmed/i.test(message);
}

export async function emailAccessOk(): Promise<boolean> {
  const { data, error } = await supabase.rpc('email_access_ok');
  if (error) return false;
  return data === true;
}

export async function recordEmailProof(): Promise<boolean> {
  const { data, error } = await supabase.rpc('record_email_proof');
  if (error) return false;
  return data === true;
}

function redirectUrl(redirectPath: string): string {
  return `${window.location.origin}${redirectPath}`;
}

async function sendMailboxProof(
  email: string,
  emailRedirectTo: string,
): Promise<{ status: 'verify'; email: string } | { status: 'error'; message: string }> {
  const otp = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo },
  });
  if (otp.error) return { status: 'error', message: otp.error.message };
  rememberVerifyEmail(email, 'otp');
  return { status: 'verify', email };
}

/**
 * Password signup never proves the address. Google OAuth is a separate button.
 * Non-Gmail must confirm. A Gmail typed with a password must confirm too.
 */
export async function beginPasswordSignup(args: {
  email: string;
  password: string;
  redirectPath: string;
  metadata: Record<string, string>;
}): Promise<{ status: 'verify'; email: string } | { status: 'error'; message: string }> {
  const email = args.email.trim().toLowerCase();
  const emailRedirectTo = redirectUrl(args.redirectPath);
  suppressCount += 1;
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: args.password,
      options: { emailRedirectTo, data: args.metadata },
    });
    if (error) {
      const already = /already registered|already exists|user already/i.test(error.message);
      if (!already) return { status: 'error', message: error.message };
      return sendMailboxProof(email, emailRedirectTo);
    }

    const confirmed = Boolean(data.user?.email_confirmed_at || data.user?.confirmed_at);
    if (!data.session || !confirmed) {
      rememberVerifyEmail(email, 'signup');
      return { status: 'verify', email };
    }

    // Autoconfirm issued a session without a mailbox proof. Drop it and send a real link.
    await supabase.auth.signOut();
    return sendMailboxProof(email, emailRedirectTo);
  } finally {
    suppressCount = Math.max(0, suppressCount - 1);
  }
}

export async function resendVerification(email: string, redirectPath: string): Promise<{ ok: boolean; message?: string }> {
  const emailRedirectTo = redirectUrl(redirectPath);
  const target = email.trim().toLowerCase();
  const signup = await supabase.auth.resend({
    type: 'signup',
    email: target,
    options: { emailRedirectTo },
  });
  if (!signup.error) {
    rememberVerifyEmail(target, 'signup');
    return { ok: true };
  }
  const otp = await supabase.auth.signInWithOtp({
    email: target,
    options: { shouldCreateUser: false, emailRedirectTo },
  });
  if (otp.error) return { ok: false, message: otp.error.message };
  rememberVerifyEmail(target, 'otp');
  return { ok: true };
}

export async function confirmEmailCode(email: string, token: string): Promise<{ ok: boolean; message?: string }> {
  const clean = token.trim();
  if (!clean) return { ok: false, message: 'Kod gerekli.' };
  const order: Array<'signup' | 'email' | 'magiclink'> =
    storedVerifyChannel() === 'otp' ? ['email', 'magiclink', 'signup'] : ['signup', 'email', 'magiclink'];
  let last = 'Kod kabul edilmedi.';
  for (const type of order) {
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: clean, type });
    if (!error) {
      const proved = await recordEmailProof();
      if (!proved) {
        await signOut();
        return { ok: false, message: 'Doğrulama oturumu kanıtlanamadı. Bağlantıyı yeniden isteyin.' };
      }
      clearVerifyEmail();
      return { ok: true };
    }
    last = error.message;
  }
  return { ok: false, message: last };
}

async function gateSessionImpl(): Promise<GateResult> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  const user = session?.user as User | undefined;
  if (!session || !user) return { status: 'none' };
  if (isGoogleProvedUser(user)) {
    clearVerifyEmail();
    return { status: 'ready' };
  }
  if (await emailAccessOk()) {
    clearVerifyEmail();
    return { status: 'ready' };
  }
  if (await recordEmailProof()) {
    clearVerifyEmail();
    return { status: 'ready' };
  }
  const email = user.email || storedVerifyEmail();
  if (email) rememberVerifyEmail(email, storedVerifyChannel());
  await signOut();
  return { status: 'verify', email };
}

let inflight: Promise<GateResult> | null = null;

export function gateSession(): Promise<GateResult> {
  if (suppressCount > 0) return Promise.resolve({ status: 'none' });
  if (!inflight) {
    inflight = gateSessionImpl().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}
