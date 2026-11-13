import { signOut } from '@/lib/auth';

/**
 * Log out from a staff file page (candidate, request, employer file).
 * Same sign-out as /portal; the portal then shows its sign-in screen.
 */
export async function staffLogoutToPortal(): Promise<void> {
  await signOut();
  window.location.href = '/portal';
}
