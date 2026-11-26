-- Process metrics for the staff overview: time from work permit application
-- to visa approval, visa approval rate, and 3/6/12-month retention.
--
-- A. public.candidate_process_history: one row per change of
--    job_candidates.official_process_status (from, to, when, who), written by
--    a trigger. Staff may read it; nobody writes it from the app.
--    shortcut: no backfill, the history starts when this migration runs;
--    metrics only count candidates whose steps were recorded after that.
-- B. job_candidates.employment_ended_on + employment_end_reason
--    (resigned / absconded / employer_terminated / contract_completed / other):
--    both null or both set. Staff only (same rule as the other process fields).
-- C. public.staff_process_metrics(p_include_demo): rows (metric, value, sample).
--    Zero rows when the caller is not staff.
--    A visa rejection = a change from visa_applied to rejected with no later
--    visa_approved, so no new status value is needed.
--
-- One transaction, idempotent. Requires public.is_staff().
-- Rollback: supabase/rollback/20261126120000_process_metrics_rollback.sql
-- Scenario: supabase/verification/process_metrics_scenario.sql

begin;

do $$
begin
  if to_regprocedure('public.is_staff()') is null then
    raise exception 'is_staff() missing. Nothing was changed.';
  end if;
end $$;

-- A. History ------------------------------------------------------------------

create table if not exists public.candidate_process_history (
  id bigint generated always as identity primary key,
  candidate_id uuid not null references public.job_candidates(id) on delete cascade,
  from_status text,
  to_status text,
  changed_at timestamptz not null default now(),
  changed_by uuid default auth.uid()
);
create index if not exists candidate_process_history_candidate_idx
  on public.candidate_process_history (candidate_id, changed_at);

alter table public.candidate_process_history enable row level security;
revoke all on public.candidate_process_history from anon, authenticated;
grant select on public.candidate_process_history to authenticated;
drop policy if exists candidate_process_history_staff_select on public.candidate_process_history;
create policy candidate_process_history_staff_select on public.candidate_process_history
  for select to authenticated using (public.is_staff());

create or replace function public.record_candidate_process_change()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.official_process_status is not null then
      insert into public.candidate_process_history (candidate_id, from_status, to_status)
      values (new.id, null, new.official_process_status);
    end if;
  elsif new.official_process_status is distinct from old.official_process_status then
    insert into public.candidate_process_history (candidate_id, from_status, to_status)
    values (new.id, old.official_process_status, new.official_process_status);
  end if;
  return null;
end;
$$;
revoke all on function public.record_candidate_process_change() from public, anon;
grant execute on function public.record_candidate_process_change() to authenticated;

drop trigger if exists job_candidates_record_process_change on public.job_candidates;
create trigger job_candidates_record_process_change
  after insert or update of official_process_status on public.job_candidates
  for each row execute function public.record_candidate_process_change();

-- B. Employment end -----------------------------------------------------------

alter table public.job_candidates add column if not exists employment_ended_on date;
alter table public.job_candidates add column if not exists employment_end_reason text;
alter table public.job_candidates drop constraint if exists job_candidates_employment_end_check;
alter table public.job_candidates add constraint job_candidates_employment_end_check check (
  (employment_ended_on is null and employment_end_reason is null)
  or (employment_ended_on is not null and employment_end_reason in
      ('resigned', 'absconded', 'employer_terminated', 'contract_completed', 'other'))
);

create or replace function public.guard_candidate_employment_end()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if coalesce(current_setting('role', true), '') not in ('anon', 'authenticated') then
    return new;
  end if;
  if public.is_staff() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.employment_ended_on := null;
    new.employment_end_reason := null;
    return new;
  end if;
  if new.employment_ended_on is distinct from old.employment_ended_on
     or new.employment_end_reason is distinct from old.employment_end_reason then
    raise exception 'candidate_process_fields_staff_only' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_candidate_employment_end() from public, anon;
grant execute on function public.guard_candidate_employment_end() to authenticated;

drop trigger if exists job_candidates_guard_employment_end on public.job_candidates;
create trigger job_candidates_guard_employment_end
  before insert or update of employment_ended_on, employment_end_reason on public.job_candidates
  for each row execute function public.guard_candidate_employment_end();

-- C. Metrics ------------------------------------------------------------------

create or replace function public.staff_process_metrics(p_include_demo boolean default false)
returns table (metric text, value numeric, sample integer)
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  if not public.is_staff() then
    return;
  end if;
  return query
  with h as (
    select ph.candidate_id, ph.from_status, ph.to_status, ph.changed_at
    from public.candidate_process_history ph
    join public.job_candidates c on c.id = ph.candidate_id
    where p_include_demo or not coalesce(c.is_demo, false)
  ),
  first_at as (
    select candidate_id, to_status, min(changed_at) as t from h group by 1, 2
  ),
  permit as (select candidate_id, t from first_at where to_status = 'work_permit_applied'),
  visa_ok as (select candidate_id, t from first_at where to_status = 'visa_approved'),
  visa_applied as (select candidate_id from first_at where to_status = 'visa_applied'),
  visa_rejected as (
    select distinct candidate_id from h where from_status = 'visa_applied' and to_status = 'rejected'
    except select candidate_id from visa_ok
  ),
  days as (
    select extract(epoch from v.t - p.t) / 86400.0 as d
    from permit p join visa_ok v using (candidate_id)
    where v.t >= p.t
  ),
  started as (
    select f.candidate_id, f.t, c.employment_ended_on as ended
    from first_at f join public.job_candidates c on c.id = f.candidate_id
    where f.to_status = 'started_work'
  ),
  months(n) as (values (3), (6), (12))
  select 'days_permit_to_visa_median'::text,
         round((percentile_cont(0.5) within group (order by d))::numeric, 1),
         count(*)::integer
  from days
  union all
  select 'visa_approval_rate'::text,
         case when count(*) = 0 then null
              else round(100.0 * count(*) filter (where o.ok) / count(*), 1) end,
         count(*)::integer
  from (
    select a.candidate_id, true as ok from visa_applied a join visa_ok v using (candidate_id)
    union all
    select r.candidate_id, false from visa_rejected r
  ) o
  union all
  select 'retention_' || m.n || 'm',
         case when count(s.candidate_id) = 0 then null
              else round(100.0 * count(s.candidate_id) filter (
                     where s.ended is null or s.ended > (s.t + make_interval(months => m.n))::date
                   ) / count(s.candidate_id), 1) end,
         count(s.candidate_id)::integer
  from months m
  left join started s on s.t + make_interval(months => m.n) <= now()
  group by m.n;
end;
$$;
revoke all on function public.staff_process_metrics(boolean) from public, anon;
grant execute on function public.staff_process_metrics(boolean) to authenticated;

commit;
