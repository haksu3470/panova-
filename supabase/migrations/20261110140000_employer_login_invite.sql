-- Staff can invite an employer contact to set a password and open the employer portal.
-- upper_management, and target_country staff whose scope_country matches the
-- employer, may send. A staff auth user is never given role = employer.
-- Do not apply this file from CI. Review it, then run it by hand.

alter table public.employers
  add column if not exists locale text,
  add column if not exists invited_at timestamptz,
  add column if not exists invited_by uuid,
  add column if not exists invite_sent_at timestamptz;

alter table public.employers drop constraint if exists employers_locale_check;
alter table public.employers
  add constraint employers_locale_check
  check (locale is null or locale in ('tr', 'en', 'sq', 'ar', 'mk'));

comment on column public.employers.locale is
  'Login-invitation language (tr, en, sq, ar, mk). Null sends Turkish.';
comment on column public.employers.invited_at is
  'When staff last prepared a portal login invitation for this employer.';
comment on column public.employers.invited_by is
  'auth.users id of the staff member who last prepared the invitation.';
comment on column public.employers.invite_sent_at is
  'Cooldown clock. Another login invitation is refused for 2 minutes.';

-- Permission, link-or-invite decision, cooldown, and the audit row.
-- The API sends the message with the service role after this returns.
create or replace function public.prepare_employer_login_invite(p_employer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_emp public.employers;
  v_user uuid;
  v_user_email text;
  v_profile_role text;
  v_profile_employer uuid;
  v_candidate uuid;
  v_other uuid;
  v_outcome text;
  v_locale text;
  v_actor_name text;
  v_wait integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.email_access_ok() then
    raise exception 'Email not confirmed';
  end if;

  select * into v_emp
  from public.employers
  where id = p_employer_id
  for update;
  if not found then
    raise exception 'employer_not_found';
  end if;
  if not public.staff_can_read_employer(p_employer_id) then
    raise exception 'employer_invite_forbidden';
  end if;

  if nullif(btrim(coalesce(v_emp.email, '')), '') is null
     or lower(btrim(v_emp.email)) !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'employer_email_missing';
  end if;

  if v_emp.invite_sent_at is not null
     and v_emp.invite_sent_at > now() - interval '2 minutes' then
    v_wait := ceil(extract(epoch from (v_emp.invite_sent_at + interval '2 minutes' - now())))::integer;
    raise exception 'invite_cooldown' using detail = greatest(v_wait, 1)::text;
  end if;

  v_locale := case lower(btrim(coalesce(v_emp.locale, '')))
    when 'en' then 'en'
    when 'sq' then 'sq'
    when 'ar' then 'ar'
    when 'mk' then 'mk'
    else 'tr'
  end;

  if v_emp.auth_user_id is not null then
    select lower(u.email) into v_user_email
    from auth.users u
    where u.id = v_emp.auth_user_id;
    if v_user_email is null or v_user_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
      raise exception 'employer_email_missing';
    end if;
    v_outcome := 'already_linked';
    v_user := v_emp.auth_user_id;
    update public.employers
       set invite_sent_at = now(),
           invited_at = coalesce(invited_at, now()),
           invited_by = auth.uid()
     where id = p_employer_id;
  else
    select u.id into v_user
    from auth.users u
    where lower(u.email) = lower(btrim(v_emp.email))
    limit 1;

    if v_user is not null then
      if exists (
        select 1 from public.staff_members sm
        where sm.auth_user_id = v_user
          and coalesce(sm.is_active, true)
      ) or exists (
        select 1 from public.profiles p
        where p.id = v_user and p.role = 'staff'
      ) then
        raise exception 'staff_account';
      end if;

      select p.role, p.linked_employer_id, p.linked_candidate_id
        into v_profile_role, v_profile_employer, v_candidate
      from public.profiles p
      where p.id = v_user;

      if v_profile_role = 'candidate'
         or v_candidate is not null
         or (v_profile_role is not null and v_profile_role not in ('employer')) then
        raise exception 'account_other_role';
      end if;

      select e.id into v_other
      from public.employers e
      where e.auth_user_id = v_user
        and e.id <> p_employer_id
      limit 1;
      if v_other is not null
         or (v_profile_employer is not null and v_profile_employer <> p_employer_id) then
        raise exception 'email_linked_elsewhere';
      end if;

      update public.employers
         set auth_user_id = v_user,
             invited_at = coalesce(invited_at, now()),
             invited_by = coalesce(invited_by, auth.uid()),
             invite_sent_at = now()
       where id = p_employer_id;

      insert into public.profiles (id, role, linked_employer_id, full_name)
      values (
        v_user,
        'employer',
        p_employer_id,
        coalesce(v_emp.company_name, v_emp.email)
      )
      on conflict (id) do update
        set role = 'employer',
            linked_employer_id = excluded.linked_employer_id,
            full_name = coalesce(public.profiles.full_name, excluded.full_name),
            updated_at = now()
        where public.profiles.role is distinct from 'staff';

      v_outcome := 'link_existing';
      v_user_email := lower(btrim(v_emp.email));
    else
      update public.employers
         set invited_at = now(),
             invited_by = auth.uid(),
             invite_sent_at = now()
       where id = p_employer_id;
      v_outcome := 'invite_new';
      v_user_email := lower(btrim(v_emp.email));
    end if;
  end if;

  select coalesce(s.name, p.full_name)
    into v_actor_name
  from public.profiles p
  left join public.staff_members s on s.auth_user_id = p.id
  where p.id = auth.uid()
  limit 1;

  insert into public.audit_logs (actor_user_id, actor_name, action, entity_type, entity_id, details, is_demo)
  values (
    auth.uid(),
    v_actor_name,
    'İşveren giriş daveti: ' || coalesce(v_emp.company_name, v_user_email),
    'employer',
    p_employer_id,
    jsonb_build_object(
      'action_key', 'employer_login_invite',
      'outcome', v_outcome,
      'email', v_user_email,
      'locale', v_locale
    ),
    coalesce(v_emp.is_demo, false)
  );

  return jsonb_build_object(
    'outcome', v_outcome,
    'email', v_user_email,
    'company_name', v_emp.company_name,
    'contact_name', coalesce(nullif(btrim(v_emp.contact_person), ''), nullif(btrim(v_emp.contact_name), ''), v_emp.company_name),
    'locale', v_locale,
    'employer_id', p_employer_id,
    'auth_user_id', case when v_outcome = 'invite_new' then null else v_user end,
    'linked', v_outcome <> 'invite_new',
    'invited_at', now()
  );
end;
$$;

revoke all on function public.prepare_employer_login_invite(uuid) from public, anon;
grant execute on function public.prepare_employer_login_invite(uuid) to authenticated;

-- First login after an invitation records KVKK on the employer row the session owns.
create or replace function public.record_my_employer_consent(p_version text)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_version text := nullif(btrim(coalesce(p_version, '')), '');
  v_emp uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.email_access_ok() then
    raise exception 'Email not confirmed';
  end if;
  if v_version is null or length(v_version) > 40 then
    raise exception 'kvkk_required';
  end if;

  update public.employers
     set kvkk_accepted_at = coalesce(kvkk_accepted_at, now()),
         kvkk_version = coalesce(kvkk_version, v_version)
   where auth_user_id = auth.uid()
   returning id into v_emp;

  if v_emp is null then
    raise exception 'not_linked_employer';
  end if;
  return v_emp;
end;
$$;

revoke all on function public.record_my_employer_consent(text) from public, anon;
grant execute on function public.record_my_employer_consent(text) to authenticated;

-- Claim the invited employer id stored in app_metadata when the confirmed
-- email matches that row. Staff keep role = staff. A missing invite id still
-- matches the contact email, preferring a row that was actually invited.
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
  v_app jsonb;
  v_emp uuid;
  v_invited uuid;
  v_is_staff boolean := false;
  v_staff_id uuid;
  v_staff_role text;
  v_staff_name text;
  v_kvkk_at text;
  v_kvkk_version text;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if not public.email_access_ok() then raise exception 'Email not confirmed'; end if;

  select u.email,
         coalesce(u.raw_user_meta_data, '{}'::jsonb),
         coalesce(u.raw_app_meta_data, '{}'::jsonb)
    into v_email, v_meta, v_app
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

  -- Staff never claim an invite. prepare_employer_login_invite refuses their
  -- email, and the branch below keeps role = staff if they already match a company.
  if v_emp is null
     and not v_is_staff
     and (v_app ->> 'invited_employer_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    v_invited := (v_app ->> 'invited_employer_id')::uuid;
    select id into v_emp
    from public.employers
    where id = v_invited
      and lower(email) = lower(v_email)
      and (auth_user_id is null or auth_user_id = v_uid)
    limit 1;
    if v_emp is not null then
      if exists (
        select 1 from public.employers
        where auth_user_id = v_uid and id <> v_emp
      ) then
        raise exception 'email_linked_elsewhere';
      end if;
      update public.employers
         set auth_user_id = v_uid
       where id = v_emp
         and auth_user_id is null;
    end if;
  end if;

  if v_emp is null then
    select id into v_emp
    from public.employers
    where lower(email) = lower(v_email)
      and auth_user_id is null
    order by (invited_at is not null) desc, invited_at desc nulls last, created_at desc
    limit 1;
    if v_emp is not null then
      update public.employers set auth_user_id = v_uid where id = v_emp;
    end if;
  end if;

  if v_emp is null and coalesce(v_meta ->> 'role', '') = 'employer' then
    v_kvkk_at := nullif(trim(v_meta ->> 'kvkk_accepted_at'), '');
    v_kvkk_version := nullif(trim(v_meta ->> 'kvkk_version'), '');
    if v_kvkk_at is null or v_kvkk_version is null then
      raise exception 'kvkk_required';
    end if;
    begin
      insert into public.employers (
        company_name, contact_person, phone, country, email, auth_user_id,
        compliance_status, kvkk_accepted_at, kvkk_version
      ) values (
        coalesce(nullif(trim(v_meta ->> 'company_name'), ''), v_email),
        coalesce(nullif(trim(v_meta ->> 'contact_person'), ''), nullif(trim(v_meta ->> 'full_name'), ''), 'Yetkili'),
        nullif(trim(v_meta ->> 'phone'), ''),
        coalesce(nullif(trim(v_meta ->> 'country'), ''), 'North Macedonia'),
        v_email,
        v_uid,
        'pending',
        v_kvkk_at::timestamptz,
        v_kvkk_version
      )
      returning id into v_emp;
    exception
      when unique_violation then
        raise exception 'Employer already registered';
      when invalid_datetime_format then
        raise exception 'kvkk_required';
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
          updated_at = now()
      where public.profiles.role is distinct from 'staff';
  end if;
  return v_emp;
end;
$$;

notify pgrst, 'reload schema';
