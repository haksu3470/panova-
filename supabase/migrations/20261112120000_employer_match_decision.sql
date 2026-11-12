-- Employer decision on a request match.
--
-- request_matches.employer_decision (pending | selected | rejected) is the one
-- source for "selected" / "rejected". It changes ONLY through two RPCs:
--
--   employer_decide_match(match, decision)          the employer, own requests
--   staff_decide_match(match, decision, reason)     on the employer's behalf;
--                                                   upper_management and
--                                                   target_country (own scope)
--                                                   only; reason required
--
-- Every change is written to audit_logs with the old decision, new decision,
-- reason and actor. decision_source tells whether the current decision was
-- entered by the employer or by staff; a later employer decision replaces a
-- staff one and is audited as an override.
--
-- employer_result stays the staff pipeline note (interview, backup, later).
-- Its 'selected' / 'not_suitable' values are now only a mirror of the
-- decision, written by the trigger. Staff can no longer set them directly, and
-- cannot change the note while a decision stands.
--
-- The whole file is one transaction: if any statement fails, nothing is
-- applied (the browse function is never left dropped).
-- Rollback: supabase/rollback/20261112120000_employer_match_decision_rollback.sql
-- Checks:   supabase/verification/employer_match_decision.sql

begin;

-- 1. Columns ------------------------------------------------------------------

alter table public.request_matches
  add column if not exists employer_decision text not null default 'pending',
  add column if not exists decided_at timestamptz,
  add column if not exists decided_by uuid,
  add column if not exists decision_source text,
  add column if not exists decision_reason text;

alter table public.request_matches
  drop constraint if exists request_matches_employer_decision_check;
alter table public.request_matches
  add constraint request_matches_employer_decision_check
  check (employer_decision in ('pending', 'selected', 'rejected'));

alter table public.request_matches
  drop constraint if exists request_matches_decision_source_check;
alter table public.request_matches
  add constraint request_matches_decision_source_check
  check (
    (employer_decision = 'pending' and decision_source is null)
    or (employer_decision <> 'pending' and decision_source in ('employer', 'staff'))
  );

create index if not exists request_matches_request_decision_idx
  on public.request_matches (request_id, employer_decision);

-- 2. Backfill -----------------------------------------------------------------
-- Existing 'selected' / 'not_suitable' notes were entered by staff, so they
-- become staff decisions. Only the new columns are written. The flag lets a
-- second run pass the guard trigger created below.

select set_config('panova.match_decision_rpc', 'on', true);

update public.request_matches
set employer_decision = case employer_result when 'selected' then 'selected' else 'rejected' end,
    decision_source = 'staff',
    decision_reason = 'Önceki personel kaydından aktarıldı (employer_result)'
where employer_decision = 'pending'
  and employer_result in ('selected', 'not_suitable');

select set_config('panova.match_decision_rpc', 'off', true);

-- 3. Guard trigger ------------------------------------------------------------
-- Outside the two RPCs: decision columns cannot change, and employer_result
-- cannot be set to a decision value or changed while a decision stands.
-- Inside the RPCs: mirror the decision onto employer_result.

create or replace function public.guard_match_decision()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_rpc boolean := coalesce(current_setting('panova.match_decision_rpc', true), '') = 'on';
begin
  if tg_op = 'INSERT' then
    if not v_rpc and (
      coalesce(new.employer_decision, 'pending') <> 'pending'
      or new.decision_source is not null
      or new.decision_reason is not null
      or new.decided_at is not null
      or new.decided_by is not null
      or new.employer_result in ('selected', 'not_suitable')
    ) then
      raise exception 'use_decision_rpc' using errcode = '42501';
    end if;
    return new;
  end if;

  if v_rpc then
    if new.employer_decision is distinct from old.employer_decision then
      new.employer_result := case new.employer_decision
        when 'selected' then 'selected'
        when 'rejected' then 'not_suitable'
        else case when old.employer_result in ('selected', 'not_suitable') then null else old.employer_result end
      end;
    end if;
    return new;
  end if;

  if new.employer_decision is distinct from old.employer_decision
     or new.decision_source is distinct from old.decision_source
     or new.decision_reason is distinct from old.decision_reason
     or new.decided_at is distinct from old.decided_at
     or new.decided_by is distinct from old.decided_by then
    raise exception 'use_decision_rpc' using errcode = '42501';
  end if;

  if new.employer_result is distinct from old.employer_result then
    if new.employer_result in ('selected', 'not_suitable') then
      raise exception 'use_decision_rpc' using errcode = '42501';
    end if;
    if old.employer_decision <> 'pending' then
      raise exception 'decision_locked' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.guard_match_decision() from public, anon;

