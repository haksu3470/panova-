-- Request status advances by itself (docs/gorev-talep-akisi.md, goal 5). Part A.
--
-- The status of a job_request is moved FORWARD from its records:
--
--   rank  status                 reached when
--   1     new_request            -
--   2     reviewing              (never automatic)
--   3     searching_candidates   at least one match
--   4     presenting_candidates  at least one presented match
--   5     interviews             at least one interview
--   6     selection_completed    selected >= headcount (headcount > 0)
--   7     official_process       selection complete and >= 1 selected candidate
--                                in process, travel-ready or started
--   8     travel_planning        selection complete and >= 1 selected candidate
--                                travel-ready or started
--   -     completed, cancelled   never automatic; never left automatically
--
-- Counts use the same definitions as request_pipeline_counts_for_me()
-- (20261113120000_request_pipeline_counts.sql).
--
-- Rules:
--   * Only forward. A lower derived status (e.g. a selection undone) never
--     moves a request back.
--   * Each step goes through the existing guard (job_requests_guard_status /
--     demand_transition_allowed), one allowed transition at a time. Nothing
--     here bypasses it.
--   * The flag panova.demand_status_mode = 'auto' is set with
--     set_config(..., true) right before each step and cleared right after.
--     Part B's guard reads it; the guard in place today ignores it.
--   * Every automatic change is written to audit_logs (mode 'auto').
--   * The triggers never make the user's own write fail: if advancing fails,
--     the error becomes a WARNING and the write goes through unchanged.
--
-- Additive and compatible with the current UI: no column, policy or existing
-- function changes; the staff dropdown and its transitions keep working.
-- Existing requests are NOT changed by this file. They advance on their next
-- matching record; see the preview query in
-- supabase/verification/request_status_auto.sql.
--
-- One transaction, idempotent.
-- Rollback: supabase/rollback/20261114120000_request_status_auto_rollback.sql
-- Checks:   supabase/verification/request_status_auto.sql
-- Scenario: supabase/verification/request_status_scenario.sql

begin;

-- 0. Preconditions: the objects this file builds on.
do $$
declare
  v_missing text;
begin
  -- Every table and column this file reads or writes.
  select string_agg(format('%s.%s', x.tbl, x.col), ', ' order by x.tbl, x.col) into v_missing
  from (values
    ('job_requests', 'id'), ('job_requests', 'status'), ('job_requests', 'headcount'), ('job_requests', 'is_demo'),
    ('audit_logs', 'actor_user_id'), ('audit_logs', 'action'), ('audit_logs', 'entity_type'),
    ('audit_logs', 'entity_id'), ('audit_logs', 'details'), ('audit_logs', 'is_demo'),
    ('job_candidates', 'id'), ('job_candidates', 'official_process_status'),
    ('job_candidates', 'travel_status'), ('job_candidates', 'active_request_id'),
    ('interviews', 'request_id'), ('interviews', 'candidate_id'),
    ('request_matches', 'request_id'), ('request_matches', 'candidate_id'),
    ('request_matches', 'presented_at'), ('request_matches', 'employer_decision')
  ) as x(tbl, col)
  where not exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = x.tbl and c.column_name = x.col
  );
  if v_missing is not null then
    raise exception 'request_status_auto: missing table/column(s): %. Nothing was changed.', v_missing;
  end if;

  if to_regprocedure('public.demand_transition_allowed(text, text, uuid)') is null
     or to_regprocedure('public.normalize_demand_status(text)') is null then
    raise exception 'demand_transition_allowed / normalize_demand_status missing (20261110122000_workflow_guards.sql)';
  end if;
  if to_regprocedure('public.is_staff()') is null
     or to_regprocedure('public.staff_can_read_request(uuid)') is null then
    raise exception 'is_staff / staff_can_read_request missing (20261110120000_staff_read_scope.sql)';
  end if;
  if not exists (select 1 from pg_trigger
                 where tgrelid = 'public.job_requests'::regclass and tgname = 'job_requests_guard_status') then
    raise exception 'trigger job_requests_guard_status missing (20261110122000_workflow_guards.sql)';
  end if;
end $$;

-- 1. Facts per request (internal) ---------------------------------------------
-- Not granted to authenticated on purpose: it takes any request id, so a
-- grant would let a signed-in user read another employer's counts. It is only
-- called by the SECURITY DEFINER functions below (as their owner).

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
    where sm.request_id = r.id
      and sm.employer_decision = 'selected'
      and (c.active_request_id is null or c.active_request_id = sm.request_id)
  ) p on true
  where r.id = p_request_id;
$$;

revoke all on function public.request_status_facts(uuid) from public, anon, authenticated;

-- 2. Advance one request ------------------------------------------------------
-- Returns the status after the call (null for an unknown request).
-- Called by the triggers below. A direct call by a signed-in user (no trigger
-- around it) is allowed only for staff who can read the request; the SQL
-- editor (no end user) may call it for any request.

create or replace function public.advance_request_status(p_request_id uuid)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_order constant text[] := array[
    'new_request', 'reviewing', 'searching_candidates', 'presenting_candidates',
    'interviews', 'selection_completed', 'official_process', 'travel_planning'];
  v_status text;
  v_demo boolean;
  v_from text;
  v_cur text;
  v_rank int;
  v_target int;
  v_next text;
  v_steps text[] := '{}';
  f record;
