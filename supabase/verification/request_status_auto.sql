-- Checks for 20261114120000_request_status_auto.sql (A) and
-- 20261114130000_request_status_manual_guard.sql (B).
-- Every query here is read-only. The behaviour is exercised by
-- supabase/verification/request_status_scenario.sql (ends in rollback).

-- 0. BEFORE applying: back up these definitions (copy the output somewhere
--    safe). B replaces guard_demand_status; A and B call the other two.
select p.oid::regprocedure as function, pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('guard_demand_status', 'demand_transition_allowed', 'normalize_demand_status')
order by 1;

-- 0b. BEFORE applying A: none of the new names exist yet (expect 0 rows).
select p.oid::regprocedure
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('request_status_facts', 'advance_request_status', 'request_status_try_advance',
                    'request_status_on_match', 'request_status_on_interview', 'request_status_on_candidate',
                    'demand_status_facts_ok', 'staff_set_request_status');

-- 0c. Triggers on the four tables, before and after.
--     After A: + request_matches_advance_status, interviews_advance_status,
--     job_candidates_advance_status. job_requests_guard_status stays.
select c.relname as table_name, t.tgname, t.tgenabled, pg_get_triggerdef(t.oid) as definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('job_requests', 'request_matches', 'interviews', 'job_candidates')
  and not t.tgisinternal
order by 1, 2;

-- 1. AFTER applying: every new or replaced function.
--    Expect: prosecdef = true, proconfig = {search_path=""}, anon_exec = false,
--    public_in_acl = false.
--    authenticated_exec = true for advance_request_status,
--    staff_set_request_status, guard_demand_status and the three
--    request_status_on_* trigger functions;
--    authenticated_exec = false for the internal request_status_facts,
--    request_status_try_advance and demand_status_facts_ok.
select p.oid::regprocedure as function,
       p.prosecdef,
       p.proconfig,
       has_function_privilege('anon', p.oid, 'execute') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as authenticated_exec,
       exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
               where a.grantee = 0 and a.privilege_type = 'EXECUTE') as public_in_acl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('request_status_facts', 'advance_request_status', 'request_status_try_advance',
                    'request_status_on_match', 'request_status_on_interview', 'request_status_on_candidate',
                    'demand_status_facts_ok', 'staff_set_request_status', 'guard_demand_status')
order by 1;

-- 1b. AFTER applying B: the guard is the new one (expect true).
select pg_get_functiondef('public.guard_demand_status()'::regprocedure) like '%demand_status_use_rpc%'
  as guard_is_part_b;

-- 2. PREVIEW for live requests. Runs before or after A and C (pure SQL, same
--    rule as advance_request_status once part C is applied: travel_status
--    'planned' is neutral). Changes nothing.
--    sonuc:
--      ilerler            the next matching record moves it forward to
--                         turetilen_durum
--      geride             records give a LOWER status; it stays as it is
--                         (never moved back), worth a manual look
--      ayni               records give the same status
--      otomatik_degismez  completed / cancelled / unknown value: never moved
--    Nothing moves when this query runs: an "ilerler" request moves on its
--    next match, presentation, decision, interview or process update.
with r as (
  select jr.id, jr.position_title, jr.employer_name, jr.status,
         coalesce(jr.headcount, 0) as headcount, coalesce(jr.is_demo, false) as is_demo,
         case lower(btrim(coalesce(jr.status, '')))
           when 'new' then 'new_request'
           when 'interviewing' then 'interviews'
           else lower(btrim(coalesce(jr.status, '')))
         end as cur
  from public.job_requests jr
),
-- Stage of each selected candidate. Same rule as candidate_pipeline_stage
-- (part C), written inline so this preview also runs before C:
-- 'planned' is neutral; started > travel_ready > in_process.
s as (
  select sm.request_id,
         case
           when c.official_process_status = 'started_work' or c.travel_status = 'completed' then 'started'
           when c.official_process_status = 'ready_to_travel' or c.travel_status = 'ticketed' then 'travel_ready'
           when c.official_process_status in ('documents_collecting', 'work_permit_applied', 'work_permit_approved',
                                              'visa_applied', 'visa_approved') then 'in_process'
         end as stage
  from public.request_matches sm
  join public.job_candidates c on c.id = sm.candidate_id
  where sm.employer_decision = 'selected'
    and (c.active_request_id is null or c.active_request_id = sm.request_id)
),
f as (
  select r.*,
    (select count(*) from public.request_matches m where m.request_id = r.id) as matched,
    (select count(*) from public.request_matches m where m.request_id = r.id and m.presented_at is not null) as presented,
    (select count(distinct i.candidate_id) from public.interviews i where i.request_id = r.id) as interviews,
    (select count(*) from public.request_matches m where m.request_id = r.id and m.employer_decision = 'selected') as selected,
    (select count(*) from s where s.request_id = r.id and s.stage = 'in_process') as in_process,
    (select count(*) from s where s.request_id = r.id and s.stage = 'travel_ready') as travel_ready,
    (select count(*) from s where s.request_id = r.id and s.stage = 'started') as started
  from r
),
d as (
  select f.*,
    array_position(array['new_request', 'reviewing', 'searching_candidates', 'presenting_candidates',
                         'interviews', 'selection_completed', 'official_process', 'travel_planning'], f.cur) as cur_rank,
    case
      when f.headcount > 0 and f.selected >= f.headcount and f.travel_ready + f.started >= 1 then 8
      when f.headcount > 0 and f.selected >= f.headcount and f.in_process >= 1 then 7
      when f.headcount > 0 and f.selected >= f.headcount then 6
      when f.interviews >= 1 then 5
      when f.presented >= 1 then 4
      when f.matched >= 1 then 3
      else 1
    end as derived_rank
  from f
)
select d.id as talep_id,
       d.position_title as pozisyon,
       d.employer_name as isveren,
       d.is_demo,
       d.status as mevcut_durum,
       (array['new_request', 'reviewing', 'searching_candidates', 'presenting_candidates',
              'interviews', 'selection_completed', 'official_process', 'travel_planning'])[d.derived_rank]
         as turetilen_durum,
       case
         when d.cur_rank is null then 'otomatik_degismez'
         when d.derived_rank > d.cur_rank then 'ilerler'
         when d.derived_rank < d.cur_rank then 'geride'
         else 'ayni'
       end as sonuc,
       d.headcount as kisi_sayisi, d.matched as eslesen, d.presented as sunulan,
       d.interviews as gorusme, d.selected as secilen,
       d.in_process as islemde, d.travel_ready as seyahat_hazir, d.started as ise_baslayan
