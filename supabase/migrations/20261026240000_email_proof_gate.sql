-- Mailbox proof for password signups.
-- Google identities already proved the address and skip this table.
-- Existing confirmed users are grandfathered so current portals keep working.

create table if not exists public.account_email_proof (
  user_id uuid primary key references auth.users (id) on delete cascade,
  method text not null,
  proved_at timestamptz not null default now()
);

alter table public.account_email_proof enable row level security;
revoke all on public.account_email_proof from public, anon, authenticated;

insert into public.account_email_proof (user_id, method)
select id, 'legacy'
from auth.users
where email_confirmed_at is not null
on conflict (user_id) do nothing;

create or replace function public.email_access_ok()
returns boolean
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return false;
  end if;
  if exists (
    select 1 from auth.identities i
    where i.user_id = v_uid and i.provider = 'google'
  ) then
    return true;
  end if;
  return exists (
    select 1 from public.account_email_proof p where p.user_id = v_uid
  );
end;
$$;

create or replace function public.record_email_proof()
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_uid uuid := auth.uid();
  v_amr jsonb := coalesce(auth.jwt() -> 'amr', '[]'::jsonb);
  v_method text;
begin
  if v_uid is null then
    return false;
  end if;
  if not exists (select 1 from auth.users u where u.id = v_uid) then
    return false;
  end if;

  if exists (
    select 1 from auth.identities i
    where i.user_id = v_uid and i.provider = 'google'
  ) then
    insert into public.account_email_proof (user_id, method)
    values (v_uid, 'google')
    on conflict (user_id) do nothing;
    return true;
  end if;

  select e ->> 'method' into v_method
  from jsonb_array_elements(v_amr) e
  where e ->> 'method' in ('otp', 'magiclink', 'invite', 'email/signup')
  limit 1;

  if v_method is null then
    return false;
  end if;

  insert into public.account_email_proof (user_id, method)
  values (v_uid, v_method)
  on conflict (user_id) do update
    set method = excluded.method,
        proved_at = now();
  return true;
end;
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'staff'
  )
  and public.email_access_ok();
$$;

create or replace function public.link_my_candidate()
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_meta jsonb;
  v_cand uuid;
  v_name text;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if not public.email_access_ok() then raise exception 'Email not confirmed'; end if;

  select u.email, coalesce(u.raw_user_meta_data, '{}'::jsonb)
    into v_email, v_meta
  from auth.users u
  where u.id = v_uid;
  if v_email is null then raise exception 'Email not confirmed'; end if;

  select id into v_cand
  from public.job_candidates
  where auth_user_id = v_uid
  limit 1;

  if v_cand is null then
    select id into v_cand
    from public.job_candidates
    where lower(email) = lower(v_email)
      and auth_user_id is null
    order by created_at desc
    limit 1;
    if v_cand is not null then
      update public.job_candidates set auth_user_id = v_uid where id = v_cand;
    end if;
  end if;

  if v_cand is null and coalesce(v_meta ->> 'role', '') = 'candidate' then
    v_name := coalesce(nullif(trim(v_meta ->> 'full_name'), ''), v_email);
    begin
      insert into public.job_candidates (
        full_name, nationality, phone, email, profession, sector, passport_number, status, auth_user_id
      ) values (
        v_name,
        coalesce(nullif(trim(v_meta ->> 'nationality'), ''), 'Belirtilmedi'),
        coalesce(nullif(trim(v_meta ->> 'phone'), ''), 'p-' || v_uid::text),
        v_email,
        coalesce(nullif(trim(v_meta ->> 'profession'), ''), 'Belirtilmedi'),
        coalesce(nullif(trim(v_meta ->> 'sector'), ''), 'construction'),
        nullif(trim(v_meta ->> 'passport_number'), ''),
        'pending',
        v_uid
      )
      returning id into v_cand;
    exception
      when unique_violation then
        raise exception 'Candidate already registered';
    end;
  end if;

  if v_cand is null then
    raise exception 'No unmatched candidate for this email';
  end if;

  insert into public.profiles (id, role, linked_candidate_id, full_name)
  values (
    v_uid,
    'candidate',
    v_cand,
    (select full_name from public.job_candidates where id = v_cand)
  )
  on conflict (id) do update
    set role = 'candidate',
        linked_candidate_id = excluded.linked_candidate_id,
        full_name = excluded.full_name,
        updated_at = now();
  return v_cand;
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
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if not public.email_access_ok() then raise exception 'Email not confirmed'; end if;

  select u.email, coalesce(u.raw_user_meta_data, '{}'::jsonb)
    into v_email, v_meta
  from auth.users u
  where u.id = v_uid;
  if v_email is null then raise exception 'Email not confirmed'; end if;

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
  return v_emp;
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

create or replace function public.claim_first_staff(p_full_name text, p_staff_role text default 'upper_management')
returns profiles
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_staff_id uuid;
  v_profile public.profiles;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if not public.email_access_ok() then
    raise exception 'Email not confirmed';
  end if;

  if exists (select 1 from public.profiles where role = 'staff') then
    raise exception 'Staff already bootstrapped';
  end if;

  if p_staff_role is null or p_staff_role not in (
    'upper_management','source_country','target_country','field_officer','finance','limited'
  ) then
    raise exception 'Invalid staff_role';
  end if;

  select u.email into v_email from auth.users u where u.id = v_uid;

  insert into public.staff_members (id, name, email, role_level, auth_user_id, is_active)
  values (gen_random_uuid(), coalesce(p_full_name, v_email), v_email, p_staff_role, v_uid, true)
  returning id into v_staff_id;

  insert into public.profiles (id, role, staff_role, linked_staff_id, full_name)
  values (v_uid, 'staff', p_staff_role, v_staff_id, coalesce(p_full_name, v_email))
  on conflict (id) do update
    set role = 'staff',
        staff_role = excluded.staff_role,
        linked_staff_id = excluded.linked_staff_id,
        full_name = excluded.full_name,
        updated_at = now()
  returning * into v_profile;

  return v_profile;
end;
$$;

drop policy if exists cand_self_select on public.job_candidates;
create policy cand_self_select on public.job_candidates
  for select to authenticated
  using ((auth_user_id = auth.uid()) and public.email_access_ok());

drop policy if exists cand_self_update on public.job_candidates;
create policy cand_self_update on public.job_candidates
  for update to authenticated
  using ((auth_user_id = auth.uid()) and public.email_access_ok())
  with check ((auth_user_id = auth.uid()) and public.email_access_ok());

drop policy if exists emp_self_select on public.employers;
create policy emp_self_select on public.employers
  for select to authenticated
  using ((auth_user_id = auth.uid()) and public.email_access_ok());

drop policy if exists emp_self_update on public.employers;
create policy emp_self_update on public.employers
  for update to authenticated
  using ((auth_user_id = auth.uid()) and public.email_access_ok())
  with check ((auth_user_id = auth.uid()) and public.email_access_ok());

revoke all on function public.email_access_ok() from public, anon;
revoke all on function public.record_email_proof() from public, anon;
grant execute on function public.email_access_ok() to authenticated;
grant execute on function public.record_email_proof() to authenticated;
