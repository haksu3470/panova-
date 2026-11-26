-- Rollback of 20261126170000_process_metrics_breakdown.sql
-- Restores staff_process_metrics as in 20261126120000 (its own formulas) and drops the per-group function.
-- Revert the app code first: it calls staff_process_metrics_by.
begin;

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

drop function if exists public.staff_process_metrics_by(text, boolean);

commit;
