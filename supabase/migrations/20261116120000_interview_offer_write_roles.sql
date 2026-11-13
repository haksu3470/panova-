-- Field officers (and finance / limited) may no longer create or change
-- interviews and job offers. Reading stays as it is.
--
-- Before: staff_insert_* / staff_update_* on interviews and job_offers only
-- asked is_staff() and staff_can_read_candidate(candidate_id). A field officer
-- reaches the candidates assigned to them, so they could add an interview or
-- an offer from the candidate file.
--
-- After: the same expression AND the caller's role, read from current_staff()
-- (staff_members.role_level), is upper_management, source_country or
-- target_country. Insert: in with check. Update: in with check only; using is
-- unchanged, so a denied update raises the row-level security error.
--
-- Not touched: select policies, delete policies (is_portal_manager()), the
-- candidate / employer policies (cand_offers_update, emp_offers_select,
-- employer_select_own) and every trigger.
--
-- Rollback: supabase/rollback/20261116120000_interview_offer_write_roles_rollback.sql
-- Test (rolled back): supabase/verification/interview_offer_write_roles.sql
-- Do not apply this file from CI. Review it, then run it by hand.

begin;

-- 0. Preconditions ---------------------------------------------------------------
do $$
declare
  v_missing text;
begin
  select string_agg(want.tbl || '.' || want.pol, ', ') into v_missing
  from (values
    ('interviews', 'staff_insert_interviews'),
    ('interviews', 'staff_update_interviews'),
    ('job_offers', 'staff_insert_offers'),
    ('job_offers', 'staff_update_offers')
  ) as want(tbl, pol)
  where not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.tablename = want.tbl and p.policyname = want.pol
  );
  if v_missing is not null then
    raise exception 'Beklenen politika yok: %. Hiçbir şey değiştirilmedi.', v_missing;
  end if;

  if to_regprocedure('public.current_staff()') is null
     or to_regprocedure('public.is_staff()') is null
     or to_regprocedure('public.staff_can_read_candidate(uuid)') is null then
    raise exception 'current_staff(), is_staff() veya staff_can_read_candidate(uuid) yok. Hiçbir şey değiştirilmedi.';
  end if;
end
$$;

-- 1. Interviews ------------------------------------------------------------------
drop policy if exists staff_insert_interviews on public.interviews;
create policy staff_insert_interviews on public.interviews
  for insert to authenticated
  with check (
    public.is_staff()
    and public.staff_can_read_candidate(candidate_id)
    and exists (
      select 1 from public.current_staff() me
      where lower(me.role_level) in ('upper_management', 'source_country', 'target_country')
    )
  );

drop policy if exists staff_update_interviews on public.interviews;
create policy staff_update_interviews on public.interviews
  for update to authenticated
  -- using stays as before: the row is reachable, so a field officer's update
  -- fails on with check with "new row violates row-level security policy"
  -- instead of silently changing 0 rows.
  using (public.is_staff() and public.staff_can_read_candidate(candidate_id))
  with check (
    public.is_staff()
    and public.staff_can_read_candidate(candidate_id)
    and exists (
      select 1 from public.current_staff() me
      where lower(me.role_level) in ('upper_management', 'source_country', 'target_country')
    )
  );

-- 2. Job offers ------------------------------------------------------------------
drop policy if exists staff_insert_offers on public.job_offers;
create policy staff_insert_offers on public.job_offers
  for insert to authenticated
  with check (
    public.is_staff()
    and public.staff_can_read_candidate(candidate_id)
    and exists (
      select 1 from public.current_staff() me
      where lower(me.role_level) in ('upper_management', 'source_country', 'target_country')
    )
  );

drop policy if exists staff_update_offers on public.job_offers;
create policy staff_update_offers on public.job_offers
  for update to authenticated
  -- using stays as before: the row is reachable, so a field officer's update
  -- fails on with check with "new row violates row-level security policy"
  -- instead of silently changing 0 rows.
  using (public.is_staff() and public.staff_can_read_candidate(candidate_id))
  with check (
    public.is_staff()
    and public.staff_can_read_candidate(candidate_id)
    and exists (
      select 1 from public.current_staff() me
      where lower(me.role_level) in ('upper_management', 'source_country', 'target_country')
    )
  );

notify pgrst, 'reload schema';

commit;
