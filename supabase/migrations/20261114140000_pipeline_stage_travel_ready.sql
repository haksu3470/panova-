-- Pipeline stage of a selected candidate: one definition for the employer
-- cards and for the automatic request status. Part C.
--
-- Problem: job_candidates.travel_status defaults to 'planned' (and the staff
-- candidate file writes 'planned' when it is empty). The old definitions
-- counted 'planned' as "travel ready" and left every 'planned' candidate out
-- of "in process", so a freshly selected candidate looked travel-ready and a
-- request could jump to travel_planning without any process record.
--
-- New rule, public.candidate_pipeline_stage(official, travel):
--   'started'       official = started_work  or travel = completed
--   'travel_ready'  official = ready_to_travel or travel = ticketed
--   'in_process'    official in documents_collecting .. visa_approved
--   null            anything else, including NULL values and travel 'planned'
-- First match wins, so the three counts never overlap.
--
-- request_pipeline_counts_for_me() (20261113120000) and
-- request_status_facts(uuid) (20261114120000, part A) are replaced with the
-- same signature and result columns; only their process counts change.
-- The view request_pipeline_counts is untouched (it selects from the
-- function). No table or row changes.
--
-- Grants: request_pipeline_counts_for_me stays executable by authenticated;
-- request_status_facts and candidate_pipeline_stage stay closed to users
-- (only called inside SECURITY DEFINER functions, as their owner).
--
-- One transaction, idempotent. Requires part A.
-- Rollback: supabase/rollback/20261114140000_pipeline_stage_travel_ready_rollback.sql
-- Checks:   supabase/verification/request_status_auto.sql (section 3)

begin;

-- 0. Preconditions.
do $$
declare
  v_missing text;
begin
  select string_agg(format('%s.%s', x.tbl, x.col), ', ' order by x.tbl, x.col) into v_missing
  from (values
    ('job_requests', 'id'), ('job_requests', 'employer_id'), ('job_requests', 'headcount'),
    ('job_candidates', 'id'), ('job_candidates', 'official_process_status'),
    ('job_candidates', 'travel_status'), ('job_candidates', 'active_request_id'),
    ('request_matches', 'request_id'), ('request_matches', 'candidate_id'),
    ('request_matches', 'presented_at'), ('request_matches', 'employer_decision'),
    ('interviews', 'request_id'), ('interviews', 'candidate_id'),
    ('job_offers', 'request_id'), ('job_offers', 'candidate_id'), ('job_offers', 'status')
  ) as x(tbl, col)
  where not exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = x.tbl and c.column_name = x.col
  );
  if v_missing is not null then
    raise exception 'pipeline_stage_travel_ready: missing table/column(s): %. Nothing was changed.', v_missing;
  end if;

  if to_regprocedure('public.request_pipeline_counts_for_me()') is null then
    raise exception 'request_pipeline_counts_for_me() missing: apply 20261113120000_request_pipeline_counts.sql first';
  end if;
  if to_regprocedure('public.request_status_facts(uuid)') is null then
    raise exception 'request_status_facts(uuid) missing: apply 20261114120000_request_status_auto.sql first';
  end if;
  if to_regprocedure('public.my_employer_id()') is null
     or to_regprocedure('public.is_staff()') is null
     or to_regprocedure('public.staff_can_read_request(uuid)') is null then
    raise exception 'my_employer_id / is_staff / staff_can_read_request missing';
  end if;
end $$;

-- 1. The stage of one candidate (internal) -----------------------------------

create or replace function public.candidate_pipeline_stage(p_official text, p_travel text)
returns text
language sql
immutable
set search_path to ''
as $$
  select case
    when p_official = 'started_work' or p_travel = 'completed' then 'started'
    when p_official = 'ready_to_travel' or p_travel = 'ticketed' then 'travel_ready'
    when p_official in ('documents_collecting', 'work_permit_applied', 'work_permit_approved',
                        'visa_applied', 'visa_approved') then 'in_process'
    else null
  end;
$$;

revoke all on function public.candidate_pipeline_stage(text, text) from public, anon, authenticated;

-- 2. Employer / staff card counts (same signature as 20261113120000) ---------

