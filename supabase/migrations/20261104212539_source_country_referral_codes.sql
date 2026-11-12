-- Source-country officers receive one system-generated referral code when the
-- role is saved (invite, insert, or a role change onto source_country).
-- Target-country staff, field officers, finance, and limited staff do not.
-- The code is never taken from the client. The first code issued to a person
-- is kept in a private ledger and restored if they return to the role, so a
-- role toggle cannot mint a replacement. Candidate codes are copied from the
-- acting officer on insert and cannot be changed afterwards. Self-registration
-- and staff without a code stay null. Managers can still delete only null-code
-- candidates.

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table if not exists private.staff_referral_codes (
  staff_id uuid primary key references public.staff_members (id) on delete cascade,
  referral_code text not null,
  created_at timestamptz not null default now(),
  constraint staff_referral_codes_format
    check (referral_code ~ '^PV[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$')
);

create unique index if not exists staff_referral_codes_code_key
  on private.staff_referral_codes (referral_code);

comment on table private.staff_referral_codes is
  'First referral code issued to a staff member. Not exposed to the Data API. The live staff_members.referral_code column is set only while the role is source_country.';

alter table private.staff_referral_codes enable row level security;

revoke all on table private.staff_referral_codes from public, anon, authenticated, service_role;

create or replace function private.guard_staff_referral_code()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  raise exception 'referral_code_immutable' using errcode = '55000';
end;
$$;

revoke all on function private.guard_staff_referral_code() from public, anon, authenticated, service_role;

drop trigger if exists staff_referral_codes_immutable on private.staff_referral_codes;
create trigger staff_referral_codes_immutable
  before update on private.staff_referral_codes
  for each row
  execute function private.guard_staff_referral_code();

create or replace function public.generate_supervisor_referral_code()
returns text
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea;
  code text;
  i int;
  n int;
begin
  for n in 1..12 loop
    bytes := extensions.gen_random_bytes(6);
    code := 'PV';
    for i in 0..5 loop
      code := code || substr(alphabet, 1 + (get_byte(bytes, i) % length(alphabet)), 1);
    end loop;
    if not exists (
      select 1 from public.staff_members s where s.referral_code = code
    ) and not exists (
      select 1 from private.staff_referral_codes ledger where ledger.referral_code = code
    ) and not exists (
      select 1 from public.job_candidates c where c.referral_code = code
    ) then
      return code;
    end if;
  end loop;
  raise exception 'Could not allocate a supervisor referral code';
end;
$$;

revoke all on function public.generate_supervisor_referral_code() from public, anon, authenticated, service_role;

create or replace function public.assign_supervisor_referral_code()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_existing text;
begin
  if new.id is null then
    new.id := gen_random_uuid();
  end if;

  if new.role_level = 'source_country' then
    select ledger.referral_code
      into v_existing
    from private.staff_referral_codes ledger
    where ledger.staff_id = new.id;

    if v_existing is not null then
      new.referral_code := v_existing;
    elsif tg_op = 'UPDATE'
       and old.role_level = 'source_country'
       and old.referral_code ~ '^PV[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$' then
      new.referral_code := old.referral_code;
    else
      new.referral_code := public.generate_supervisor_referral_code();
    end if;
    return new;
  end if;

  new.referral_code := null;
  return new;
end;
$$;

revoke all on function public.assign_supervisor_referral_code() from public, anon, authenticated, service_role;

create or replace function public.record_supervisor_referral_code()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if new.role_level = 'source_country'
     and new.referral_code ~ '^PV[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$' then
    insert into private.staff_referral_codes (staff_id, referral_code)
    values (new.id, new.referral_code)
    on conflict (staff_id) do nothing;

    if exists (
      select 1
      from private.staff_referral_codes ledger
      where ledger.staff_id = new.id
        and ledger.referral_code is distinct from new.referral_code
    ) then
      raise exception 'referral_code_immutable' using errcode = '55000';
    end if;
  end if;
  return null;
end;
$$;

revoke all on function public.record_supervisor_referral_code() from public, anon, authenticated, service_role;

drop trigger if exists staff_members_record_referral_code on public.staff_members;
create trigger staff_members_record_referral_code
  after insert or update on public.staff_members
  for each row
  execute function public.record_supervisor_referral_code();

