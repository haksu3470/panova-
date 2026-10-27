-- Already applied on production as supabase migration
-- preserve_staff_role_on_employer_link (version 20261027044929).
-- These are the live function bodies, kept here so git matches the database.
-- CREATE OR REPLACE is idempotent.
--
-- Opening /employer used to set profiles.role = 'employer' even when
-- staff_members.auth_user_id was already this user, so is_staff() became false
-- and Google portal login fell through. A bound staff row keeps role = 'staff'
-- and still receives linked_employer_id.
-- An employer-only account (no active staff_members row, profile not staff)
-- is still stored as role = 'employer'.

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select public.email_access_ok()
  and (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'staff'
    )
    or exists (
      select 1 from public.staff_members sm
      where sm.auth_user_id = auth.uid()
        and coalesce(sm.is_active, true)
    )
  );
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
  if not public.email_access_ok() then raise exception 'Email not confirmed'; end if;

  select * into v_staff from public.staff_members
   where auth_user_id = v_uid and coalesce(is_active, true)
   limit 1;
  if found then
    insert into public.profiles (id, role, staff_role, linked_staff_id, full_name)
    values (v_uid, 'staff', v_staff.role_level, v_staff.id, v_staff.name)
    on conflict (id) do update
      set role = 'staff',
          staff_role = excluded.staff_role,
          linked_staff_id = excluded.linked_staff_id,
          full_name = coalesce(excluded.full_name, public.profiles.full_name),
          updated_at = now();
    return v_staff.id;
  end if;

  if exists (select 1 from public.profiles where id = v_uid and role = 'staff') then
    return (select linked_staff_id from public.profiles where id = v_uid);
  end if;

  select lower(email), email_confirmed_at into v_email, v_confirmed from auth.users where id = v_uid;
  if v_confirmed is null then raise exception 'Email not confirmed'; end if;

  select * into v_staff from public.staff_members
   where lower(email) = v_email and auth_user_id is null
     and coalesce(is_active, true) and invited_at is not null
   limit 1;
  if not found then raise exception 'No pending staff invite for this email'; end if;

  update public.staff_members set auth_user_id = v_uid, updated_at = now() where id = v_staff.id;
  insert into public.profiles (id, role, staff_role, linked_staff_id, full_name)
  values (v_uid, 'staff', v_staff.role_level, v_staff.id, v_staff.name)
  on conflict (id) do update
    set role = 'staff', staff_role = excluded.staff_role, linked_staff_id = excluded.linked_staff_id,
        full_name = excluded.full_name, updated_at = now();
  return v_staff.id;
end;
$$;

create or replace function public.link_my_employer()
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_meta jsonb;
  v_emp uuid;
  v_is_staff boolean := false;
  v_staff_id uuid;
  v_staff_role text;
  v_staff_name text;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if not public.email_access_ok() then raise exception 'Email not confirmed'; end if;

  select u.email, coalesce(u.raw_user_meta_data, '{}'::jsonb)
    into v_email, v_meta
  from auth.users u
  where u.id = v_uid;
  if v_email is null then raise exception 'Email not confirmed'; end if;

  select sm.id, sm.role_level, sm.name
    into v_staff_id, v_staff_role, v_staff_name
  from public.staff_members sm
  where sm.auth_user_id = v_uid
    and coalesce(sm.is_active, true)
  limit 1;
  if found then
    v_is_staff := true;
  elsif exists (select 1 from public.profiles p where p.id = v_uid and p.role = 'staff') then
    v_is_staff := true;
    select linked_staff_id, staff_role, full_name
      into v_staff_id, v_staff_role, v_staff_name
    from public.profiles where id = v_uid;
  end if;

  select id into v_emp
  from public.employers
  where auth_user_id = v_uid
  limit 1;

  if v_emp is null then
    select id into v_emp
    from public.employers
    where lower(email) = lower(v_email)
      and auth_user_id is null
    order by created_at desc
    limit 1;
    if v_emp is not null then
      update public.employers set auth_user_id = v_uid where id = v_emp;
    end if;
  end if;

  if v_emp is null and coalesce(v_meta ->> 'role', '') = 'employer' then
    begin
      insert into public.employers (
        company_name, contact_person, phone, country, email, auth_user_id
      ) values (
        coalesce(nullif(trim(v_meta ->> 'company_name'), ''), v_email),
        coalesce(nullif(trim(v_meta ->> 'contact_person'), ''), nullif(trim(v_meta ->> 'full_name'), ''), 'Yetkili'),
        nullif(trim(v_meta ->> 'phone'), ''),
        coalesce(nullif(trim(v_meta ->> 'country'), ''), 'North Macedonia'),
        v_email,
        v_uid
      )
      returning id into v_emp;
    exception
      when unique_violation then
        raise exception 'Employer already registered';
    end;
  end if;

  if v_emp is null then
    raise exception 'No unmatched employer for this email';
  end if;

  if v_is_staff then
    insert into public.profiles (id, role, staff_role, linked_staff_id, linked_employer_id, full_name)
    values (
      v_uid,
      'staff',
      coalesce(v_staff_role, 'upper_management'),
      v_staff_id,
      v_emp,
      coalesce(v_staff_name, (select company_name from public.employers where id = v_emp))
    )
    on conflict (id) do update
      set role = 'staff',
          staff_role = coalesce(excluded.staff_role, public.profiles.staff_role),
          linked_staff_id = coalesce(excluded.linked_staff_id, public.profiles.linked_staff_id),
          linked_employer_id = excluded.linked_employer_id,
          full_name = coalesce(public.profiles.full_name, excluded.full_name),
          updated_at = now();
  else
    insert into public.profiles (id, role, linked_employer_id, full_name)
    values (
      v_uid,
      'employer',
      v_emp,
      (select company_name from public.employers where id = v_emp)
    )
    on conflict (id) do update
      set role = 'employer',
          linked_employer_id = excluded.linked_employer_id,
          full_name = excluded.full_name,
          updated_at = now();
  end if;
  return v_emp;
end;
$$;