begin
  if p_request_id is null then
    return null;
  end if;

  if pg_trigger_depth() = 0
     and (select auth.uid()) is not null
     and not (public.is_staff() and public.staff_can_read_request(p_request_id)) then
    raise exception 'request_not_found' using errcode = '42501';
  end if;

  select r.status, coalesce(r.is_demo, false) into v_status, v_demo
  from public.job_requests r
  where r.id = p_request_id
  for update;
  if not found then
    return null;
  end if;

  v_from := public.normalize_demand_status(v_status);
  v_rank := array_position(v_order, v_from);
  -- completed, cancelled and unknown values are never moved automatically.
  if v_rank is null then
    return v_from;
  end if;

  select * into f from public.request_status_facts(p_request_id);

  v_target := 1;
  if f.matched >= 1 then v_target := 3; end if;
  if f.presented >= 1 then v_target := 4; end if;
  if f.interviews >= 1 then v_target := 5; end if;
  if f.headcount > 0 and f.selected >= f.headcount then
    v_target := 6;
    if f.in_process + f.travel_ready + f.started >= 1 then v_target := 7; end if;
    if f.travel_ready + f.started >= 1 then v_target := 8; end if;
  end if;

  -- Step forward through allowed transitions only, furthest first.
  v_cur := v_from;
  while v_rank < v_target loop
    v_next := null;
    for i in reverse v_target .. v_rank + 1 loop
      if public.demand_transition_allowed(v_cur, v_order[i], p_request_id) then
        v_next := v_order[i];
        exit;
      end if;
    end loop;
    exit when v_next is null;

    perform set_config('panova.demand_status_mode', 'auto', true);
    update public.job_requests set status = v_next where id = p_request_id;
    perform set_config('panova.demand_status_mode', '', true);

    v_steps := v_steps || v_next;
    v_cur := v_next;
    v_rank := array_position(v_order, v_next);
  end loop;

  if cardinality(v_steps) > 0 then
    insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, details, is_demo)
    values (
      (select auth.uid()),
      'Talep durumu kayıtlara göre ilerledi: ' || v_from || ' -> ' || v_cur,
      'job_request',
      p_request_id,
      jsonb_build_object(
        'mode', 'auto',
        'manual_override', false,
        'from', v_from,
        'to', v_cur,
        'steps', to_jsonb(v_steps),
        'facts', to_jsonb(f)
      ),
      v_demo
    );
  end if;
  return v_cur;
end;
$$;

revoke all on function public.advance_request_status(uuid) from public, anon;
grant execute on function public.advance_request_status(uuid) to authenticated;

-- 3. Trigger helpers ----------------------------------------------------------
-- The user's write must not fail because advancing failed: the error is
-- reported as a WARNING and the subtransaction (including the flag) is undone.

create or replace function public.request_status_try_advance(p_request_id uuid, p_source text)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  if p_request_id is null then
    return;
  end if;
  begin
    perform public.advance_request_status(p_request_id);
  exception when others then
    raise warning 'advance_request_status(%) from % failed: % (%)', p_request_id, p_source, sqlerrm, sqlstate;
  end;
end;
$$;

revoke all on function public.request_status_try_advance(uuid, text) from public, anon, authenticated;

create or replace function public.request_status_on_match()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if tg_op = 'UPDATE'
     and new.presented_at is not distinct from old.presented_at
     and new.employer_decision is not distinct from old.employer_decision
     and new.request_id is not distinct from old.request_id then
    return null;
  end if;
  perform public.request_status_try_advance(new.request_id, 'request_matches');
  return null;
end;
$$;

create or replace function public.request_status_on_interview()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if tg_op = 'UPDATE' and new.request_id is not distinct from old.request_id then
    return null;
  end if;
  perform public.request_status_try_advance(new.request_id, 'interviews');
  return null;
end;
$$;

create or replace function public.request_status_on_candidate()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_request uuid;
begin
  if new.official_process_status is not distinct from old.official_process_status
     and new.travel_status is not distinct from old.travel_status
     and new.active_request_id is not distinct from old.active_request_id then
    return null;
  end if;
  -- Requests on which this candidate is selected and counted (same rule as
  -- the process counts: active_request_id empty or this request).
  for v_request in
    select distinct m.request_id
    from public.request_matches m
    where m.candidate_id = new.id
      and m.employer_decision = 'selected'
      and (new.active_request_id is null or new.active_request_id = m.request_id)
  loop
    perform public.request_status_try_advance(v_request, 'job_candidates');
  end loop;
  return null;
end;
$$;

revoke all on function public.request_status_on_match() from public, anon;
revoke all on function public.request_status_on_interview() from public, anon;
revoke all on function public.request_status_on_candidate() from public, anon;
grant execute on function public.request_status_on_match() to authenticated;
grant execute on function public.request_status_on_interview() to authenticated;
grant execute on function public.request_status_on_candidate() to authenticated;

-- 4. Triggers (AFTER, so the row is final) ------------------------------------

drop trigger if exists request_matches_advance_status on public.request_matches;
create trigger request_matches_advance_status
  after insert or update of presented_at, employer_decision, request_id on public.request_matches
  for each row
  execute function public.request_status_on_match();

drop trigger if exists interviews_advance_status on public.interviews;
create trigger interviews_advance_status
  after insert or update of request_id on public.interviews
  for each row
  execute function public.request_status_on_interview();

drop trigger if exists job_candidates_advance_status on public.job_candidates;
create trigger job_candidates_advance_status
  after update of official_process_status, travel_status, active_request_id on public.job_candidates
  for each row
  execute function public.request_status_on_candidate();

notify pgrst, 'reload schema';

commit;
