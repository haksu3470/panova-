-- Candidate status derived from the official process; manual override only by upper management.
-- Applied to production together with the staff UI (PR feat/candidate-status-auto).
-- After this file, a direct `update job_candidates set status = ...` from the app is refused
-- (candidate_status_use_rpc). Unchanged values (the staff Save button) still pass.
--
-- Mapping (official_process_status -> status):
--   null / not_started                                   -> pending
--   documents_collecting, work_permit_applied/approved   -> reviewing
--   visa_applied   -> visa_processing if an accepted offer exists, else reviewing
--   visa_approved, ready_to_travel, started_work         -> approved
--   rejected / unknown                                   -> status unchanged
-- Requires 20261115133000_candidate_process_fields_guard.sql.
-- Old statuses are saved in public.candidate_status_backup (backfill).
-- Rollback: supabase/rollback/20261115140000_candidate_status_auto_rollback.sql
begin;

do $$
declare v_missing text;
begin
  select string_agg(format('%s.%s', x.tbl, x.col), ', ') into v_missing
  from (values
    ('job_candidates','id'),('job_candidates','status'),('job_candidates','official_process_status'),
    ('job_offers','candidate_id'),('job_offers','status'),
    ('audit_logs','actor_user_id'),('audit_logs','actor_name'),('audit_logs','action'),
    ('audit_logs','entity_type'),('audit_logs','entity_id'),('audit_logs','details'),('audit_logs','is_demo')
  ) as x(tbl, col)
  where not exists (select 1 from information_schema.columns c
    where c.table_schema='public' and c.table_name=x.tbl and c.column_name=x.col);
  if v_missing is not null then
    raise exception 'candidate_status_auto: missing column(s): %. Nothing was changed.', v_missing;
  end if;
  if to_regprocedure('public.is_staff()') is null or to_regprocedure('public.is_portal_manager()') is null
     or to_regprocedure('public.current_staff()') is null then
    raise exception 'is_staff / is_portal_manager / current_staff missing';
  end if;
  if not exists (select 1 from pg_trigger where tgname='job_candidates_guard_process_fields' and not tgisinternal) then
    raise exception 'Part 1 missing: job_candidates_guard_process_fields trigger';
  end if;
end $$;

create table if not exists public.candidate_status_backup (
  candidate_id uuid primary key,
  old_status text,
  old_process text,
  new_status text,
  backed_up_at timestamptz not null default now()
);
alter table public.candidate_status_backup enable row level security;
revoke all on public.candidate_status_backup from anon, authenticated;

create or replace function public.candidate_status_for(p_process text, p_candidate uuid, p_current text)
returns text
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  return case coalesce(p_process, 'not_started')
    when 'not_started' then 'pending'
    when 'documents_collecting' then 'reviewing'
    when 'work_permit_applied' then 'reviewing'
    when 'work_permit_approved' then 'reviewing'
    when 'visa_applied' then case when exists (
        select 1 from public.job_offers o where o.candidate_id = p_candidate and o.status = 'accepted')
      then 'visa_processing' else 'reviewing' end
    when 'visa_approved' then 'approved'
    when 'ready_to_travel' then 'approved'
    when 'started_work' then 'approved'
    else p_current
  end;
end;
$$;
revoke all on function public.candidate_status_for(text, uuid, text) from public, anon, authenticated;

create or replace function public.guard_candidate_process_fields()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_role text := coalesce(current_setting('role', true), '');
  v_app_user boolean := v_role in ('anon', 'authenticated');
  v_mode text := coalesce(current_setting('panova.candidate_status_mode', true), '');
  v_proc boolean;
  v_status boolean;
  v_other boolean;
