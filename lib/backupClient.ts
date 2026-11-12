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
      'Missing repository secret SUPABASE_DB_URL. In GitHub: Settings → Secrets and variables → Actions → New repository secret. Name: SUPABASE_DB_URL. Value: the Supabase Postgres URI from Project Settings → Database → Connection string → URI (direct connection, port 5432, user postgres). Do not use the anon key or the service role key.',
    );
  }
  if (!/^postgres(ql)?:\/\//i.test(value)) {
    throw new Error('SUPABASE_DB_URL must be a postgres:// or postgresql:// URI.');
  }
  return value;
}
