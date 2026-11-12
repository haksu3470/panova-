-- Rollback for supabase/migrations/20261114120000_request_status_auto.sql
--
-- NOT a migration. Run by hand in the SQL Editor, and only when needed.
-- ORDER: if part B (20261114130000_request_status_manual_guard.sql) is
-- applied, roll it back FIRST (its RPC and guard call request_status_facts).
--
-- Removes the triggers and functions of part A. Request statuses already
-- advanced, and their audit rows, are kept: nothing is moved back.

begin;

do $$
begin
  if to_regprocedure('public.staff_set_request_status(uuid, text, text)') is not null then
    raise exception 'Part B is still applied. Run 20261114130000_request_status_manual_guard_rollback.sql first.';
  end if;
end $$;

drop trigger if exists request_matches_advance_status on public.request_matches;
drop trigger if exists interviews_advance_status on public.interviews;
drop trigger if exists job_candidates_advance_status on public.job_candidates;

drop function if exists public.request_status_on_match();
drop function if exists public.request_status_on_interview();
drop function if exists public.request_status_on_candidate();
drop function if exists public.request_status_try_advance(uuid, text);
drop function if exists public.advance_request_status(uuid);
drop function if exists public.request_status_facts(uuid);

notify pgrst, 'reload schema';

commit;