begin
  if tg_op = 'INSERT' then
    if v_app_user and not (auth.uid() is not null and public.is_staff()) then
      new.status := 'pending';
      new.official_process_status := null;
      new.travel_status := 'planned';
      new.flight_date := null;
      new.active_request_id := null;
    end if;
    return new;
  end if;

  v_proc := new.official_process_status is distinct from old.official_process_status;
  v_status := new.status is distinct from old.status;
  v_other := new.travel_status is distinct from old.travel_status
          or new.flight_date is distinct from old.flight_date
          or new.active_request_id is distinct from old.active_request_id;

  if v_app_user and (v_proc or v_status or v_other) and not public.is_staff() then
    raise exception 'candidate_process_fields_staff_only' using errcode = '42501';
  end if;

  if v_proc and v_mode <> 'manual' then
    new.status := public.candidate_status_for(new.official_process_status, new.id, old.status);
  elsif v_status and v_app_user and v_mode <> 'manual' then
    raise exception 'candidate_status_use_rpc' using errcode = '42501';
  end if;
  return new;
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

create or replace function public.staff_set_candidate_status(p_candidate_id uuid, p_status text, p_reason text)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_to text := btrim(coalesce(p_status, ''));
  v_reason text := btrim(coalesce(p_reason, ''));
  v_from text;
  v_proc text;
  v_demo boolean;
  v_derived text;
  v_role text;
  v_staff_id uuid;
  v_staff_name text;
begin
  if not public.is_portal_manager() then
    raise exception 'staff_role_not_allowed' using errcode = '42501';
  end if;
  if v_to not in ('pending', 'reviewing', 'visa_processing', 'approved') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;
  if char_length(v_reason) < 5 then
    raise exception 'status_reason_required' using errcode = '22023';
  end if;
  if char_length(v_reason) > 1000 then
    raise exception 'status_reason_too_long' using errcode = '22023';
  end if;

  select lower(me.role_level), me.staff_id, me.staff_name
    into v_role, v_staff_id, v_staff_name
  from public.current_staff() me limit 1;

  select c.status, c.official_process_status, coalesce((to_jsonb(c) ->> 'is_demo')::boolean, false)
    into v_from, v_proc, v_demo
  from public.job_candidates c where c.id = p_candidate_id for update;
  if not found then
    raise exception 'candidate_not_found' using errcode = '42501';
  end if;
  if v_from is not distinct from v_to then
    return v_to;
  end if;
  v_derived := public.candidate_status_for(v_proc, p_candidate_id, v_from);

  perform set_config('panova.candidate_status_mode', 'manual', true);
  update public.job_candidates set status = v_to where id = p_candidate_id;
  perform set_config('panova.candidate_status_mode', '', true);

  insert into public.audit_logs (actor_user_id, actor_name, action, entity_type, entity_id, details, is_demo)
  values (
    (select auth.uid()), v_staff_name,
    'Üst Yönetim aday durumunu el ile değiştirdi: ' || coalesce(v_from, '-') || ' -> ' || v_to,
    'job_candidate', p_candidate_id,
    jsonb_build_object('mode', 'manual', 'manual_override', true, 'from', v_from, 'to', v_to,
      'reason', v_reason, 'staff_id', v_staff_id, 'staff_name', v_staff_name, 'staff_role', v_role,
      'official_process_status', v_proc, 'derived_status', v_derived),
    v_demo);
  return v_to;
end;
$$;
revoke all on function public.staff_set_candidate_status(uuid, text, text) from public, anon;
grant execute on function public.staff_set_candidate_status(uuid, text, text) to authenticated;

with todo as (
  select c.id, c.status as old_status, c.official_process_status as old_process,
         public.candidate_status_for(c.official_process_status, c.id, c.status) as new_status
  from public.job_candidates c
), changed as (
  select * from todo where new_status is distinct from old_status
), saved as (
  insert into public.candidate_status_backup (candidate_id, old_status, old_process, new_status)
  select id, old_status, old_process, new_status from changed
  on conflict (candidate_id) do nothing
  returning 1
)
update public.job_candidates c
set status = ch.new_status
from changed ch
where c.id = ch.id;

do $$
declare v_left bigint;
begin
  select count(*) into v_left from public.job_candidates c
  where public.candidate_status_for(c.official_process_status, c.id, c.status) is distinct from c.status;
  if v_left <> 0 then
    raise exception 'candidate_status_auto: % candidate(s) still out of line. Rolled back.', v_left;
  end if;
end $$;

notify pgrst, 'reload schema';
commit;
