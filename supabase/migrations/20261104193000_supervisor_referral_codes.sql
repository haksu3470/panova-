-- Each source_country and target_country supervisor gets one referral code.
-- Field officers, finance, and limited staff are not region agents and do not
-- receive one. A candidate inserted by a region supervisor is stamped with
-- that supervisor's code. Self-registration, anon inserts, and other staff
-- stay null. Upper management may set a real supervisor code. Only a portal
-- manager may delete a candidate, and only when the candidate has no code.

alter table public.staff_members
  add column if not exists referral_code text;

alter table public.job_candidates
  add column if not exists referral_code text;

comment on column public.staff_members.referral_code is
  'Unique code for a source_country or target_country supervisor. Null for every other role.';
comment on column public.job_candidates.referral_code is
  'Supervisor code copied when that supervisor registers the candidate. Null is open or self registration.';

alter table public.staff_members
  drop constraint if exists staff_members_referral_code_format;
alter table public.staff_members
  add constraint staff_members_referral_code_format
  check (referral_code is null or referral_code ~ '^PV[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$');

alter table public.job_candidates
  drop constraint if exists job_candidates_referral_code_format;
alter table public.job_candidates
  add constraint job_candidates_referral_code_format
  check (referral_code is null or referral_code ~ '^PV[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$');

create unique index if not exists staff_members_referral_code_key
  on public.staff_members (referral_code);

create index if not exists job_candidates_referral_code_idx
  on public.job_candidates (referral_code);

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
      select 1 from public.job_candidates c where c.referral_code = code
    ) then
      return code;
    end if;
  end loop;
  raise exception 'Could not allocate a supervisor referral code';
end;
$$;

revoke all on function public.generate_supervisor_referral_code() from public, anon, authenticated, service_role;

create or replace function public.is_portal_manager()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select public.is_upper_management()
    or exists (
      select 1
      from public.staff_members sm
      where sm.auth_user_id = (select auth.uid())
        and coalesce(sm.is_active, true)
        and sm.role_level = 'upper_management'
    );
$$;

revoke all on function public.is_portal_manager() from public, anon;
grant execute on function public.is_portal_manager() to authenticated;

create or replace function public.assign_supervisor_referral_code()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if new.role_level in ('source_country', 'target_country') then
    if tg_op = 'UPDATE'
       and old.referral_code is not null
       and old.referral_code ~ '^PV[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$' then
      new.referral_code := old.referral_code;
    else
      new.referral_code := public.generate_supervisor_referral_code();
    end if;
    return new;
  end if;

  -- Keep a code already issued so it cannot be reused and old candidates still match.
  -- Never accept a code typed in by the client.
  if tg_op = 'UPDATE' then
    new.referral_code := old.referral_code;
  else
    new.referral_code := null;
  end if;
  return new;
end;
$$;

revoke all on function public.assign_supervisor_referral_code() from public, anon, authenticated, service_role;

drop trigger if exists staff_members_assign_referral_code on public.staff_members;
create trigger staff_members_assign_referral_code
  before insert or update on public.staff_members
  for each row
  execute function public.assign_supervisor_referral_code();

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
  v_supplied := nullif(btrim(coalesce(new.referral_code, '')), '');

  if tg_op = 'UPDATE' then
    if new.referral_code is not distinct from old.referral_code then
      return new;
    end if;
    if public.is_portal_manager()
       or v_jwt = 'service_role'
       or (v_uid is null and v_jwt = '' and current_user in ('postgres', 'supabase_admin')) then
      if v_supplied is null then
        new.referral_code := null;
      elsif exists (
        select 1 from public.staff_members s
        where s.referral_code = v_supplied
          and s.role_level in ('source_country', 'target_country')
      ) then
        new.referral_code := v_supplied;
      else
        raise exception 'unknown_supervisor_code' using errcode = '22023';
      end if;
    else
      new.referral_code := old.referral_code;
    end if;
    return new;
  end if;

  -- SQL editor and service role have no end-user actor. Anon never stamps a code.
  if v_uid is null then
    if v_jwt = 'service_role' or (v_jwt = '' and current_user in ('postgres', 'supabase_admin')) then
      if v_supplied is not null and exists (
        select 1 from public.staff_members s
        where s.referral_code = v_supplied
          and s.role_level in ('source_country', 'target_country')
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

  if v_role in ('source_country', 'target_country') then
    new.referral_code := v_code;
    return new;
  end if;

  if v_role = 'upper_management' or public.is_portal_manager() then
    if v_supplied is null then
      new.referral_code := null;
    elsif exists (
      select 1 from public.staff_members s
      where s.referral_code = v_supplied
        and s.role_level in ('source_country', 'target_country')
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

drop trigger if exists job_candidates_stamp_referral_code on public.job_candidates;
create trigger job_candidates_stamp_referral_code
  before insert or update on public.job_candidates
  for each row
  execute function public.stamp_candidate_referral_code();

update public.staff_members
set updated_at = now()
where role_level in ('source_country', 'target_country')
  and referral_code is null;

-- staff_all granted every staff member delete on every candidate.
-- Select, insert, and update stay with staff. Delete is managers and open rows only.
drop policy if exists staff_all on public.job_candidates;

drop policy if exists staff_select_candidates on public.job_candidates;
create policy staff_select_candidates on public.job_candidates
  for select to authenticated
  using (public.is_staff());

drop policy if exists staff_insert_candidates on public.job_candidates;
create policy staff_insert_candidates on public.job_candidates
  for insert to authenticated
  with check (public.is_staff());

drop policy if exists staff_update_candidates on public.job_candidates;
create policy staff_update_candidates on public.job_candidates
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists manager_delete_open_candidate on public.job_candidates;
create policy manager_delete_open_candidate on public.job_candidates
  for delete to authenticated
  using (
    public.is_portal_manager()
    and referral_code is null
  );

notify pgrst, 'reload schema';
