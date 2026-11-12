-- Rollback for supabase/migrations/20261114130000_request_status_manual_guard.sql
--
-- NOT a migration. Run by hand in the SQL Editor, and only when needed.
-- ORDER: first deploy the previous UI (the staff dropdown that writes
-- job_requests.status directly), THEN run this file. Roll back part B before
-- part A.
--
-- guard_demand_status is restored to its definition from
-- 20261110122000_workflow_guards.sql. If the backup taken before applying
-- (verification section 0) differs from the body below, use the backup.
-- Statuses and audit rows written meanwhile are kept.

begin;

drop function if exists public.staff_set_request_status(uuid, text, text);

create or replace function public.guard_demand_status()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_to text := public.normalize_demand_status(new.status);
begin
  if tg_op = 'UPDATE' and public.normalize_demand_status(old.status) = v_to then
    new.status := v_to;
    return new;
  end if;
  if not public.demand_transition_allowed(case when tg_op = 'UPDATE' then old.status else '' end, v_to, new.id) then
    raise exception 'demand_status_transition' using errcode = '23514';
  end if;
  new.status := v_to;
  return new;
end;
$$;

revoke all on function public.guard_demand_status() from public, anon;
grant execute on function public.guard_demand_status() to authenticated;

drop function if exists public.demand_status_facts_ok(text, uuid);

notify pgrst, 'reload schema';

commit;