create or replace function public.request_pipeline_counts_for_me()
returns table (
  request_id uuid,
  employer_id uuid,
  headcount integer,
  matched integer,
  presented integer,
  selected integer,
  interviews integer,
  offers integer,
  offers_accepted integer,
  in_process integer,
  travel_ready integer,
  started integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select public.my_employer_id() as employer_id,
           public.is_staff() as is_staff
  ),
  visible as (
    select r.id, r.employer_id, r.headcount,
           (me.is_staff and public.staff_can_read_request(r.id)) as staff_view
    from public.job_requests r
    cross join me
    where (me.employer_id is not null and r.employer_id = me.employer_id)
       or (me.is_staff and public.staff_can_read_request(r.id))
  ),
  m as (
    select mm.request_id,
           count(*)::int as matched,
           count(*) filter (where mm.presented_at is not null)::int as presented,
           count(*) filter (where mm.employer_decision = 'selected')::int as selected
    from public.request_matches mm
    where mm.request_id in (select id from visible)
    group by mm.request_id
  ),
  i as (
    select ii.request_id, count(distinct ii.candidate_id)::int as interviews
    from public.interviews ii
    where ii.request_id in (select id from visible)
    group by ii.request_id
  ),
  o as (
    select oo.request_id,
           count(distinct oo.candidate_id)::int as offers,
           count(distinct oo.candidate_id) filter (where oo.status = 'accepted')::int as offers_accepted
    from public.job_offers oo
    where oo.request_id in (select id from visible)
    group by oo.request_id
  ),
  -- Process counts: selected candidates of this request, one stage each
  -- (candidate_pipeline_stage). A candidate whose active_request_id points at
  -- another request is not counted here.
  p as (
    select sm.request_id,
           count(*) filter (where public.candidate_pipeline_stage(c.official_process_status, c.travel_status) = 'in_process')::int as in_process,
           count(*) filter (where public.candidate_pipeline_stage(c.official_process_status, c.travel_status) = 'travel_ready')::int as travel_ready,
           count(*) filter (where public.candidate_pipeline_stage(c.official_process_status, c.travel_status) = 'started')::int as started
    from public.request_matches sm
    join public.job_candidates c on c.id = sm.candidate_id
    where sm.request_id in (select id from visible)
      and sm.employer_decision = 'selected'
      and (c.active_request_id is null or c.active_request_id = sm.request_id)
    group by sm.request_id
  )
  select v.id,
         v.employer_id,
         coalesce(v.headcount, 0)::int,
         case when v.staff_view then coalesce(m.matched, 0) end,
         coalesce(m.presented, 0),
         coalesce(m.selected, 0),
         coalesce(i.interviews, 0),
         coalesce(o.offers, 0),
         coalesce(o.offers_accepted, 0),
         coalesce(p.in_process, 0),
         coalesce(p.travel_ready, 0),
         coalesce(p.started, 0)
  from visible v
  left join m on m.request_id = v.id
  left join i on i.request_id = v.id
  left join o on o.request_id = v.id
  left join p on p.request_id = v.id;
$$;

revoke all on function public.request_pipeline_counts_for_me() from public, anon;
grant execute on function public.request_pipeline_counts_for_me() to authenticated;

-- 3. Facts for the automatic status (same signature as part A) --------------

create or replace function public.request_status_facts(p_request_id uuid)
returns table (
  headcount integer,
  matched integer,
  presented integer,
  interviews integer,
  selected integer,
  in_process integer,
  travel_ready integer,
  started integer
)
language sql
stable
security definer
set search_path to ''
as $$
  select
    coalesce(r.headcount, 0)::int,
    (select count(*)::int from public.request_matches m where m.request_id = r.id),
    (select count(*)::int from public.request_matches m
      where m.request_id = r.id and m.presented_at is not null),
    (select count(distinct i.candidate_id)::int from public.interviews i where i.request_id = r.id),
    (select count(*)::int from public.request_matches m
      where m.request_id = r.id and m.employer_decision = 'selected'),
    coalesce(p.in_process, 0),
    coalesce(p.travel_ready, 0),
    coalesce(p.started, 0)
  from public.job_requests r
  left join lateral (
    select
      count(*) filter (where public.candidate_pipeline_stage(c.official_process_status, c.travel_status) = 'in_process')::int as in_process,
      count(*) filter (where public.candidate_pipeline_stage(c.official_process_status, c.travel_status) = 'travel_ready')::int as travel_ready,
      count(*) filter (where public.candidate_pipeline_stage(c.official_process_status, c.travel_status) = 'started')::int as started
    from public.request_matches sm
    join public.job_candidates c on c.id = sm.candidate_id
    where sm.request_id = r.id
      and sm.employer_decision = 'selected'
      and (c.active_request_id is null or c.active_request_id = sm.request_id)
  ) p on true
  where r.id = p_request_id;
$$;

revoke all on function public.request_status_facts(uuid) from public, anon, authenticated;

notify pgrst, 'reload schema';

commit;
