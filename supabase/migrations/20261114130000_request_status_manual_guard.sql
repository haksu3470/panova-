-- Request status: manual override by upper management only. Part B.
--
-- Deploy TOGETHER WITH the new staff UI. After this file, a direct
-- `update job_requests set status = ...` from the app (role authenticated or
-- anon) is refused with demand_status_use_rpc; the current staff dropdown
-- (RequestsTab -> updateRequestStatus) stops working until the UI calls
-- staff_set_request_status.
--
-- Requires part A (20261114120000_request_status_auto.sql).
--
--   staff_set_request_status(request, status, reason)
--     * upper management only (is_portal_manager), else staff_role_not_allowed
--     * reason 5..1000 characters, else status_reason_required / _too_long
--     * any status in the list, also backwards and also completed/cancelled;
--       the adjacency graph does not apply, the record checks do:
--       presenting needs a presented match, interviews an interview,
--       selection_completed and later stages a selected match
--     * cancelled stores the reason in closed_reason and sets closed_at;
--       completed sets closed_at; reopening clears closed_at
--     * audit_logs: old and new status, reason, staff id/name/role,
--       manual_override = true, and the status the records would give
--     * automatic advancing (part A) still moves the request forward on its
--       next record if the records support a later status
--
--   guard_demand_status (replaced): a status CHANGE is accepted only when
--     * panova.demand_status_mode = 'auto'   (advance_request_status), or
--     * panova.demand_status_mode = 'manual' (staff_set_request_status), or
--     * the caller is not an app user (SQL editor, service role).
--   The flag is set only inside those two functions with
--   set_config(..., true), cleared right after the update, and cannot be set
--   through the API (PostgREST exposes no set_config). Even with the flag,
--   'manual' from an app user is accepted only for upper management.
--   Inserts and unchanged statuses behave exactly as before.
--
-- Back up before applying (see supabase/verification/request_status_auto.sql
-- section 0): the current definition of public.guard_demand_status().
--
-- One transaction, idempotent.
-- Rollback: supabase/rollback/20261114130000_request_status_manual_guard_rollback.sql
-- Checks:   supabase/verification/request_status_auto.sql
-- Scenario: supabase/verification/request_status_scenario.sql

begin;

-- 0. Preconditions.
do $$
declare
  v_missing text;
