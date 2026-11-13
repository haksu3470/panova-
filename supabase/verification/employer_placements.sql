-- Checks for 20261115120000_employer_placements.sql (F3-5).
-- Every query here is read-only (catalog reads and one function call that
-- returns zero rows without a signed-in user). The behaviour is exercised by
-- supabase/verification/employer_placements_scenario.sql (ends in rollback).

-- 0. BEFORE applying: the function does not exist yet (expect 0 rows).
select p.oid::regprocedure
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'employer_placements';

-- 0b. BEFORE applying: what the function needs is there (expect 0 rows and
--     three true values).
select x.tbl || '.' || x.col as missing
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

select to_regprocedure('public.my_employer_id()') is not null as has_my_employer_id,
       to_regprocedure('public.email_access_ok()') is not null as has_email_access_ok,
       to_regprocedure('public.candidate_pipeline_stage(text, text)') is not null as has_pipeline_stage;

-- 0c. Column types the function casts to text (for information; start_date,
--     flight_date and check_date may be text or date, both work).
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and (table_name, column_name) in (
    ('job_offers', 'start_date'), ('job_candidates', 'flight_date'),
    ('placement_followups', 'check_date'), ('placement_followups', 'period_stage'),
    ('placement_followups', 'compliance_score'))
order by 1, 2;

-- 1. AFTER applying: security and grants.
--    Expect: prosecdef = true, proconfig = {search_path=""}, volatility = 's',
--    anon_exec = false, authenticated_exec = true, public_in_acl = false.
select p.oid::regprocedure as function,
       p.prosecdef,
       p.proconfig,
       p.provolatile as volatility,
       has_function_privilege('anon', p.oid, 'execute') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as authenticated_exec,
       exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
               where a.grantee = 0 and a.privilege_type = 'EXECUTE') as public_in_acl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'employer_placements';

-- 2. AFTER applying: the returned columns, in order (expect exactly these 16:
--    request_id, request_position_title, match_id, candidate_id, full_name,
--    profession, nationality, official_process_status, pipeline_stage,
--    travel_status, flight_date, flight_number, departure_city, arrival_city,
--    start_date, followups).
select a.ord, a.name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral unnest(p.proargnames, p.proargmodes::text[]) with ordinality as a(name, mode, ord)
where n.nspname = 'public' and p.proname = 'employer_placements' and a.mode = 't'
order by a.ord;

-- 2b. The column list equals the expected list (expect true).
select array_agg(a.name order by a.ord) = array[
         'request_id', 'request_position_title', 'match_id', 'candidate_id', 'full_name',
         'profession', 'nationality', 'official_process_status', 'pipeline_stage',
         'travel_status', 'flight_date', 'flight_number', 'departure_city', 'arrival_city',
         'start_date', 'followups']::text[] as columns_as_expected
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral unnest(p.proargnames, p.proargmodes::text[]) with ordinality as a(name, mode, ord)
where n.nspname = 'public' and p.proname = 'employer_placements' and a.mode = 't';

-- 3. No hidden field among the returned columns (expect 0 rows).
select a.name as forbidden_column
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral unnest(p.proargnames, p.proargmodes::text[]) as a(name, mode)
where n.nspname = 'public' and p.proname = 'employer_placements' and a.mode = 't'
  and a.name ~* '(passport|phone|email|birth|address|document|notes|referral|pnr|accommodation|salary|compliance|feedback|auth_user|staff_reason|closure)';

-- 4. The body reads only allowed source columns (expect 0 rows). The words
--    are matched as whole identifiers, so email_access_ok() does not count
--    as "email". compliance_score and the two feedback columns ARE read, but
--    only to compute the follow-up status; check 5 confirms they are not
--    returned.
select w as forbidden_in_body
from unnest(array['passport_number', 'phone', 'email', 'birth_date', 'birth_year', 'address',
                  'documents_json', 'notes', 'referral_code', 'pnr_code', 'accommodation_details',
                  'expected_salary', 'salary_compliance', 'accommodation_compliance',
                  'auth_user_id', 'decision_reason']) as w
where pg_get_functiondef('public.employer_placements()'::regprocedure) ~* ('\m' || w || '\M');

-- 5. The follow-up items carry only period_stage, check_date and status:
--    the jsonb_build_object call has exactly these three keys (expect true).
select pg_get_functiondef('public.employer_placements()'::regprocedure)
         ~ $re$jsonb_build_object\(\s*'period_stage',[^']*'check_date',[^']*'status',$re$
   and (length(pg_get_functiondef('public.employer_placements()'::regprocedure))
        - length(replace(pg_get_functiondef('public.employer_placements()'::regprocedure), 'jsonb_build_object', '')))
       / length('jsonb_build_object') = 1
  as followup_keys_ok;

-- 6. The body uses the shared rules (expect five true values).
--    no_archive_filter: archived candidates are not left out, same as
--    request_pipeline_counts_for_me (which has no archived_at condition).
select d ~ 'public\.candidate_pipeline_stage\(' as uses_pipeline_stage,
       d ~ 'public\.my_employer_id\(\)' as uses_my_employer_id,
       d ~ 'public\.email_access_ok\(\)' as uses_email_access_ok,
       d ~ $re$employer_decision = 'selected'$re$ as selected_only,
       d !~ 'archived_at' as no_archive_filter
from (select pg_get_functiondef('public.employer_placements()'::regprocedure) as d) x;

-- 6b. The card counts still have no archived_at condition either (expect
--     true). If this turns false, the two rules have drifted apart.
select pg_get_functiondef('public.request_pipeline_counts_for_me()'::regprocedure) !~ 'archived_at'
  as cards_count_archived_too;

-- 7. Part C is unchanged: candidate_pipeline_stage stays closed to users
--    (expect anon_exec = false, authenticated_exec = false).
select has_function_privilege('anon', 'public.candidate_pipeline_stage(text, text)'::regprocedure, 'execute') as anon_exec,
       has_function_privilege('authenticated', 'public.candidate_pipeline_stage(text, text)'::regprocedure, 'execute') as authenticated_exec;

-- 8. Without a signed-in user (SQL Editor, no JWT) the function returns no
--    rows: auth.uid() is null, so email_access_ok() is false (expect 0).
select count(*) as rows_without_user from public.employer_placements();
