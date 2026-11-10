-- Candidate duplicate checks and phone/passport sign-in.
-- phone_key stays in lockstep with lib/loginIdentifier.ts.
-- A linked candidate signs in with auth.users.email. The profile email can change alone.
-- candidate_duplicate_flags returns only three booleans and is service-role only.

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
  elsif v ~ '^5[0-9]{9}$' then
    v := '+90' || v;
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
  v_mode text := '';
  v_passport text := '';
  v_phone text := '';
  v_linked bigint := 0;
  v_open bigint := 0;
  v_email text;
begin
  if v_raw = '' then return null; end if;

  if position('@' in v_raw) > 0 then
    v_mode := 'email';
  elsif v_raw ~ '[A-Za-z]' then
    v_passport := upper(regexp_replace(v_raw, '\s+', '', 'g'));
    if length(v_passport) < 5 or length(v_passport) > 20
       or v_passport !~ '[A-Z]' or v_passport !~ '^[A-Z0-9]+$' then
      return null;
    end if;
    v_mode := 'passport';
  else
    v_phone := coalesce(public.phone_key(v_raw), '');
    if v_phone = '' then return null; end if;
    v_mode := 'phone';
  end if;

  select
    count(*) filter (
      where c.auth_user_id is not null
        and coalesce(nullif(btrim(u.email), ''), nullif(btrim(c.email), '')) like '%@%'
    ),
    count(*) filter (
      where c.auth_user_id is null
        and nullif(btrim(c.email), '') like '%@%'
    )
  into v_linked, v_open
  from public.job_candidates c
  left join auth.users u on u.id = c.auth_user_id
  where
    (v_mode = 'email' and (
      lower(coalesce(c.email, '')) = lower(v_raw)
      or lower(coalesce(u.email, '')) = lower(v_raw)
    ))
    or (v_mode = 'passport' and upper(regexp_replace(coalesce(c.passport_number, ''), '\s+', '', 'g')) = v_passport)
    or (v_mode = 'phone' and public.phone_key(c.phone) = v_phone);

  if v_linked > 1 then return null; end if;

  if v_linked = 1 then
    select coalesce(nullif(btrim(u.email), ''), nullif(btrim(c.email), ''))
      into v_email
    from public.job_candidates c
    left join auth.users u on u.id = c.auth_user_id
    where c.auth_user_id is not null
      and coalesce(nullif(btrim(u.email), ''), nullif(btrim(c.email), '')) like '%@%'
      and (
        (v_mode = 'email' and (
          lower(coalesce(c.email, '')) = lower(v_raw)
          or lower(coalesce(u.email, '')) = lower(v_raw)
        ))
        or (v_mode = 'passport' and upper(regexp_replace(coalesce(c.passport_number, ''), '\s+', '', 'g')) = v_passport)
        or (v_mode = 'phone' and public.phone_key(c.phone) = v_phone)
      )
    limit 1;
    return v_email;
  end if;

  if v_open = 1 then
    select nullif(btrim(c.email), '')
      into v_email
    from public.job_candidates c
    where c.auth_user_id is null
      and nullif(btrim(c.email), '') like '%@%'
      and (
        (v_mode = 'email' and lower(coalesce(c.email, '')) = lower(v_raw))
        or (v_mode = 'passport' and upper(regexp_replace(coalesce(c.passport_number, ''), '\s+', '', 'g')) = v_passport)
        or (v_mode = 'phone' and public.phone_key(c.phone) = v_phone)
      )
    limit 1;
    return v_email;
  end if;

  return null;
end;
$$;

