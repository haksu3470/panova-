/**
 * "Beni hatırla": işaretliyse oturum tarayıcı kapansa da kalır (varsayılan).
 * İşaret kaldırılırsa oturum yalnızca o sekme/tarayıcı açıkken geçerlidir:
 * sessionStorage'daki işaret tarayıcı kapanınca silinir, sonraki açılışta
 * Supabase oturum anahtarları istemci oluşmadan temizlenir.
 */
const PREF_KEY = 'panova_remember';
const ALIVE_KEY = 'panova_session_alive';

export function getRemember(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) !== '0';
  } catch {
    return true;
  }
}

export function setRemember(on: boolean): void {
  try {
    localStorage.setItem(PREF_KEY, on ? '1' : '0');
    sessionStorage.setItem(ALIVE_KEY, '1');
  } catch {
    /* depolama kapalıysa varsayılan: hatırla */
  }
}

export function dropSessionIfNotRemembered(): void {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(PREF_KEY) !== '0') return;
    if (sessionStorage.getItem(ALIVE_KEY) === '1') return;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sb-') && k.includes('-auth-token')) localStorage.removeItem(k);
    }
  } catch {
    /* yok say */
  }
}
