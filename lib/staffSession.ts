/**
 * Candidate, employer, and staff pages share one Supabase session per browser.
 * A portal tab that sees another page's SIGNED_IN must not call signOut:
 * that revokes the candidate and the next write runs as `anon`
 * ("permission denied for table job_candidates / candidate_documents").
 *
 * Revoke only an OAuth return that this same portal tab started, and only
 * while that tab is visible. Password sign-in on /candidate leaves no intent.
 */

export const OAUTH_INTENT_KEY = 'panova_oauth_intent';
export const PORTAL_OAUTH_PATH = '/portal';

export function rememberOAuthIntent(path: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(OAUTH_INTENT_KEY, path);
}

/** True only when this tab started OAuth for `path`. Clears that intent. */
export function consumeOAuthIntent(path: string): boolean {
  if (typeof window === 'undefined') return false;
  const value = sessionStorage.getItem(OAUTH_INTENT_KEY);
  if (value !== path) return false;
  sessionStorage.removeItem(OAUTH_INTENT_KEY);
  return true;
}

export function listenerMayRevokeSharedSession(intentMatches: boolean, tabVisible: boolean): boolean {
  return intentMatches && tabVisible;
}
