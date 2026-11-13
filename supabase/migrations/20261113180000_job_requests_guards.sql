-- job_requests guards. Applied to production by hand; this file is the repo record.
-- 1. Eight check rules on the request form fields (same limits as the employer form).
-- 2. assigned_to, assigned_backup and is_demo: only staff may set or change them.
--    App users (anon/authenticated) who are not staff: on INSERT the three are
--    reset (null, null, false); on UPDATE a change raises request_fields_staff_only (42501).
--    Non-app callers (SQL editor, service role) are accepted.
-- 3. Employers may delete their own request only while it has no activity
--    (no request_matches, interviews or job_offers row).
-- Rollback: supabase/rollback/20261113180000_job_requests_guards_rollback.sql
begin;

do $$
declare
  bad_count integer;
begin
  if to_regprocedure('public.is_staff()') is null or to_regprocedure('public.my_employer_id()') is null then
    raise exception 'is_staff() or my_employer_id() missing. Nothing was changed.';
  end if;

  select count(*) into bad_count
  from public.job_requests r
  where r.headcount is null or r.headcount < 1 or r.headcount > 500
     or r.position_title is null or btrim(r.position_title) = ''
     or r.employer_name is null or btrim(r.employer_name) = ''
     or r.sector is null or btrim(r.sector) = ''
     or r.monthly_net_salary is null or r.monthly_net_salary <= 0 or r.monthly_net_salary > 100000
     or (r.required_experience_years is not null and (r.required_experience_years < 0 or r.required_experience_years > 60))
     or (r.city is not null and btrim(r.city) = '')
     or (r.contract_type is not null and btrim(r.contract_type) = '');

  if bad_count > 0 then
    raise exception 'job_requests: % kayit kurallara uymuyor. Hicbir sey degistirilmedi.', bad_count;
  end if;
end $$;

-- 1. Check rules
alter table public.job_requests drop constraint if exists job_requests_headcount_range;
alter table public.job_requests add constraint job_requests_headcount_range
  check (headcount is not null and headcount between 1 and 500);

alter table public.job_requests drop constraint if exists job_requests_position_title_nonblank;
alter table public.job_requests add constraint job_requests_position_title_nonblank
  check (position_title is not null and btrim(position_title) <> '');

alter table public.job_requests drop constraint if exists job_requests_employer_name_nonblank;
alter table public.job_requests add constraint job_requests_employer_name_nonblank
  check (employer_name is not null and btrim(employer_name) <> '');

alter table public.job_requests drop constraint if exists job_requests_sector_nonblank;
alter table public.job_requests add constraint job_requests_sector_nonblank
  check (sector is not null and btrim(sector) <> '');

alter table public.job_requests drop constraint if exists job_requests_salary_range;
alter table public.job_requests add constraint job_requests_salary_range
  check (monthly_net_salary is not null and monthly_net_salary > 0 and monthly_net_salary <= 100000);

alter table public.job_requests drop constraint if exists job_requests_experience_range;
alter table public.job_requests add constraint job_requests_experience_range
  check (required_experience_years is null or required_experience_years between 0 and 60);

alter table public.job_requests drop constraint if exists job_requests_city_nonblank;
alter table public.job_requests add constraint job_requests_city_nonblank
  check (city is null or btrim(city) <> '');

alter table public.job_requests drop constraint if exists job_requests_contract_type_nonblank;
alter table public.job_requests add constraint job_requests_contract_type_nonblank
  check (contract_type is null or btrim(contract_type) <> '');

-- 2. Staff-only fields
create or replace function public.guard_request_staff_fields()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_app_user boolean := coalesce(current_setting('role', true), '') in ('anon', 'authenticated');
  v_staff boolean;
begin
  if not v_app_user then
    return new;
  end if;
  v_staff := coalesce(auth.uid() is not null, false) and public.is_staff();

  if tg_op = 'INSERT' then
    if not v_staff then
      new.assigned_to := null;
      new.assigned_backup := null;
      new.is_demo := false;
    end if;
    return new;
  end if;

  if new.assigned_to is not distinct from old.assigned_to
     and new.assigned_backup is not distinct from old.assigned_backup
     and new.is_demo is not distinct from old.is_demo then
    return new;
  end if;
  if v_staff then
    return new;
  end if;
  raise exception 'request_fields_staff_only' using errcode = '42501';
end;
$$;

revoke all on function public.guard_request_staff_fields() from public, anon;
grant execute on function public.guard_request_staff_fields() to authenticated;

drop trigger if exists job_requests_guard_staff_fields on public.job_requests;
create trigger job_requests_guard_staff_fields
  before insert or update of assigned_to, assigned_backup, is_demo
  on public.job_requests
  for each row
  execute function public.guard_request_staff_fields();

-- 3. Employer delete only without activity
create or replace function public.request_has_activity(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists (select 1 from public.request_matches m where m.request_id = p_request_id)
      or exists (select 1 from public.interviews i where i.request_id = p_request_id)
      or exists (select 1 from public.job_offers o where o.request_id = p_request_id);
$$;

revoke all on function public.request_has_activity(uuid) from public, anon;
grant execute on function public.request_has_activity(uuid) to authenticated;

drop policy if exists emp_requests_delete on public.job_requests;
create policy emp_requests_delete on public.job_requests
  for delete to authenticated
  using (employer_id = public.my_employer_id() and not public.request_has_activity(id));

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'job_requests_guard_staff_fields' and not tgisinternal) then
    raise exception 'trigger not created. Rolled back.';
  end if;
end $$;

notify pgrst, 'reload schema';
commit;
