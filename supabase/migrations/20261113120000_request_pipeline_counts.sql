-- Per-request pipeline counts: one source for the employer demand cards and the
-- management request screens (docs/gorev-talep-akisi.md, goal 2).
--
-- request_pipeline_counts_for_me() returns one row per request the caller may
-- read: the employer's own requests, or the requests a staff member reaches
-- through staff_can_read_request(). Everything else returns no row.
--
-- "matched" counts matches that were never presented, so it is staff-only:
-- an employer gets null there. Every other column is identical for both.
--
-- request_pipeline_counts is a security_invoker view over the function, so
-- the view never runs with its owner's rights; the filtering lives in the
-- function.
--
-- Idempotent: create or replace / drop if exists. No table or row changes.
-- Rollback: supabase/rollback/20261113120000_request_pipeline_counts_rollback.sql

begin;

drop view if exists public.request_pipeline_counts;
drop function if exists public.request_pipeline_counts_for_me();

create function public.request_pipeline_counts_for_me()
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
  -- Process counts: selected candidates of this request. A candidate whose
  -- active_request_id points at another request is not counted here, so a
  -- candidate selected on two requests is counted once.
  p as (
    select sm.request_id,
           count(*) filter (
             where coalesce(c.official_process_status, 'not_started') in
                   ('documents_collecting', 'work_permit_applied', 'work_permit_approved',
                    'visa_applied', 'visa_approved')
               and coalesce(c.travel_status, '') not in ('planned', 'ticketed', 'completed')
           )::int as in_process,
           count(*) filter (
             where coalesce(c.official_process_status, '') <> 'started_work'
               and coalesce(c.travel_status, '') <> 'completed'
               and (c.official_process_status = 'ready_to_travel'
                    or c.travel_status in ('planned', 'ticketed'))
           )::int as travel_ready,
           count(*) filter (
             where c.official_process_status = 'started_work'
                or c.travel_status = 'completed'
           )::int as started
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

create view public.request_pipeline_counts
with (security_invoker = true)
as
  select * from public.request_pipeline_counts_for_me();

revoke all on public.request_pipeline_counts from public, anon;
grant select on public.request_pipeline_counts to authenticated;

comment on view public.request_pipeline_counts is
  'Per-request card counts. Same numbers for employer and staff; matched is null for employers.';

notify pgrst, 'reload schema';

commit;
