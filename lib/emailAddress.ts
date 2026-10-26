/** Mailbox domain checks shared by signup and the supplier hint. */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** True for @gmail.com and @googlemail.com only. */
export function isGmailAddress(email: string): boolean {
  const domain = normalizeEmail(email).split('@')[1] || '';
  return domain === 'gmail.com' || domain === 'googlemail.com';
}

type Identity = { provider?: string | null };
type AppMeta = { provider?: unknown; providers?: unknown };

/**
 * Google already proved the mailbox. Password signups, including Gmail
 * typed by hand, are not proved until the Supabase confirmation step.
 */
export function isGoogleProvedUser(
  user: { identities?: Identity[] | null; app_metadata?: AppMeta | null } | null | undefined,
): boolean {
  if (!user) return false;
  if (user.identities?.some((identity) => identity.provider === 'google')) return true;
  const app = user.app_metadata;
  if (!app) return false;
  if (app.provider === 'google') return true;
  return Array.isArray(app.providers) && app.providers.includes('google');
}