drop trigger if exists request_matches_guard_decision on public.request_matches;
create trigger request_matches_guard_decision
  before insert or update on public.request_matches
  for each row
  execute function public.guard_match_decision();

-- 4. Employer RPC -------------------------------------------------------------

create or replace function public.employer_decide_match(p_match_id uuid, p_decision text)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_emp uuid := public.my_employer_id();
  v_decision text := lower(btrim(coalesce(p_decision, '')));
  v_match public.request_matches%rowtype;
  v_demo boolean;
  v_override boolean;
begin
  if v_emp is null then
    raise exception 'not_linked_employer' using errcode = '42501';
  end if;
  if v_decision not in ('pending', 'selected', 'rejected') then
    raise exception 'invalid_decision' using errcode = '22023';
  end if;

  select m.* into v_match
  from public.request_matches m
  join public.job_requests r on r.id = m.request_id
  where m.id = p_match_id
    and r.employer_id = v_emp
  for update of m;

  -- Same error for "not yours" and "does not exist": no probing other employers.
  if v_match.id is null then
    raise exception 'match_not_found' using errcode = '42501';
  end if;
  if v_match.presented_at is null then
    raise exception 'candidate_not_presented_to_employer' using errcode = '42501';
  end if;

  -- Nothing to do only when the employer already owns this exact decision.
  -- A staff decision is always replaced, even by the same value.
  if v_match.employer_decision = v_decision
     and (v_decision = 'pending' or v_match.decision_source = 'employer') then
    return v_decision;
  end if;
  v_override := v_match.decision_source = 'staff';

  perform set_config('panova.match_decision_rpc', 'on', true);
  update public.request_matches
  set employer_decision = v_decision,
      decision_source = case when v_decision = 'pending' then null else 'employer' end,
      decision_reason = null,
      decided_at = case when v_decision = 'pending' then null else now() end,
      decided_by = case when v_decision = 'pending' then null else auth.uid() end
  where id = v_match.id;
  perform set_config('panova.match_decision_rpc', 'off', true);

  select (v_match.is_demo or r.is_demo) into v_demo
  from public.job_requests r where r.id = v_match.request_id;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, details, is_demo)
  values (
    auth.uid(),
    case when v_override
      then 'İşveren, personelin girdiği kararı geçersiz kıldı: ' || v_decision
      else 'İşveren aday kararı: ' || v_decision
    end,
    'request_match',
    v_match.id,
    jsonb_build_object(
      'actor', 'employer',
      'employer_id', v_emp,
      'request_id', v_match.request_id,
      'candidate_id', v_match.candidate_id,
      'from', v_match.employer_decision,
      'to', v_decision,
      'overrode_staff_decision', coalesce(v_override, false),
      'previous_source', v_match.decision_source,
      'previous_reason', v_match.decision_reason,
      'previous_decided_by', v_match.decided_by,
      'previous_decided_at', v_match.decided_at,
      -- The trigger may overwrite the staff note; keep the old value here.
      'previous_employer_result', v_match.employer_result
    ),
    coalesce(v_demo, false)
  );
  return v_decision;
end;
$$;

revoke all on function public.employer_decide_match(uuid, text) from public, anon;
grant execute on function public.employer_decide_match(uuid, text) to authenticated;

