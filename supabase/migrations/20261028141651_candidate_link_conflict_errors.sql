-- Password signup stores the phone and passport in user metadata, then
-- link_my_candidate inserts the candidate row. A phone or passport that
-- already belongs to someone else used to raise the same
-- "Candidate already registered" error as a duplicate email, and the
-- client treated every failure as a missing record. Say which value collided
-- so the confirmed user can enter a different one and finish.

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
    v_phone := coalesce(nullif(trim(v_meta ->> 'phone'), ''), 'p-' || v_uid::text);
    v_passport := nullif(trim(v_meta ->> 'passport_number'), '');

    if exists (
      select 1 from public.job_candidates
      where lower(email) = lower(v_email)
        and auth_user_id is distinct from v_uid
    ) then
      raise exception 'Candidate already registered';
    end if;

    if exists (
      select 1 from public.job_candidates
      where phone = v_phone
        and auth_user_id is distinct from v_uid
    ) then
      raise exception 'Candidate phone already used';
    end if;

    if v_passport is not null and exists (
      select 1 from public.job_candidates
      where passport_number = v_passport
        and auth_user_id is distinct from v_uid
    ) then
      raise exception 'Candidate passport already used';
    end if;

    begin
      insert into public.job_candidates (
        full_name, nationality, phone, email, profession, sector, passport_number, status, auth_user_id
      ) values (
        v_name,
        coalesce(nullif(trim(v_meta ->> 'nationality'), ''), 'Belirtilmedi'),
        v_phone,
        v_email,
        coalesce(nullif(trim(v_meta ->> 'profession'), ''), 'Belirtilmedi'),
        coalesce(nullif(trim(v_meta ->> 'sector'), ''), 'construction'),
        v_passport,
        'pending',
        v_uid
      )
      returning id into v_cand;
    exception
      when unique_violation then
        get stacked diagnostics v_constraint = constraint_name;
        if v_constraint = 'unique_candidate_phone' then
          raise exception 'Candidate phone already used';
        elsif v_constraint = 'unique_candidate_passport' then
          raise exception 'Candidate passport already used';
        else
          raise exception 'Candidate already registered';
        end if;
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
