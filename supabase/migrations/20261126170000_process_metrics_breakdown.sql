-- Process metrics per country and per employer.
--
-- public.staff_process_metrics_by(p_by, p_include_demo): rows
--   (group_key, group_label, metric, value, sample), p_by in 'all' | 'country' | 'employer'.
-- A candidate belongs to the employer and request of their latest accepted
-- offer, else to job_candidates.active_employer_id / active_request_id.
-- Country = that request's country, else the employer's country
-- (grouped by public.country_key). Without one: group_key '' (unknown).
-- Only groups with at least one recorded stage change are returned; 'all'
-- always returns its one group.
-- public.staff_process_metrics(p_include_demo) now reads the 'all' group, so
-- the formulas live in one place (same results as 20261126120000).
-- Zero rows when the caller is not staff.
--
-- One transaction, idempotent. Requires 20261126120000.
-- Rollback: supabase/rollback/20261126170000_process_metrics_breakdown_rollback.sql
-- Scenario: supabase/verification/process_metrics_scenario.sql (still passes)

begin;

do $$
begin
  if to_regclass('public.candidate_process_history') is null or to_regprocedure('public.country_key(text)') is null then
    raise exception 'candidate_process_history or country_key(text) missing. Nothing was changed.';
  end if;
end $$;

create or replace function public.staff_process_metrics_by(p_by text, p_include_demo boolean default false)
returns table (group_key text, group_label text, metric text, value numeric, sample integer)
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  if not public.is_staff() then
    return;
  end if;
  if p_by is null or p_by not in ('all', 'country', 'employer') then
    raise exception 'metrics_group_invalid' using errcode = '22023';
  end if;
  return query
  with cands as (
    select
      c.id as candidate_id,
      c.employment_ended_on as ended,
      case p_by
        when 'all' then ''
        when 'country' then coalesce(public.country_key(coalesce(nullif(btrim(r.country), ''), nullif(btrim(e.country), ''))), '')
        else coalesce(e.id::text, nullif(lower(btrim(ao.employer_name)), ''), '')
      end as gkey,
      case p_by
        when 'all' then ''
        when 'country' then coalesce(nullif(btrim(r.country), ''), nullif(btrim(e.country), ''), '')
        else coalesce(e.company_name, nullif(btrim(ao.employer_name), ''), '')
      end as glabel
    from public.job_candidates c
    left join lateral (
      select o.employer_id, o.employer_name, o.request_id
      from public.job_offers o
      where o.candidate_id = c.id and o.status = 'accepted'
      order by o.responded_at desc nulls last, o.created_at desc
      limit 1
    ) ao on true
    left join public.employers e on e.id = coalesce(ao.employer_id, c.active_employer_id)
    left join public.job_requests r on r.id = coalesce(ao.request_id, c.active_request_id)
    where p_include_demo or not coalesce(c.is_demo, false)
  ),
  h as (
    select ph.candidate_id, ph.from_status, ph.to_status, ph.changed_at, k.gkey
    from public.candidate_process_history ph
    join cands k on k.candidate_id = ph.candidate_id
  ),
  grps as (
    select k.gkey, max(k.glabel) as glabel
    from cands k
    where p_by = 'all' or k.candidate_id in (select candidate_id from h)
    group by k.gkey
    union
    select '', '' where p_by = 'all'
  ),
  first_at as (
    select candidate_id, gkey, to_status, min(changed_at) as t from h group by 1, 2, 3
  ),
  permit as (select candidate_id, gkey, t from first_at where to_status = 'work_permit_applied'),
  visa_ok as (select candidate_id, gkey, t from first_at where to_status = 'visa_approved'),
  visa_applied as (select candidate_id, gkey from first_at where to_status = 'visa_applied'),
  visa_rejected as (
    select distinct candidate_id, gkey from h where from_status = 'visa_applied' and to_status = 'rejected'
    except select candidate_id, gkey from visa_ok
  ),
  days_g as (
    select p.gkey, round((percentile_cont(0.5) within group (order by extract(epoch from v.t - p.t) / 86400.0))::numeric, 1) as v, count(*)::integer as n
    from permit p join visa_ok v on v.candidate_id = p.candidate_id
    where v.t >= p.t
    group by p.gkey
  ),
  outcomes as (
    select a.candidate_id, a.gkey, true as ok from visa_applied a join visa_ok v on v.candidate_id = a.candidate_id
    union all
    select r.candidate_id, r.gkey, false from visa_rejected r
  ),
  rate_g as (
    select o.gkey, round(100.0 * count(*) filter (where o.ok) / count(*), 1) as v, count(*)::integer as n
    from outcomes o group by o.gkey
  ),
  started as (
    select f.candidate_id, f.gkey, f.t, k.ended
    from first_at f join cands k on k.candidate_id = f.candidate_id
    where f.to_status = 'started_work'
  ),
  months(mn) as (values (3), (6), (12)),
  ret_g as (
    select s.gkey, m.mn,
      round(100.0 * count(*) filter (where s.ended is null or s.ended > (s.t + make_interval(months => m.mn))::date) / count(*), 1) as v,
      count(*)::integer as n
    from months m join started s on s.t + make_interval(months => m.mn) <= now()
    group by s.gkey, m.mn
  )
  select g.gkey, g.glabel, 'days_permit_to_visa_median'::text, d.v, coalesce(d.n, 0)
  from grps g left join days_g d on d.gkey = g.gkey
  union all
  select g.gkey, g.glabel, 'visa_approval_rate'::text, rg.v, coalesce(rg.n, 0)
  from grps g left join rate_g rg on rg.gkey = g.gkey
  union all
  select g.gkey, g.glabel, ('retention_' || m.mn || 'm')::text, rt.v, coalesce(rt.n, 0)
  from grps g cross join months m left join ret_g rt on rt.gkey = g.gkey and rt.mn = m.mn;
end;
$$;

revoke all on function public.staff_process_metrics_by(text, boolean) from public, anon;
grant execute on function public.staff_process_metrics_by(text, boolean) to authenticated;

create or replace function public.staff_process_metrics(p_include_demo boolean default false)
returns table (metric text, value numeric, sample integer)
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  return query
  select b.metric, b.value, b.sample from public.staff_process_metrics_by('all', p_include_demo) b;
end;
$$;

revoke all on function public.staff_process_metrics(boolean) from public, anon;
grant execute on function public.staff_process_metrics(boolean) to authenticated;

commit;