-- 5. Staff RPC (on the employer's behalf) -------------------------------------

create or replace function public.staff_decide_match(p_match_id uuid, p_decision text, p_reason text)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_role text;
  v_staff_id uuid;
  v_staff_name text;
  v_decision text := lower(btrim(coalesce(p_decision, '')));
  v_reason text := btrim(coalesce(p_reason, ''));
  v_match public.request_matches%rowtype;
  v_employer uuid;
  v_demo boolean;
begin
  select lower(me.role_level), me.staff_id, me.staff_name
    into v_role, v_staff_id, v_staff_name
  from public.current_staff() me
  limit 1;

  if v_role is null or v_role not in ('upper_management', 'target_country') then
    raise exception 'staff_role_not_allowed' using errcode = '42501';
  end if;
  if v_decision not in ('pending', 'selected', 'rejected') then
    raise exception 'invalid_decision' using errcode = '22023';
  end if;
  if char_length(v_reason) < 5 then
    raise exception 'decision_reason_required' using errcode = '22023';
  end if;
  if char_length(v_reason) > 1000 then
    raise exception 'decision_reason_too_long' using errcode = '22023';
  end if;

  select m.* into v_match
  from public.request_matches m
  where m.id = p_match_id
  for update;

  -- target_country only within its scope country; upper_management everywhere.
  if v_match.id is null or not public.staff_can_read_request(v_match.request_id) then
    raise exception 'match_not_found' using errcode = '42501';
  end if;
  if v_match.presented_at is null then
    raise exception 'candidate_not_presented_to_employer' using errcode = '42501';
  end if;

  perform set_config('panova.match_decision_rpc', 'on', true);
  update public.request_matches
  set employer_decision = v_decision,
      decision_source = case when v_decision = 'pending' then null else 'staff' end,
      decision_reason = case when v_decision = 'pending' then null else v_reason end,
      decided_at = case when v_decision = 'pending' then null else now() end,
      decided_by = case when v_decision = 'pending' then null else auth.uid() end
  where id = v_match.id;
  perform set_config('panova.match_decision_rpc', 'off', true);

  select r.employer_id, (v_match.is_demo or r.is_demo) into v_employer, v_demo
  from public.job_requests r where r.id = v_match.request_id;

  insert into public.audit_logs (actor_user_id, actor_name, action, entity_type, entity_id, details, is_demo)
  values (
    auth.uid(),
    v_staff_name,
    'Personel işveren adına karar girdi: ' || v_decision,
    'request_match',
    v_match.id,
    jsonb_build_object(
      'actor', 'staff',
      'staff_id', v_staff_id,
      'staff_role', v_role,
      'staff_name', v_staff_name,
      'on_behalf_of_employer_id', v_employer,
      'request_id', v_match.request_id,
      'candidate_id', v_match.candidate_id,
      'from', v_match.employer_decision,
      'to', v_decision,
      'reason', v_reason,
      'previous_source', v_match.decision_source,
      'previous_reason', v_match.decision_reason,
      'previous_decided_by', v_match.decided_by,
      'previous_decided_at', v_match.decided_at,
      'previous_employer_result', v_match.employer_result
    ),
    coalesce(v_demo, false)
  );
  return v_decision;
end;
$$;

revoke all on function public.staff_decide_match(uuid, text, text) from public, anon;
grant execute on function public.staff_decide_match(uuid, text, text) to authenticated;

-- 6. Demand status guard reads the decision field -----------------------------

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
      where m.request_id = p_request and m.employer_decision = 'selected';
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

-- 7. Employer browse: one row per PRESENTED match (not per candidate), with
--    the request's position, the decision and who entered it. A candidate on
--    two of the employer's requests appears twice, once per request; a
--    candidate who was only linked, not presented, is not returned.
--    The staff reason is internal and is not returned to the employer.
--    Return type changes, so replace cannot alter the existing function.

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
  video_url_3 text,
  match_id uuid,
  presented_at timestamptz,
  employer_decision text,
  decision_source text,
  decided_at timestamptz,
  request_position_title text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
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
    c.video_url_3,
    m.id as match_id,
    m.presented_at,
    m.employer_decision,
    m.decision_source,
    m.decided_at,
    r.position_title as request_position_title
  from public.job_candidates c
  join public.request_matches m on m.candidate_id = c.id
  join public.job_requests r on r.id = m.request_id
  where public.my_employer_id() is not null
    and r.employer_id = public.my_employer_id()
    and m.presented_at is not null
    and c.archived_at is null
  order by m.presented_at desc, c.full_name, m.id;
$$;

revoke all on function public.employer_browse_candidates() from public, anon;
grant execute on function public.employer_browse_candidates() to authenticated;

notify pgrst, 'reload schema';

commit;
