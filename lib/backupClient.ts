/**
 * The postgres npm package is ESM. `require("postgres")` returns a module
 * namespace (`{ default: fn }`), so calling it as a function throws
 * "postgres is not a function" and the backup job exits 1.
 */
export function resolvePostgresClient(mod: unknown): (url: string, options?: Record<string, unknown>) => unknown {
  if (typeof mod === 'function') return mod as (url: string, options?: Record<string, unknown>) => unknown;
  if (mod && typeof mod === 'object' && typeof (mod as { default?: unknown }).default === 'function') {
    return (mod as { default: (url: string, options?: Record<string, unknown>) => unknown }).default;
  }
  throw new Error('postgres client export is not a function');
}

export function assertBackupDatabaseUrl(url: string | undefined): string {
  const value = url?.trim() ?? '';
  if (!value) {
    throw new Error(
      'Missing repository secret SUPABASE_DB_URL. In GitHub: Settings → Secrets and variables → Actions → New repository secret. Name: SUPABASE_DB_URL. Value: prefer the Session pooler URI from Supabase Connect (port 5432, user postgres.<project-ref>) — GitHub Actions is IPv4-only and the direct db.*.supabase.co host is IPv6-only. A direct URI still works if SUPABASE_DB_REGION is set so the backup script can rewrite it. Do not use the anon key or the service role key.',
    );
  }
  if (!/^postgres(ql)?:\/\//i.test(value)) {
    throw new Error('SUPABASE_DB_URL must be a postgres:// or postgresql:// URI.');
  }
  return value;
}

const DIRECT_DB_HOST = /^db\.([a-z0-9]+)\.supabase\.co$/i;

/**
 * Rewrites a direct Supabase DB URI (IPv6-only on many networks) to the
 * IPv4-reachable Session pooler. Does not log the URL (may contain secrets).
 */
export function toIpv4CompatibleDatabaseUrl(
  url: string,
  options?: { region?: string },
): string {
  const parsed = new URL(url);
  const host = parsed.hostname;

  if (host.toLowerCase().endsWith('.pooler.supabase.com')) {
    return url;
  }

  const directMatch = host.match(DIRECT_DB_HOST);
  if (!directMatch) {
    return url;
  }

  const projectRef = directMatch[1];
  const region = options?.region?.trim() || process.env.SUPABASE_DB_REGION?.trim() || '';
  if (!region) {
    throw new Error(
      'Direct Supabase host db.*.supabase.co is IPv6-only and unreachable from GitHub Actions (IPv4-only). Set SUPABASE_DB_REGION (e.g. eu-central-1) so the backup can rewrite to the Session pooler, or paste the Session pooler URI from the Supabase Connect dialog as SUPABASE_DB_URL.',
    );
  }

  const username = decodeURIComponent(parsed.username);
  if (username === 'postgres' || username === `postgres.${projectRef}`) {
    parsed.username = `postgres.${projectRef}`;
  }

  parsed.hostname = `aws-0-${region}.pooler.supabase.com`;
  parsed.port = '5432';
  return parsed.toString();
}
