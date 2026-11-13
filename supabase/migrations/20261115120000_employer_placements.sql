-- Employer placements: live data for the employer tabs İşlem Durumu,
-- Seyahat Bilgilerim and Aktif Çalışanlar (F3-5).
--
-- public.employer_placements() returns one row per SELECTED match
-- (request_matches.employer_decision = 'selected') on the signed-in
-- employer's own requests. A match that is pending, rejected, or was
-- selected and then undone is not returned, so the candidate drops out of all
-- three tabs. Candidate rule = the stage counts of the employer cards
-- (in_process / travel_ready / started in request_pipeline_counts_for_me,
-- 20261114140000): active_request_id is null or this request. Archived
-- candidates (job_candidates.archived_at set) are NOT left out, because the
-- cards do not leave them out either. So the row count of a request equals
-- the card's 'selected' count, except for a selected candidate whose
-- active_request_id points at another request: that one is left out here and
-- in the stage counts, but is still counted in 'selected'.
-- The stage comes from public.candidate_pipeline_stage, the one definition
-- the cards and the automatic request status use.
--
-- Returned per row (nothing else):
--   request_id, request_position_title, match_id, candidate_id,
--   full_name, profession, nationality,
--   official_process_status, pipeline_stage, travel_status,
--   flight_date (free text, as stored), flight_number,
--   departure_city, arrival_city,
--   start_date      start_date of the ACCEPTED offer for this request and
--                   candidate (latest one); null when there is none
--   followups       jsonb array of {period_stage, check_date, status},
--                   status 'completed' when an assessment was recorded
--                   (score or a feedback text), otherwise 'planned'.
--                   Only this request's follow-ups (or, without a request,
--                   this employer's).
--
-- Never returned: passport, phone, e-mail, birth date, address, documents,
-- internal notes, referral code, pnr_code, accommodation_details,
-- expected_salary, and from placement_followups compliance_score,
-- salary_compliance, accommodation_compliance, employer_feedback,
-- employee_feedback and notes (those are read only to compute status).
--
-- Access: SECURITY DEFINER, search_path ''. Rows only when my_employer_id()
-- is not null AND email_access_ok(); otherwise zero rows. Not callable by
-- anon or public; authenticated may execute.
--
-- No table, column, policy or row changes. One transaction, idempotent
-- (drop if exists + create). Requires 20261114140000 (part C).
-- Rollback: supabase/rollback/20261115120000_employer_placements_rollback.sql
-- Checks:   supabase/verification/employer_placements.sql
-- Scenario: supabase/verification/employer_placements_scenario.sql

begin;

-- 0. Preconditions ------------------------------------------------------------

do $$
declare
  v_missing text;
begin
  select string_agg(format('%s.%s', x.tbl, x.col), ', ' order by x.tbl, x.col) into v_missing
  from (values
    ('job_requests', 'id'), ('job_requests', 'employer_id'), ('job_requests', 'position_title'),
    ('request_matches', 'id'), ('request_matches', 'request_id'), ('request_matches', 'candidate_id'),
    ('request_matches', 'employer_decision'),
    ('job_candidates', 'id'), ('job_candidates', 'full_name'), ('job_candidates', 'profession'),
    ('job_candidates', 'nationality'), ('job_candidates', 'official_process_status'),
    ('job_candidates', 'travel_status'), ('job_candidates', 'flight_date'),
    ('job_candidates', 'flight_number'), ('job_candidates', 'departure_city'),
    ('job_candidates', 'arrival_city'), ('job_candidates', 'active_request_id'),
    ('job_offers', 'id'), ('job_offers', 'request_id'), ('job_offers', 'candidate_id'),
    ('job_offers', 'employer_id'), ('job_offers', 'status'), ('job_offers', 'start_date'),
    ('job_offers', 'created_at'),
    ('placement_followups', 'candidate_id'), ('placement_followups', 'employer_id'),
    ('placement_followups', 'request_id'), ('placement_followups', 'period_stage'),
    ('placement_followups', 'check_date'), ('placement_followups', 'compliance_score'),
    ('placement_followups', 'employer_feedback'), ('placement_followups', 'employee_feedback')
  ) as x(tbl, col)
  where not exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = x.tbl and c.column_name = x.col
  );
  if v_missing is not null then
    raise exception 'employer_placements: missing table/column(s): %. Nothing was changed.', v_missing;
  end if;

  if to_regprocedure('public.my_employer_id()') is null
     or to_regprocedure('public.email_access_ok()') is null then
    raise exception 'employer_placements: my_employer_id() / email_access_ok() missing. Nothing was changed.';
  end if;
  if to_regprocedure('public.candidate_pipeline_stage(text, text)') is null then
    raise exception 'employer_placements: candidate_pipeline_stage(text, text) missing: apply 20261114140000_pipeline_stage_travel_ready.sql first. Nothing was changed.';
  end if;
end $$;

-- 1. The function ---------------------------------------------------------------
-- Return type may change between versions, so drop and create.

drop function if exists public.employer_placements();

create function public.employer_placements()
returns table (
  request_id uuid,
  request_position_title text,
  match_id uuid,
  candidate_id uuid,
  full_name text,
  profession text,
  nationality text,
  official_process_status text,
  pipeline_stage text,
  travel_status text,
  flight_date text,
  flight_number text,
  departure_city text,
  arrival_city text,
  start_date text,
  followups jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select public.my_employer_id() as employer_id
    where public.email_access_ok()
  ),
  sel as (
    select m.id as match_id, m.request_id, m.candidate_id,
           r.position_title, r.employer_id
    from public.request_matches m
    join public.job_requests r on r.id = m.request_id
    join me on me.employer_id is not null and r.employer_id = me.employer_id
    where m.employer_decision = 'selected'
  )
  select
    s.request_id,
    s.position_title::text,
    s.match_id,
    c.id,
    c.full_name::text,
    c.profession::text,
    c.nationality::text,
    c.official_process_status::text,
    public.candidate_pipeline_stage(c.official_process_status::text, c.travel_status::text),
    c.travel_status::text,
    c.flight_date::text,
    c.flight_number::text,
    c.departure_city::text,
    c.arrival_city::text,
    o.start_date,
    coalesce(f.followups, '[]'::jsonb)
  from sel s
  join public.job_candidates c on c.id = s.candidate_id
  left join lateral (
    select oo.start_date::text as start_date
    from public.job_offers oo
    where oo.request_id = s.request_id
      and oo.candidate_id = s.candidate_id
      and oo.status = 'accepted'
      and (oo.employer_id is null or oo.employer_id = s.employer_id)
    order by oo.created_at desc nulls last, oo.id
    limit 1
  ) o on true
  left join lateral (
    select jsonb_agg(
             jsonb_build_object(
               'period_stage', ff.period_stage::text,
               'check_date', ff.check_date::text,
               'status', case
                 when ff.compliance_score is not null
                   or nullif(btrim(ff.employer_feedback::text), '') is not null
                   or nullif(btrim(ff.employee_feedback::text), '') is not null
                 then 'completed'
                 else 'planned'
               end
             )
             order by ff.period_stage::text, ff.check_date::text nulls last
           ) as followups
    from public.placement_followups ff
    where ff.candidate_id = s.candidate_id
      and (ff.request_id = s.request_id
           or (ff.request_id is null and ff.employer_id = s.employer_id))
  ) f on true
  where (c.active_request_id is null or c.active_request_id = s.request_id)
  order by s.position_title, c.full_name, s.match_id;
$$;

revoke all on function public.employer_placements() from public, anon;
grant execute on function public.employer_placements() to authenticated;

notify pgrst, 'reload schema';

commit;
