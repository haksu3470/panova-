-- Checks for 20261113120000_request_pipeline_counts.sql.
-- Section 0 and 1 are read-only. Sections 2-4 are manual tests: run them while
-- impersonating the named user.

-- 0. BEFORE applying: everything the function reads must exist.
--    Expect 4 function rows and 11 column rows.
select p.proname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('my_employer_id', 'is_staff', 'staff_can_read_request', 'is_portal_manager')
order by 1;

select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and ((table_name = 'request_matches' and column_name in ('presented_at', 'employer_decision'))
    or (table_name = 'interviews' and column_name in ('request_id', 'candidate_id'))
    or (table_name = 'job_offers' and column_name in ('request_id', 'candidate_id', 'status'))
    or (table_name = 'job_candidates' and column_name in ('official_process_status', 'travel_status', 'active_request_id'))
    or (table_name = 'job_requests' and column_name = 'headcount'))
order by 1, 2;

-- 1. AFTER applying: the view is security_invoker and anon has no rights.
--    Expect reloptions {security_invoker=true}, and anon_select = false.
select c.relname, c.reloptions,
       has_table_privilege('anon', 'public.request_pipeline_counts', 'select') as anon_select,
       has_function_privilege('anon', 'public.request_pipeline_counts_for_me()', 'execute') as anon_execute
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'request_pipeline_counts';

-- 1b. As postgres (no login) the function returns nothing: no employer, no staff.
select count(*) as rows_without_login from public.request_pipeline_counts_for_me();  -- expect 0

-- 2. As an EMPLOYER: only own requests, matched is null on every row.
--      select * from public.request_pipeline_counts order by request_id;
--      select count(*) filter (where matched is not null) as matched_visible   -- expect 0
--      from public.request_pipeline_counts;
--      select count(*) from public.request_pipeline_counts v
--      join public.job_requests r on r.id = v.request_id
--      where r.employer_id <> public.my_employer_id();                         -- expect 0 (or RLS: 0)

-- 3. As UPPER MANAGEMENT: the same request shows the same numbers as for its
--    employer, plus matched filled in. Compare with step 2 for one request:
--      select * from public.request_pipeline_counts where request_id = '<request uuid>';

-- 4. Cross-check against the raw tables, as postgres, for one request:
--      select count(*) as matched,
--             count(*) filter (where presented_at is not null) as presented,
--             count(*) filter (where employer_decision = 'selected') as selected
--      from public.request_matches where request_id = '<request uuid>';
