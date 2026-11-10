-- Demand transitions, presented-candidate gate, visa gate, support replies,
-- invite expiry, optional staff MFA flag, consent columns, and the
-- service-role login resolver. Does not require consent yet: the portal
-- release that sends the checkbox does that. Existing employers stay approved.

alter table public.job_candidates
  add column if not exists kvkk_accepted_at timestamptz,
  add column if not exists kvkk_version text;

alter table public.employers
  add column if not exists kvkk_accepted_at timestamptz,
  add column if not exists kvkk_version text;

alter table public.contact_submissions
  add column if not exists kvkk_accepted_at timestamptz,
  add column if not exists kvkk_version text;

alter table public.job_offers
  add column if not exists candidate_name text;

update public.job_offers o
set candidate_name = c.full_name
from public.job_candidates c
where o.candidate_id = c.id
  and o.candidate_name is null;

create or replace function public.copy_offer_candidate_name()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if new.candidate_id is not null and (tg_op = 'INSERT' or new.candidate_id is distinct from old.candidate_id or new.candidate_name is null) then
    select c.full_name into new.candidate_name
    from public.job_candidates c
    where c.id = new.candidate_id;
  end if;
  return new;
end;
$$;

revoke all on function public.copy_offer_candidate_name() from public, anon;
grant execute on function public.copy_offer_candidate_name() to authenticated;
drop trigger if exists job_offers_copy_candidate_name on public.job_offers;
create trigger job_offers_copy_candidate_name
  before insert on public.job_offers
  for each row
  execute function public.copy_offer_candidate_name();

alter table public.candidate_support_tickets
  add column if not exists replied_at timestamptz,
  add column if not exists replied_by uuid,
  add column if not exists replied_by_name text;

comment on column public.candidate_support_tickets.admin_reply is
  'Staff reply shown to the candidate or employer who owns the ticket.';

-- Invite lifetime. Pending rows receive an expiry 14 days after invited_at.
-- A null expiry is not left open: this backfill closes the ones already past it.
alter table public.staff_members
  add column if not exists invite_expires_at timestamptz,
  add column if not exists invite_cancelled_at timestamptz;

update public.staff_members
set invite_expires_at = invited_at + interval '14 days'
where auth_user_id is null
  and invited_at is not null
  and invite_expires_at is null
  and invite_cancelled_at is null;

create or replace function public.invite_staff(p_email text, p_name text, p_staff_role text)
returns public.staff_members
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_row public.staff_members;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.is_upper_management() then raise exception 'Only upper_management can invite'; end if;
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Invalid email'; end if;
  if p_staff_role is null or p_staff_role not in
     ('upper_management','source_country','target_country','field_officer','finance','limited') then
    raise exception 'Invalid staff_role';
  end if;

  select * into v_row from public.staff_members where lower(email) = v_email limit 1;
  if found and v_row.auth_user_id is not null then
    raise exception 'Staff already active';
  end if;

  if found then
    update public.staff_members
       set name = coalesce(nullif(trim(p_name), ''), name),
           role_level = p_staff_role,
           invited_at = now(),
           invite_expires_at = now() + interval '14 days',
           invite_cancelled_at = null,
           invited_by = auth.uid(),
           is_active = true,
           updated_at = now()
     where id = v_row.id
     returning * into v_row;
  else
    insert into public.staff_members (
      id, name, email, role_level, is_active, invited_at, invite_expires_at, invited_by
    ) values (
      gen_random_uuid(),
      coalesce(nullif(trim(p_name), ''), v_email),
      v_email,
      p_staff_role,
      true,
      now(),
      now() + interval '14 days',
      auth.uid()
    )
    returning * into v_row;
  end if;
  return v_row;
end;
$$;

create or replace function public.set_staff_scope_country(p_staff_id uuid, p_country text)
returns public.staff_members
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_row public.staff_members;
begin
  if not public.is_upper_management() then
    raise exception 'Only upper_management can invite';
  end if;
  update public.staff_members
     set scope_country = nullif(btrim(p_country), ''),
         updated_at = now()
   where id = p_staff_id
   returning * into v_row;
  if not found then
    raise exception 'Staff not found';
  end if;
  return v_row;
