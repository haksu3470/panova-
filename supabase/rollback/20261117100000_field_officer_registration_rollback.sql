-- Rollback for 20261117100000_field_officer_registration.sql.
--
-- Puts back the definitions from 20261104212539_source_country_referral_codes.sql
-- (codes for source_country only) and 20261110120000_staff_read_scope.sql
-- (field_officer reads assigned / backup / task candidates only and cannot
-- insert candidates).
--
-- Field officers' live staff_members.referral_code is cleared by the restored
-- assignment trigger. The issued code stays in private.staff_referral_codes,
-- as for any role change, so it is never handed to someone else. Candidates
-- that already carry a field officer's code keep it (data is not changed).
--
-- The columns job_candidates.registered_by and kvkk_recorded_by are KEPT so
-- the recorded data is not lost. Nothing writes them after this rollback.
-- To remove them as well, run the two commented lines at the end by hand.
--
-- The document and candidate-files policies were re-created with their
-- existing text by the migration; they are not changed here.

begin;

alter table public.staff_members
  drop constraint if exists staff_members_referral_code_role;

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

-- Clear the field officers' live codes (the ledger keeps them).
update public.staff_members
set updated_at = now()
where role_level = 'field_officer'
  and referral_code is not null;

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

comment on column public.staff_members.referral_code is
  'Unique code assigned by the database for a source_country officer at invite or role assignment. Null for every other role. Clients cannot choose or replace it.';

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

create or replace function public.staff_can_read_candidate(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select public.is_portal_manager()
    or exists (
      select 1
      from public.current_staff() me
      join public.job_candidates c on c.id = p_id
      where me.role_level = 'source_country'
        and (
          (me.referral_code is not null and c.referral_code = me.referral_code)
          or (
            public.country_key(me.scope_country) is not null
            and public.country_key(c.nationality) = public.country_key(me.scope_country)
          )
        )
    )
    or exists (
      select 1
      from public.current_staff() me
      where me.role_level = 'target_country'
        and public.country_key(me.scope_country) is not null
        and exists (
          select 1
          from public.request_matches m
          join public.job_requests r on r.id = m.request_id
          left join public.employers e on e.id = r.employer_id
          where m.candidate_id = p_id
            and (
              public.country_key(r.country) = public.country_key(me.scope_country)
              or public.country_key(e.country) = public.country_key(me.scope_country)
            )
        )
    )
    or exists (
      select 1
      from public.current_staff() me
      join public.job_candidates c on c.id = p_id
      where me.role_level = 'field_officer'
        and (
          c.assigned_to = me.staff_id
          or c.assigned_backup = me.staff_id
          or exists (
            select 1
            from public.tasks t
            where (
                public.names_match(t.assignee, me.staff_name)
                or public.names_match(t.backup_assignee, me.staff_name)
                or public.names_match(t.assignee, me.staff_email)
                or public.names_match(t.backup_assignee, me.staff_email)
              )
              and (
                (t.related_entity_type in ('candidate', 'job_candidate') and t.related_entity_id = p_id)
                or (
                  t.related_entity_type in ('request', 'job_request')
                  and exists (
                    select 1 from public.request_matches m
                    where m.request_id = t.related_entity_id and m.candidate_id = p_id
                  )
                )
              )
          )
        )
    );
$$;

create or replace function public.staff_can_insert_candidate()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select public.is_portal_manager()
    or exists (
      select 1 from public.current_staff() me
      where me.role_level = 'source_country'
    );
$$;

revoke all on function public.staff_can_read_candidate(uuid) from public, anon;
revoke all on function public.staff_can_insert_candidate() from public, anon;
grant execute on function public.staff_can_read_candidate(uuid) to authenticated;
grant execute on function public.staff_can_insert_candidate() to authenticated;

drop policy if exists staff_select_candidates on public.job_candidates;
drop policy if exists staff_insert_candidates on public.job_candidates;
drop policy if exists staff_update_candidates on public.job_candidates;
create policy staff_select_candidates on public.job_candidates
  for select to authenticated
  using (public.is_staff() and public.staff_can_read_candidate(id));
create policy staff_insert_candidates on public.job_candidates
  for insert to authenticated
  with check (public.is_staff() and public.staff_can_insert_candidate());
create policy staff_update_candidates on public.job_candidates
  for update to authenticated
  using (public.is_staff() and public.staff_can_read_candidate(id))
  with check (public.is_staff() and public.staff_can_read_candidate(id));

drop function if exists public.field_officer_owns_candidate(uuid, text);

-- Optional, removes the recorded data:
-- alter table public.job_candidates drop column if exists kvkk_recorded_by;
-- alter table public.job_candidates drop column if exists registered_by;

notify pgrst, 'reload schema';

commit;