create or replace function public.candidate_duplicate_flags(p_email text, p_passport text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_email boolean := false;
  v_passport boolean := false;
  v_phone boolean := false;
  v_passport_key text := upper(regexp_replace(coalesce(p_passport, ''), '\s+', '', 'g'));
  v_phone_key text;
begin
  if position('@' in coalesce(p_email, '')) > 0 then
    select exists (
      select 1 from auth.users u
      where lower(u.email) = lower(btrim(p_email))
        and u.email_confirmed_at is not null
    ) into v_email;
    if not v_email then
      select exists (
        select 1 from public.job_candidates c
        where lower(c.email) = lower(btrim(p_email))
          and c.auth_user_id is not null
      ) into v_email;
    end if;
  end if;

  if length(v_passport_key) between 5 and 20
     and v_passport_key ~ '[A-Z]'
     and v_passport_key ~ '^[A-Z0-9]+$' then
    select exists (
      select 1 from public.job_candidates c
      where upper(regexp_replace(coalesce(c.passport_number, ''), '\s+', '', 'g')) = v_passport_key
    ) into v_passport;
  end if;

  v_phone_key := public.phone_key(p_phone);
  if v_phone_key is not null then
    select exists (
      select 1 from public.job_candidates c
      where public.phone_key(c.phone) = v_phone_key
    ) into v_phone;
  end if;

  return jsonb_build_object('email', v_email, 'passport', v_passport, 'phone', v_phone);
end;
$$;

create unique index if not exists unique_candidate_phone_key
  on public.job_candidates (public.phone_key(phone))
  where public.phone_key(phone) is not null;

create unique index if not exists unique_candidate_passport_key
  on public.job_candidates (upper(regexp_replace(passport_number, '\s+', '', 'g')))
  where passport_number is not null and btrim(passport_number) <> '';

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
  v_phone text;
  v_passport text;
  v_constraint text;
  v_kvkk_at text;
  v_kvkk_version text;
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
    v_phone := nullif(trim(v_meta ->> 'phone'), '');
    v_passport := nullif(trim(v_meta ->> 'passport_number'), '');
    v_kvkk_at := nullif(trim(v_meta ->> 'kvkk_accepted_at'), '');
    v_kvkk_version := nullif(trim(v_meta ->> 'kvkk_version'), '');
    if v_kvkk_at is null or v_kvkk_version is null then
      raise exception 'kvkk_required';
    end if;

    if v_phone is not null then
      v_phone := coalesce(public.phone_key(v_phone), v_phone);
    end if;
    if v_passport is not null then
      v_passport := nullif(upper(regexp_replace(v_passport, '\s+', '', 'g')), '');
    end if;

    if exists (
      select 1 from public.job_candidates
      where lower(email) = lower(v_email)
        and auth_user_id is distinct from v_uid
    ) then
      raise exception 'Candidate already registered';
    end if;

    if v_phone is not null and public.phone_key(v_phone) is not null and exists (
      select 1 from public.job_candidates
      where public.phone_key(phone) = public.phone_key(v_phone)
        and auth_user_id is distinct from v_uid
    ) then
      raise exception 'Candidate phone already used';
    end if;

    if v_passport is not null and exists (
      select 1 from public.job_candidates
      where upper(regexp_replace(coalesce(passport_number, ''), '\s+', '', 'g')) = v_passport
        and auth_user_id is distinct from v_uid
    ) then
      raise exception 'Candidate passport already used';
    end if;

    if v_phone is null then
      v_phone := 'p-' || v_uid::text;
    end if;

    begin
      insert into public.job_candidates (
        full_name, nationality, phone, email, profession, sector, passport_number, status, auth_user_id,
        kvkk_accepted_at, kvkk_version
      ) values (
        v_name,
        coalesce(nullif(trim(v_meta ->> 'nationality'), ''), 'Belirtilmedi'),
        v_phone,
        v_email,
        coalesce(nullif(trim(v_meta ->> 'profession'), ''), 'Belirtilmedi'),
        coalesce(nullif(trim(v_meta ->> 'sector'), ''), 'construction'),
        v_passport,
        'pending',
        v_uid,
        v_kvkk_at::timestamptz,
        v_kvkk_version
      )
      returning id into v_cand;
    exception
      when unique_violation then
        get stacked diagnostics v_constraint = constraint_name;
        if v_constraint in ('unique_candidate_phone', 'unique_candidate_phone_key') then
          raise exception 'Candidate phone already used';
        elsif v_constraint in ('unique_candidate_passport', 'unique_candidate_passport_key') then
          raise exception 'Candidate passport already used';
        else
          raise exception 'Candidate already registered';
        end if;
      when invalid_datetime_format then
        raise exception 'kvkk_required';
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

revoke all on function public.phone_key(text) from public, anon;
grant execute on function public.phone_key(text) to authenticated, service_role;

revoke all on function public.resolve_candidate_login_email(text) from public, anon, authenticated;
grant execute on function public.resolve_candidate_login_email(text) to service_role;

revoke all on function public.candidate_duplicate_flags(text, text, text) from public, anon, authenticated;
grant execute on function public.candidate_duplicate_flags(text, text, text) to service_role;

notify pgrst, 'reload schema';