end;
$$;

create or replace function public.cancel_staff_invite(p_staff_id uuid)
returns public.staff_members
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_row public.staff_members;
begin
  if not public.is_upper_management() then
    raise exception 'Only upper_management can invite';
  end if;
  update public.staff_members
     set invite_cancelled_at = now(),
         is_active = false,
         updated_at = now()
   where id = p_staff_id
     and auth_user_id is null
   returning * into v_row;
  if not found then
    raise exception 'Invite not pending';
  end if;
  return v_row;
end;
$$;

create or replace function public.resend_staff_invite(p_staff_id uuid)
returns public.staff_members
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_row public.staff_members;
begin
  if not public.is_upper_management() then
    raise exception 'Only upper_management can invite';
  end if;
  update public.staff_members
     set invited_at = now(),
         invite_expires_at = now() + interval '14 days',
         invite_cancelled_at = null,
         invited_by = auth.uid(),
         is_active = true,
         updated_at = now()
   where id = p_staff_id
     and auth_user_id is null
   returning * into v_row;
  if not found then
    raise exception 'Invite not pending';
  end if;
  return v_row;
end;
$$;

create or replace function public.link_my_staff()
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_confirmed timestamptz;
  v_staff public.staff_members;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from public.profiles where id = v_uid and role = 'staff') then
    if not public.email_access_ok() then raise exception 'Email not confirmed'; end if;
    return (select linked_staff_id from public.profiles where id = v_uid);
  end if;
  if not public.email_access_ok() then raise exception 'Email not confirmed'; end if;
  select lower(email), email_confirmed_at into v_email, v_confirmed from auth.users where id = v_uid;
  if v_confirmed is null then raise exception 'Email not confirmed'; end if;

  select * into v_staff from public.staff_members
   where lower(email) = v_email and auth_user_id is null
     and invited_at is not null
   limit 1;
  if not found then raise exception 'No pending staff invite for this email'; end if;
  if v_staff.invite_cancelled_at is not null or coalesce(v_staff.is_active, true) = false then
    raise exception 'invite_cancelled';
  end if;
  if v_staff.invite_expires_at is not null and v_staff.invite_expires_at < now() then
    raise exception 'invite_expired';
  end if;

  update public.staff_members set auth_user_id = v_uid, updated_at = now() where id = v_staff.id;
  insert into public.profiles (id, role, staff_role, linked_staff_id, full_name)
  values (v_uid, 'staff', v_staff.role_level, v_staff.id, v_staff.name)
  on conflict (id) do update
    set role = 'staff', staff_role = excluded.staff_role, linked_staff_id = excluded.linked_staff_id,
        full_name = excluded.full_name, updated_at = now();
  return v_staff.id;
end;
$$;

revoke all on function public.set_staff_scope_country(uuid, text) from public, anon;
revoke all on function public.cancel_staff_invite(uuid) from public, anon;
revoke all on function public.resend_staff_invite(uuid) from public, anon;
grant execute on function public.set_staff_scope_country(uuid, text) to authenticated;
grant execute on function public.cancel_staff_invite(uuid) to authenticated;
grant execute on function public.resend_staff_invite(uuid) to authenticated;

-- Optional staff MFA. false until an operator turns it on. Enrolled users are
-- still asked for their code; accounts without a factor are not locked out.
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

insert into public.app_settings (key, value)
values ('staff_mfa_required', 'false'::jsonb)
on conflict (key) do nothing;

drop policy if exists app_settings_select on public.app_settings;
drop policy if exists app_settings_update on public.app_settings;
create policy app_settings_select on public.app_settings
  for select to authenticated
  using (public.is_staff());
create policy app_settings_update on public.app_settings
  for update to authenticated
  using (public.is_portal_manager())
  with check (public.is_portal_manager());

