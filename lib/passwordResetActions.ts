import { recordEmailProof } from '@/lib/emailVerification';
import { normalizeEmail } from '@/lib/emailAddress';
import {
  isUnknownUserResetError,
  markRecoveryPending,
  rememberResetAudience,
  rememberResetEmail,
  recoveryProofFromInput,
  resetRedirectUrl,
  type ResetAudience,
} from '@/lib/passwordReset';
import { supabase } from '@/lib/supabase';

export async function requestPasswordReset(email: string, audience: ResetAudience): Promise<'sent' | 'failed'> {
  const target = normalizeEmail(email);
  if (!target.includes('@') || target.startsWith('@')) return 'failed';
  rememberResetAudience(audience);
  rememberResetEmail(target);
  const { error } = await supabase.auth.resetPasswordForEmail(target, {
    redirectTo: resetRedirectUrl(window.location.origin, audience),
  });
  if (!error || isUnknownUserResetError(error.message)) return 'sent';
  return 'failed';
}

export async function verifyRecoveryProof(email: string, raw: string): Promise<'ok' | 'rejected'> {
  const proof = recoveryProofFromInput(raw, email);
  if (proof.kind === 'rejected') return 'rejected';
  const { data, error } = proof.kind === 'hash'
    ? await supabase.auth.verifyOtp({ token_hash: proof.tokenHash, type: 'recovery' })
    : await supabase.auth.verifyOtp({ email: proof.email, token: proof.token, type: 'recovery' });
  if (error || !data.session) return 'rejected';
  markRecoveryPending();
  return 'ok';
}

export async function completePasswordReset(password: string): Promise<'ok' | 'failed'> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return 'failed';
  await recordEmailProof();
  return 'ok';
}