from d
order by case
           when d.cur_rank is null then 3
           when d.derived_rank > d.cur_rank then 0
           when d.derived_rank < d.cur_rank then 1
           else 2
         end,
         d.is_demo, d.position_title;

-- 2b. Summary of 2 (expect the counts you are ready for).
--     Re-run 2 and count by "sonuc" if needed:
--       select sonuc, count(*) from ( <query 2> ) x group by sonuc;

-- 3. Part C (20261114140000_pipeline_stage_travel_ready.sql), AFTER applying.
-- 3a. Helper exists, is closed to users, search_path pinned.
--     Expect one row: provolatile = 'i' (immutable), proconfig = {search_path=""},
--     anon_exec = false, authenticated_exec = false, public_in_acl = false.
select p.oid::regprocedure as function,
       p.provolatile,
       p.proconfig,
       has_function_privilege('anon', p.oid, 'execute') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as authenticated_exec,
       exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
               where a.grantee = 0 and a.privilege_type = 'EXECUTE') as public_in_acl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'candidate_pipeline_stage';

-- 3b. Both functions call the helper and no longer carry the old rule.
--     Expect calls_helper = true, old_planned_rule = false on both rows, and
--     authenticated_exec = true only for request_pipeline_counts_for_me.
select p.oid::regprocedure as function,
       p.prosecdef,
       p.proconfig,
       pg_get_functiondef(p.oid) like '%candidate_pipeline_stage(%' as calls_helper,
       pg_get_functiondef(p.oid) like '%(''planned'', ''ticketed'')%' as old_planned_rule,
       has_function_privilege('anon', p.oid, 'execute') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as authenticated_exec
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('request_pipeline_counts_for_me', 'request_status_facts')
order by 1;

-- 3c. The rule itself, without touching any row. Expect ok = true on every line.
select v.official, v.travel, v.expected,
       public.candidate_pipeline_stage(v.official, v.travel) is not distinct from v.expected as ok
from (values
  (null::text, null::text, null::text),
  (null, 'planned', null),
  ('not_started', 'planned', null),
  ('documents_collecting', null, 'in_process'),
  ('documents_collecting', 'planned', 'in_process'),
  ('visa_approved', 'planned', 'in_process'),
  ('ready_to_travel', 'planned', 'travel_ready'),
  ('documents_collecting', 'ticketed', 'travel_ready'),
  (null, 'ticketed', 'travel_ready'),
  ('started_work', 'completed', 'started'),
  ('started_work', 'planned', 'started'),
  (null, 'completed', 'started')
) as v(official, travel, expected);

-- 4. AFTER applying: automatic changes so far (newest first).
select a.created_at, a.entity_id as talep_id, a.action,
       a.details ->> 'mode' as mode, a.details ->> 'from' as from_status,
       a.details ->> 'to' as to_status, a.details ->> 'reason' as reason, a.actor_name
from public.audit_logs a
where a.entity_type = 'job_request'
  and a.details ->> 'mode' in ('auto', 'manual')
order by a.created_at desc
limit 50;
