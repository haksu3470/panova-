-- Rollback for 20261116120000_interview_offer_write_roles.sql.
-- Puts back the live definitions from before the migration
-- (same as 20261110120000_staff_read_scope.sql): staff write access to
-- interviews and job_offers asks only is_staff() and staff_can_read_candidate().
-- Select, delete and candidate / employer policies were not changed, so they
-- are not touched here either.

begin;

drop policy if exists staff_insert_interviews on public.interviews;
create policy staff_insert_interviews on public.interviews
  for insert to authenticated
  with check (public.is_staff() and public.staff_can_read_candidate(candidate_id));

drop policy if exists staff_update_interviews on public.interviews;
create policy staff_update_interviews on public.interviews
  for update to authenticated
  using (public.is_staff() and public.staff_can_read_candidate(candidate_id))
  with check (public.is_staff() and public.staff_can_read_candidate(candidate_id));

drop policy if exists staff_insert_offers on public.job_offers;
create policy staff_insert_offers on public.job_offers
  for insert to authenticated
  with check (public.is_staff() and public.staff_can_read_candidate(candidate_id));

drop policy if exists staff_update_offers on public.job_offers;
create policy staff_update_offers on public.job_offers
  for update to authenticated
  using (public.is_staff() and public.staff_can_read_candidate(candidate_id))
  with check (public.is_staff() and public.staff_can_read_candidate(candidate_id));

notify pgrst, 'reload schema';

commit;