begin
  -- Every table and column this file reads or writes (directly, or through
  -- request_status_facts from part A).
  select string_agg(format('%s.%s', x.tbl, x.col), ', ' order by x.tbl, x.col) into v_missing
  from (values
    ('job_requests', 'id'), ('job_requests', 'status'), ('job_requests', 'headcount'), ('job_requests', 'is_demo'),
    ('job_requests', 'closed_reason'), ('job_requests', 'closed_at'),
    ('audit_logs', 'actor_user_id'), ('audit_logs', 'actor_name'), ('audit_logs', 'action'),
    ('audit_logs', 'entity_type'), ('audit_logs', 'entity_id'), ('audit_logs', 'details'), ('audit_logs', 'is_demo'),
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
    raise exception 'request_status_manual_guard: missing table/column(s): %. Nothing was changed.', v_missing;
  end if;

  if to_regprocedure('public.request_status_facts(uuid)') is null
     or to_regprocedure('public.advance_request_status(uuid)') is null then
    raise exception 'Part A missing: apply 20261114120000_request_status_auto.sql first';
  end if;
  if to_regprocedure('public.is_portal_manager()') is null
     or to_regprocedure('public.current_staff()') is null
     or to_regprocedure('public.demand_transition_allowed(text, text, uuid)') is null
     or to_regprocedure('public.normalize_demand_status(text)') is null then
    raise exception 'is_portal_manager / current_staff / demand_transition_allowed / normalize_demand_status missing';
  end if;
end $$;

-- 1. Record checks for a manual status (internal) ----------------------------

create or replace function public.demand_status_facts_ok(p_to text, p_request_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_to text := public.normalize_demand_status(p_to);
  f record;
begin
  if v_to not in ('new_request', 'reviewing', 'searching_candidates', 'presenting_candidates',
                  'interviews', 'selection_completed', 'official_process', 'travel_planning',
                  'completed', 'cancelled') then
    return false;
  end if;
  select * into f from public.request_status_facts(p_request_id);
  if v_to = 'presenting_candidates' then return coalesce(f.presented, 0) >= 1; end if;
  if v_to = 'interviews' then return coalesce(f.interviews, 0) >= 1; end if;
  if v_to in ('selection_completed', 'official_process', 'travel_planning', 'completed') then
    return coalesce(f.selected, 0) >= 1;
  end if;
  return true;
end;
$$;

revoke all on function public.demand_status_facts_ok(text, uuid) from public, anon, authenticated;

-- 2. Guard: status changes only through the RPC or automatic advancing -------

create or replace function public.guard_demand_status()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_to text := public.normalize_demand_status(new.status);
  v_mode text := coalesce(current_setting('panova.demand_status_mode', true), '');
  -- The role the statement runs as (SET ROLE by PostgREST). SECURITY DEFINER
  -- changes current_user, not this setting.
  v_app_user boolean := coalesce(current_setting('role', true), '') in ('anon', 'authenticated');
begin
  if tg_op = 'UPDATE' and public.normalize_demand_status(old.status) = v_to then
    new.status := v_to;
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not public.demand_transition_allowed('', v_to, new.id) then
      raise exception 'demand_status_transition' using errcode = '23514';
    end if;
    new.status := v_to;
    return new;
  end if;

  if v_mode = 'manual' then
    if v_app_user and not public.is_portal_manager() then
      raise exception 'staff_role_not_allowed' using errcode = '42501';
    end if;
    if not public.demand_status_facts_ok(v_to, new.id) then
      raise exception 'demand_status_transition' using errcode = '23514';
    end if;
  else
    if v_mode <> 'auto' and v_app_user then
      raise exception 'demand_status_use_rpc' using errcode = '42501';
    end if;
    if not public.demand_transition_allowed(old.status, v_to, new.id) then
      raise exception 'demand_status_transition' using errcode = '23514';
    end if;
  end if;

  new.status := v_to;
  return new;
end;
$$;

revoke all on function public.guard_demand_status() from public, anon;
grant execute on function public.guard_demand_status() to authenticated;

-- The trigger itself is unchanged; recreated so a re-run always ends in the
-- same state.
drop trigger if exists job_requests_guard_status on public.job_requests;
create trigger job_requests_guard_status
  before insert or update of status on public.job_requests
  for each row
  execute function public.guard_demand_status();

-- 3. Manual override RPC ------------------------------------------------------

create or replace function public.staff_set_request_status(p_request_id uuid, p_status text, p_reason text)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_order constant text[] := array[
    'new_request', 'reviewing', 'searching_candidates', 'presenting_candidates',
    'interviews', 'selection_completed', 'official_process', 'travel_planning'];
  v_to text := public.normalize_demand_status(p_status);
  v_reason text := btrim(coalesce(p_reason, ''));
  v_role text;
  v_staff_id uuid;
  v_staff_name text;
  v_from text;
  v_demo boolean;
  v_derived text;
  f record;
begin
  if not public.is_portal_manager() then
    raise exception 'staff_role_not_allowed' using errcode = '42501';
  end if;
  if v_to not in ('new_request', 'reviewing', 'searching_candidates', 'presenting_candidates',
                  'interviews', 'selection_completed', 'official_process', 'travel_planning',
                  'completed', 'cancelled') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;
  if char_length(v_reason) < 5 then
    raise exception 'status_reason_required' using errcode = '22023';
  end if;
  if char_length(v_reason) > 1000 then
    raise exception 'status_reason_too_long' using errcode = '22023';
  end if;

  select lower(me.role_level), me.staff_id, me.staff_name
    into v_role, v_staff_id, v_staff_name
  from public.current_staff() me
  limit 1;

  select public.normalize_demand_status(r.status), coalesce(r.is_demo, false)
    into v_from, v_demo
  from public.job_requests r
  where r.id = p_request_id
  for update;
  if not found then
    raise exception 'request_not_found' using errcode = '42501';
  end if;
  if v_from = v_to then
    return v_to;
  end if;

  -- What the records alone would give (for the audit), same rule as part A.
  select * into f from public.request_status_facts(p_request_id);
  v_derived := v_order[
    case
      when f.headcount > 0 and f.selected >= f.headcount and f.travel_ready + f.started >= 1 then 8
      when f.headcount > 0 and f.selected >= f.headcount and f.in_process >= 1 then 7
      when f.headcount > 0 and f.selected >= f.headcount then 6
      when f.interviews >= 1 then 5
      when f.presented >= 1 then 4
      when f.matched >= 1 then 3
      else 1
    end];

  perform set_config('panova.demand_status_mode', 'manual', true);
  update public.job_requests
  set status = v_to,
      closed_reason = case when v_to = 'cancelled' then v_reason else closed_reason end,
      closed_at = case when v_to in ('cancelled', 'completed') then now() else null end
  where id = p_request_id;
  perform set_config('panova.demand_status_mode', '', true);

  insert into public.audit_logs (actor_user_id, actor_name, action, entity_type, entity_id, details, is_demo)
  values (
    (select auth.uid()),
    v_staff_name,
    'Üst Yönetim talep durumunu el ile değiştirdi: ' || v_from || ' -> ' || v_to,
    'job_request',
    p_request_id,
    jsonb_build_object(
      'mode', 'manual',
      'manual_override', true,
      'from', v_from,
      'to', v_to,
      'reason', v_reason,
      'staff_id', v_staff_id,
      'staff_name', v_staff_name,
      'staff_role', v_role,
      'derived_status', v_derived,
      'facts', to_jsonb(f)
    ),
    v_demo
  );
  return v_to;
end;
$$;

revoke all on function public.staff_set_request_status(uuid, text, text) from public, anon;
grant execute on function public.staff_set_request_status(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';

commit;
