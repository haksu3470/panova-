-- Checks for 20261112120000_employer_match_decision.sql.
-- Sections 0 and 1-2 are read-only. Sections 3-7 are manual tests: run them
-- while impersonating the named user, on demo records (is_demo = true).

-- 0. BEFORE applying: everything the migration builds on must exist.
--    Expect 5 function rows and 3 column rows. A missing row means an earlier
--    migration was never applied; apply that one first.
select p.proname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('my_employer_id', 'current_staff', 'staff_can_read_request',
                    'normalize_demand_status', 'demand_transition_allowed')
order by 1;

select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and ((table_name = 'request_matches' and column_name in ('presented_at', 'employer_result'))
    or (table_name = 'audit_logs' and column_name in ('actor_user_id', 'actor_name')))
order by 1, 2;

-- 0b. BEFORE applying: the new columns must NOT exist yet. Expect zero rows.
--     Any row means someone already created them (perhaps the earlier tool).
--     Stop and send the output: the type and values may differ from this file.
select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'request_matches'
  and column_name in ('employer_decision', 'decided_at', 'decided_by', 'decision_source', 'decision_reason');

-- 0c. BEFORE applying: the live definitions this file replaces. Compare with
--     20261110122000_workflow_guards.sql (demand_transition_allowed) and
--     20261104180000_candidate_youtube_video.sql (employer_browse_candidates).
--     Any hand-made difference on the live database would be overwritten.
select pg_get_functiondef('public.demand_transition_allowed(text,text,uuid)'::regprocedure);
select pg_get_functiondef('public.employer_browse_candidates()'::regprocedure);

-- 0d. BEFORE applying: how many rows the backfill will turn into decisions.
select employer_result, count(*)
from public.request_matches
where employer_result in ('selected', 'not_suitable')
group by 1;

-- AFTER applying -------------------------------------------------------------

-- 1. No policy may let an employer UPDATE request_matches directly. Every
--    UPDATE policy listed here must be a staff policy (is_staff() in qual).
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'request_matches'
order by cmd, policyname;

-- 2. Decision and staff note agree (should return zero rows). The row count
--    with a decision should equal the total from 0d.
select id, employer_decision, decision_source, employer_result
from public.request_matches
where (employer_decision = 'selected' and employer_result is distinct from 'selected')
   or (employer_decision = 'rejected' and employer_result is distinct from 'not_suitable')
   or (employer_decision = 'pending' and employer_result in ('selected', 'not_suitable'));

-- 2b. Employer browse returns one row per PRESENTED match. Run as an employer
--     (impersonated). Expect: no row with presented_at null, match_id unique,
--     and a candidate on two of your requests listed twice with each position:
--       select match_id, id as candidate_id, request_position_title, presented_at, employer_decision
--       from public.employer_browse_candidates()
--       order by candidate_id;
--       select count(*) filter (where presented_at is null) as not_presented,   -- expect 0
--              count(*) - count(distinct match_id)          as duplicate_rows   -- expect 0
--       from public.employer_browse_candidates();

-- 3. Rule 2, roles. As a SOURCE COUNTRY or FIELD officer, expect
--    staff_role_not_allowed:
--      select public.staff_decide_match('<match uuid>', 'selected', 'Telefonla onay verildi');
--    As a TARGET COUNTRY officer, on a request outside scope_country, expect
--    match_not_found; inside scope, expect 'selected'.

-- 4. Rule 1, reason. As UPPER MANAGEMENT, expect decision_reason_required:
--      select public.staff_decide_match('<match uuid>', 'selected', '');

-- 5. No back door. As any staff member, each must fail with use_decision_rpc
--    or decision_locked:
--      update public.request_matches set employer_result = 'selected' where id = '<match uuid>';
--      update public.request_matches set employer_decision = 'selected' where id = '<match uuid>';
--    and on a match that already has a decision:
--      update public.request_matches set employer_result = 'backup' where id = '<decided match uuid>';

-- 6. Other employers. As employer A with a match of employer B, expect
--    match_not_found; a direct update must change zero rows:
--      select public.employer_decide_match('<employer B match uuid>', 'selected');
--      update public.request_matches set employer_decision = 'selected'
--      where id = '<employer B match uuid>';

-- 7. Rules 3 and 5, audit. After a staff decision followed by the employer's
--    own decision on the same match, expect two rows: the staff row with
--    from / to / reason / staff_name, then the employer row with
--    overrode_staff_decision = true and previous_reason set:
--      select created_at, actor_name, action,
--             details->>'from' as from_decision, details->>'to' as to_decision,
--             details->>'reason' as reason, details->>'overrode_staff_decision' as override,
--             details->>'previous_reason' as previous_reason
--      from public.audit_logs
--      where entity_type = 'request_match' and entity_id = '<match uuid>'
--      order by created_at;
