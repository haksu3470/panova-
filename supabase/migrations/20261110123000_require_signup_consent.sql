-- Self-service candidate and employer signup must carry a KVKK acceptance.
-- Staff-created rows and already linked rows are left alone.
-- New document and photo writes cannot store a data URL. Existing data URLs stay.

alter table public.candidate_documents
  add column if not exists review_note text;

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
    v_phone := coalesce(nullif(trim(v_meta ->> 'phone'), ''), 'p-' || v_uid::text);
    v_passport := nullif(trim(v_meta ->> 'passport_number'), '');
    v_kvkk_at := nullif(trim(v_meta ->> 'kvkk_accepted_at'), '');
    v_kvkk_version := nullif(trim(v_meta ->> 'kvkk_version'), '');
    if v_kvkk_at is null or v_kvkk_version is null then
      raise exception 'kvkk_required';
    end if;

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
        if v_constraint = 'unique_candidate_phone' then
          raise exception 'Candidate phone already used';
        elsif v_constraint = 'unique_candidate_passport' then
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
          updated_at = now();
  end if;
  return v_emp;
end;
$$;

create or replace function public.reject_new_data_url()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'candidate_documents' then
    if new.file_url like 'data:%'
       and (tg_op = 'INSERT' or new.file_url is distinct from old.file_url) then
      raise exception 'document_data_url_rejected' using errcode = '23514';
    end if;
  elsif tg_table_name = 'job_candidates' then
    if new.photo_url like 'data:%'
       and (tg_op = 'INSERT' or new.photo_url is distinct from old.photo_url) then
      raise exception 'photo_data_url_rejected' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.reject_new_data_url() from public, anon;
grant execute on function public.reject_new_data_url() to authenticated;

drop trigger if exists candidate_documents_reject_data_url on public.candidate_documents;
create trigger candidate_documents_reject_data_url
  before insert or update of file_url on public.candidate_documents
  for each row
  execute function public.reject_new_data_url();

drop trigger if exists job_candidates_reject_photo_data_url on public.job_candidates;
create trigger job_candidates_reject_photo_data_url
  before insert or update of photo_url on public.job_candidates
  for each row
  execute function public.reject_new_data_url();

notify pgrst, 'reload schema';