comment on column public.staff_members.referral_code is
  'Unique code assigned by the database for a source_country officer at invite or role assignment. Null for every other role. Clients cannot choose or replace it.';

-- Remember codes already issued to source-country officers before clearing everyone else.
insert into private.staff_referral_codes (staff_id, referral_code)
select id, referral_code
from public.staff_members
where role_level = 'source_country'
  and referral_code ~ '^PV[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$'
on conflict (staff_id) do nothing;

update public.staff_members
set updated_at = now()
where role_level is distinct from 'source_country'
  and referral_code is not null;

update public.staff_members
set updated_at = now()
where role_level = 'source_country'
  and referral_code is null;

alter table public.staff_members
  drop constraint if exists staff_members_referral_code_role;

alter table public.staff_members
  add constraint staff_members_referral_code_role
  check (
    (
      role_level = 'source_country'
      and referral_code ~ '^PV[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$'
    )
    or (
      role_level is distinct from 'source_country'
      and referral_code is null
    )
  );

create or replace function public.stamp_candidate_referral_code()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_jwt text := coalesce((select auth.role()), '');
  v_role text;
  v_code text;
  v_supplied text;
begin
  if tg_op = 'UPDATE' then
    new.referral_code := old.referral_code;
    return new;
  end if;

  v_supplied := nullif(btrim(coalesce(new.referral_code, '')), '');

  -- SQL editor and service role have no end-user actor. Anon never stamps a code.
  if v_uid is null then
    if v_jwt = 'service_role' or (v_jwt = '' and current_user in ('postgres', 'supabase_admin')) then
      if v_supplied is not null and exists (
        select 1 from public.staff_members s
        where s.referral_code = v_supplied
          and s.role_level = 'source_country'
      ) then
        new.referral_code := v_supplied;
      else
        new.referral_code := null;
      end if;
    else
      new.referral_code := null;
    end if;
    return new;
  end if;

  select s.role_level, s.referral_code
    into v_role, v_code
  from public.staff_members s
  left join public.profiles p on p.id = v_uid
  where coalesce(s.is_active, true)
    and (
      s.auth_user_id = v_uid
      or (p.role = 'staff' and p.linked_staff_id = s.id)
    )
  order by case when s.auth_user_id = v_uid then 0 else 1 end
  limit 1;

  if v_code is not null and v_code ~ '^PV[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$' then
    new.referral_code := v_code;
    return new;
  end if;

  if v_role = 'source_country' then
    raise exception 'source_officer_missing_code' using errcode = '23514';
  end if;

  if v_role = 'upper_management' or public.is_portal_manager() then
    if v_supplied is null then
      new.referral_code := null;
    elsif exists (
      select 1 from public.staff_members s
      where s.referral_code = v_supplied
        and s.role_level = 'source_country'
    ) then
      new.referral_code := v_supplied;
    else
      raise exception 'unknown_supervisor_code' using errcode = '22023';
    end if;
    return new;
  end if;

  new.referral_code := null;
  return new;
end;
$$;

revoke all on function public.stamp_candidate_referral_code() from public, anon, authenticated, service_role;

comment on column public.job_candidates.referral_code is
  'Set on insert from the acting staff member''s code when they have one. Source-country officers cannot leave this empty. Null is open or self registration. Updates cannot change it.';

-- Invite and any other staff insert already pass through the assignment trigger.
-- Fail the invite if a source-country officer is stored without a code.
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
       set name = coalesce(nullif(trim(p_name),''), name), role_level = p_staff_role,
           invited_at = now(), invited_by = auth.uid(), is_active = true, updated_at = now()
     where id = v_row.id returning * into v_row;
  else
    insert into public.staff_members (id, name, email, role_level, is_active, invited_at, invited_by)
    values (gen_random_uuid(), coalesce(nullif(trim(p_name),''), v_email), v_email, p_staff_role, true, now(), auth.uid())
    returning * into v_row;
  end if;

  if p_staff_role = 'source_country'
     and (v_row.referral_code is null
          or v_row.referral_code !~ '^PV[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$') then
    raise exception 'source_officer_code_missing' using errcode = '23514';
  end if;

  return v_row;
end;
$$;

revoke all on function public.invite_staff(text, text, text) from public, anon;
grant execute on function public.invite_staff(text, text, text) to authenticated;

notify pgrst, 'reload schema';
