# Security harden (2026-11-17)

## Applied (DB)

Migration `20261117220000_security_search_path_and_trigger_grants.sql`:

- Fixed `search_path` on 7 helper/trigger functions (advisor `function_search_path_mutable`).
- Revoked `anon` / `authenticated` / `PUBLIC` execute on `handle_new_auth_user()` (advisor `anon_security_definer_function_executable`). Function is a no-op stub with no trigger.

## Manual (Auth dashboard)

Enable **Leaked password protection** (HaveIBeenPwned):

1. Supabase → Project `panova-db` → Authentication → Providers / Password security  
2. Turn on **Leaked password protection**  
   Docs: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

This cannot be set from SQL migrations.

## Intentionally not changed

- `authenticated` EXECUTE on app RPCs (`employer_browse_candidates`, `is_staff`, …) — required by the portal.
- Backup / private tables with RLS and no policies — internal; not exposed via API the same way.