create or replace function public.staff_mfa_required()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce(
    (select (s.value #>> '{}')::boolean from public.app_settings s where s.key = 'staff_mfa_required'),
    false
  );
$$;

revoke all on function public.staff_mfa_required() from public, anon;
grant execute on function public.staff_mfa_required() to authenticated;

-- Demand status. Aliases new -> new_request and interviewing -> interviews.
create or replace function public.normalize_demand_status(p_status text)
returns text
language sql
immutable
as $$
  select case lower(btrim(coalesce(p_status, '')))
    when 'new' then 'new_request'
    when 'interviewing' then 'interviews'
    else lower(btrim(coalesce(p_status, '')))
  end;
$$;

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

create or replace function public.guard_demand_status()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_to text := public.normalize_demand_status(new.status);
begin
  if tg_op = 'UPDATE' and public.normalize_demand_status(old.status) = v_to then
    new.status := v_to;
    return new;
  end if;
  if not public.demand_transition_allowed(case when tg_op = 'UPDATE' then old.status else '' end, v_to, new.id) then
    raise exception 'demand_status_transition' using errcode = '23514';
  end if;
  new.status := v_to;
  return new;
end;
$$;

-- Fold legacy spellings, and pull presenting/interview rows that have no
-- supporting records back to a status the records can support. No rows are
-- deleted. This runs before the trigger so the correction itself is not blocked.
update public.job_requests
set status = 'new_request'
where lower(status) = 'new';

update public.job_requests
set status = 'interviews'
where lower(status) = 'interviewing';

update public.job_requests r
set status = 'searching_candidates'
where r.status = 'presenting_candidates'
  and not exists (
    select 1 from public.request_matches m
    where m.request_id = r.id and m.presented_at is not null
  );

update public.job_requests r
set status = case
  when exists (
    select 1 from public.request_matches m
    where m.request_id = r.id and m.presented_at is not null
  ) then 'presenting_candidates'
  else 'searching_candidates'
end
where r.status = 'interviews'
  and not exists (
    select 1 from public.interviews i where i.request_id = r.id
  );

revoke all on function public.normalize_demand_status(text) from public, anon;
revoke all on function public.demand_transition_allowed(text, text, uuid) from public, anon;
revoke all on function public.guard_demand_status() from public, anon;
grant execute on function public.normalize_demand_status(text) to authenticated;
grant execute on function public.demand_transition_allowed(text, text, uuid) to authenticated;
grant execute on function public.guard_demand_status() to authenticated;

drop trigger if exists job_requests_guard_status on public.job_requests;
create trigger job_requests_guard_status
  before insert or update of status on public.job_requests
  for each row
  execute function public.guard_demand_status();

create or replace function public.guard_presented_pipeline()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if new.request_id is null or new.candidate_id is null then
    return new;
  end if;
  if not exists (
    select 1 from public.request_matches m
    where m.request_id = new.request_id
      and m.candidate_id = new.candidate_id
      and m.presented_at is not null
  ) then
    raise exception 'candidate_not_presented' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_presented_pipeline() from public, anon;
grant execute on function public.guard_presented_pipeline() to authenticated;

drop trigger if exists interviews_require_presented on public.interviews;
create trigger interviews_require_presented
  before insert on public.interviews
  for each row
  execute function public.guard_presented_pipeline();

drop trigger if exists offers_require_presented on public.job_offers;
create trigger offers_require_presented
  before insert on public.job_offers
  for each row
  execute function public.guard_presented_pipeline();

create or replace function public.employer_request_interview(
  p_candidate_id uuid,
  p_request_id uuid default null,
  p_scheduled_at timestamptz default null,
  p_notes text default null
) returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_emp uuid := public.my_employer_id();
  v_req uuid;
  v_demo boolean;
  v_id uuid;
begin
  if v_emp is null then
    raise exception 'not_linked_employer' using errcode = '42501';
  end if;

  select m.request_id, (m.is_demo or r.is_demo)
    into v_req, v_demo
  from public.request_matches m
  join public.job_requests r on r.id = m.request_id
  where m.candidate_id = p_candidate_id
    and r.employer_id = v_emp
    and m.presented_at is not null
    and (p_request_id is null or m.request_id = p_request_id)
  order by m.presented_at desc, m.created_at desc
  limit 1;

  if v_req is null then
    raise exception 'candidate_not_presented_to_employer' using errcode = '42501';
  end if;

  insert into public.interviews (request_id, candidate_id, employer_id, scheduled_at, status, panova_notes, is_demo)
  values (
    v_req,
    p_candidate_id,
    v_emp,
    coalesce(p_scheduled_at, now() + interval '3 days'),
    'scheduled',
    left(coalesce(p_notes, 'İşveren portalından görüşme talebi'), 1000),
    coalesce(v_demo, false)
  )
  returning id into v_id;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, details, is_demo)
  values (
    auth.uid(),
    'İşveren görüşme talebi oluşturdu',
    'interview',
    v_id,
    jsonb_build_object('employer_id', v_emp, 'request_id', v_req, 'candidate_id', p_candidate_id),
    coalesce(v_demo, false)
  );
  return v_id;
end;
$$;

create or replace function public.guard_visa_status()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if new.status is distinct from 'visa_processing' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'visa_processing' then
    return new;
  end if;
  if not exists (
    select 1 from public.job_offers o
    where o.candidate_id = new.id and o.status = 'accepted'
  ) then
    raise exception 'visa_requires_accepted_offer' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_visa_status() from public, anon;
grant execute on function public.guard_visa_status() to authenticated;

drop trigger if exists job_candidates_guard_visa on public.job_candidates;
create trigger job_candidates_guard_visa
  before insert or update of status on public.job_candidates
  for each row
  execute function public.guard_visa_status();

-- Login lookup. Service role only: it returns an email address.
create or replace function public.phone_key(p_value text)
returns text
language plpgsql
immutable
as $$
declare
  v text := regexp_replace(coalesce(p_value, ''), '[^0-9+]', '', 'g');
begin
  if v = '' then return null; end if;
  if v like '00%' then v := '+' || substr(v, 3); end if;
  if v ~ '^0[1-9][0-9]{8,}$' then
    v := '+90' || substr(v, 2);
  elsif v ~ '^90[0-9]{10}$' then
    v := '+' || v;
  elsif v ~ '^[1-9][0-9]{9,14}$' then
    v := '+' || v;
  end if;
  if v !~ '^\+[0-9]{10,15}$' then return null; end if;
  return v;
end;
$$;

create or replace function public.resolve_candidate_login_email(p_identifier text)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_raw text := btrim(coalesce(p_identifier, ''));
  v_passport text;
  v_phone text;
  v_email text;
  v_count int;
begin
  if v_raw = '' then return null; end if;

  if position('@' in v_raw) > 0 then
    select c.email into v_email
    from public.job_candidates c
    where lower(c.email) = lower(v_raw)
    limit 1;
    return v_email;
  end if;

  if v_raw ~ '[A-Za-z]' then
    v_passport := upper(regexp_replace(v_raw, '\s+', '', 'g'));
    if length(v_passport) < 5 or length(v_passport) > 20 or v_passport !~ '^[A-Z0-9]+$' then
      return null;
    end if;
    select count(*) into v_count
    from public.job_candidates c
    where upper(regexp_replace(coalesce(c.passport_number, ''), '\s+', '', 'g')) = v_passport;
    if v_count <> 1 then return null; end if;
    select c.email into v_email
    from public.job_candidates c
    where upper(regexp_replace(coalesce(c.passport_number, ''), '\s+', '', 'g')) = v_passport
    limit 1;
    return v_email;
  end if;

  v_phone := public.phone_key(v_raw);
  if v_phone is null then return null; end if;
  select count(*) into v_count
  from public.job_candidates c
  where public.phone_key(c.phone) = v_phone;
  if v_count <> 1 then return null; end if;
  select c.email into v_email
  from public.job_candidates c
  where public.phone_key(c.phone) = v_phone
  limit 1;
  return v_email;
end;
$$;

revoke all on function public.phone_key(text) from public, anon;
revoke all on function public.resolve_candidate_login_email(text) from public, anon, authenticated;
grant execute on function public.phone_key(text) to authenticated, service_role;
grant execute on function public.resolve_candidate_login_email(text) to service_role;

notify pgrst, 'reload schema';
