-- Candidate process fields: only staff may change them (P0 hardening, part 1). Applied to production.
-- Protected: status, official_process_status, travel_status, flight_date, active_request_id.
-- App users (anon/authenticated) who are not staff get candidate_process_fields_staff_only on UPDATE.
-- On INSERT by a non-staff app user the five fields are forced to their defaults.
-- Unchanged values and non-app callers (SQL editor, service role) are accepted.
-- Superseded (function body) by 20261115140000_candidate_status_auto.sql.
-- Rollback: supabase/rollback/20261115140000_candidate_status_auto_rollback.sql (restores this version).
begin;

do $$
begin
  if to_regprocedure('public.is_staff()') is null then
    raise exception 'is_staff() missing. Nothing was changed.';
  end if;
end $$;

create or replace function public.guard_candidate_process_fields()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_app_user boolean := coalesce(current_setting('role', true), '') in ('anon', 'authenticated');
begin
  if not v_app_user then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not (coalesce(auth.uid() is not null, false) and public.is_staff()) then
      new.status := 'pending';
      new.official_process_status := null;
      new.travel_status := 'planned';
      new.flight_date := null;
      new.active_request_id := null;
    end if;
    return new;
  end if;

  if new.status is not distinct from old.status
     and new.official_process_status is not distinct from old.official_process_status
     and new.travel_status is not distinct from old.travel_status
     and new.flight_date is not distinct from old.flight_date
     and new.active_request_id is not distinct from old.active_request_id then
    return new;
  end if;
  if public.is_staff() then
    return new;
  end if;
  raise exception 'candidate_process_fields_staff_only' using errcode = '42501';
end;
$$;

revoke all on function public.guard_candidate_process_fields() from public, anon;
grant execute on function public.guard_candidate_process_fields() to authenticated;

drop trigger if exists job_candidates_guard_process_fields on public.job_candidates;
create trigger job_candidates_guard_process_fields
  before insert or update of status, official_process_status, travel_status, flight_date, active_request_id
  on public.job_candidates
  for each row
  execute function public.guard_candidate_process_fields();

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'job_candidates_guard_process_fields' and not tgisinternal) then
    raise exception 'trigger not created. Rolled back.';
  end if;
end $$;

notify pgrst, 'reload schema';
commit;
