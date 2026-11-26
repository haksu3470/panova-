-- Rollback of 20261126180000_demo_login.sql
-- Revert the app code first (/api/demo-login calls prepare_demo_login).
-- Logins already created for demo candidates stay (auth.users and
-- job_candidates.auth_user_id); remove them in the Supabase dashboard if wanted.
begin;

drop function if exists public.prepare_demo_login(text, uuid);
alter table public.staff_members drop column if exists is_test_account;

commit;
