-- Rollback for supabase/migrations/20261112120000_employer_match_decision.sql
--
-- NOT a migration. Run by hand in the SQL Editor, and only when needed.
--
-- ORDER: first deploy the previous app code (the new code calls
-- employer_decide_match and would fail), THEN run this file.
--
-- Data: the new columns are kept on purpose. While the guard trigger ran,
-- every "selected" / "rejected" decision was also written to employer_result
-- ('selected' / 'not_suitable'), so the old code still sees every decision.
-- Who decided and why stays in the columns and in audit_logs.
-- Dropping the columns is at the end, commented out.

begin;

-- 1. Remove both decision RPCs and the guard trigger. After this, staff can
--    again set employer_result freely (the old behaviour).
drop function if exists public.employer_decide_match(uuid, text);
drop function if exists public.staff_decide_match(uuid, text, text);
drop trigger if exists request_matches_guard_decision on public.request_matches;
drop function if exists public.guard_match_decision();

-- 2. Restore demand_transition_allowed as in 20261110122000_workflow_guards.sql
--    (counts selected rows from employer_result).
create or replace function public.demand_transition_allowed(p_from text, p_to text, p_request uuid)
returns boolean
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_from text := public.normalize_demand_status(p_from);
  v_to text := public.normalize_demand_status(p_to);
  v_presented int := 0;
  v_interviews int := 0;
  v_selected int := 0;
  v_allowed boolean := false;
begin
  if v_to = '' then return false; end if;
  if v_from = v_to then return true; end if;
  if p_request is not null then
    select count(*) into v_presented from public.request_matches m
      where m.request_id = p_request and m.presented_at is not null;
    select count(*) into v_interviews from public.interviews i
      where i.request_id = p_request;
    select count(*) into v_selected from public.request_matches m
      where m.request_id = p_request and m.employer_result = 'selected';
  end if;

  v_allowed := case v_from
    when 'new_request' then v_to in ('reviewing', 'searching_candidates', 'cancelled')
    when 'reviewing' then v_to in ('new_request', 'searching_candidates', 'cancelled')
    when 'searching_candidates' then v_to in ('reviewing', 'presenting_candidates', 'cancelled')
    when 'presenting_candidates' then v_to in ('searching_candidates', 'interviews', 'selection_completed', 'cancelled')
    when 'interviews' then v_to in ('presenting_candidates', 'selection_completed', 'cancelled')
    when 'selection_completed' then v_to in ('interviews', 'official_process', 'cancelled')
    when 'official_process' then v_to in ('selection_completed', 'travel_planning', 'cancelled')
    when 'travel_planning' then v_to in ('official_process', 'completed', 'cancelled')
    when 'completed' then v_to = 'travel_planning'
    when 'cancelled' then v_to = 'new_request'
    when '' then v_to in ('new_request', 'reviewing', 'searching_candidates', 'cancelled')
    else false
  end;

  if not v_allowed then return false; end if;
  if v_to = 'presenting_candidates' and v_presented < 1 then return false; end if;
  if v_to = 'interviews' and v_interviews < 1 then return false; end if;
  if v_to = 'selection_completed' and v_selected < 1 then return false; end if;
  return true;
end;
$$;

-- 3. Restore employer_browse_candidates as in
--    20261104180000_candidate_youtube_video.sql: one row per candidate again
--    (distinct on), unpresented matches included again, and without the
--    match / decision / request_position_title columns.
drop function if exists public.employer_browse_candidates();

create function public.employer_browse_candidates()
returns table (
  id uuid,
  full_name text,
  profession text,
  sector text,
  nationality text,
  city text,
  experience_years integer,
  language_skills text,
  shift_suitable boolean,
  status text,
  travel_status text,
  created_at timestamptz,
  active_request_id uuid,
  video_url text,
  video_url_1 text,
  video_url_2 text,
  video_url_3 text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    picked.id,
    picked.full_name,
    picked.profession,
    picked.sector,
    picked.nationality,
    picked.city,
    picked.experience_years,
    picked.language_skills,
    picked.shift_suitable,
    picked.status,
    picked.travel_status,
    picked.created_at,
    picked.active_request_id,
    picked.video_url,
    picked.video_url_1,
    picked.video_url_2,
    picked.video_url_3
  from (
    select distinct on (c.id)
      c.id,
      c.full_name,
      c.profession,
      c.sector,
      c.nationality,
      c.city,
      c.experience_years,
      c.language_skills,
      c.shift_suitable,
      c.status,
      c.travel_status,
      c.created_at,
      m.request_id as active_request_id,
      c.video_url,
      c.video_url_1,
      c.video_url_2,
      c.video_url_3
    from public.job_candidates c
    join public.request_matches m on m.candidate_id = c.id
    join public.job_requests r on r.id = m.request_id
    where public.my_employer_id() is not null
      and r.employer_id = public.my_employer_id()
      and c.archived_at is null
    order by c.id, m.presented_at desc nulls last, m.created_at desc
  ) picked
  order by picked.created_at desc nulls last, picked.full_name;
$$;

revoke all on function public.employer_browse_candidates() from public, anon;
grant execute on function public.employer_browse_candidates() to authenticated;

-- 4. Optional, IRREVERSIBLE: removes who-decided / when / why from the rows
--    (audit_logs keeps its copy). Leave commented unless you are sure.
-- drop index if exists public.request_matches_request_decision_idx;
-- alter table public.request_matches
--   drop constraint if exists request_matches_decision_source_check,
--   drop constraint if exists request_matches_employer_decision_check,
--   drop column if exists employer_decision,
--   drop column if exists decided_at,
--   drop column if exists decided_by,
--   drop column if exists decision_source,
--   drop column if exists decision_reason;

notify pgrst, 'reload schema';

commit;
