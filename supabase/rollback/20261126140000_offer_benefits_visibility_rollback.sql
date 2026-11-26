-- Rollback of 20261126140000_offer_benefits_visibility.sql
-- Revert the app code first: it writes employer_visible and extra_benefits.
-- Hidden offers become visible to their employer again. Benefits stored in
-- offer_terms stay (only the check goes); extra_benefits values are lost.
begin;

drop policy if exists emp_offers_select on public.job_offers;
create policy emp_offers_select on public.job_offers
  for select to authenticated
  using (employer_id = public.my_employer_id() and public.email_access_ok());
alter table public.job_offers drop column if exists employer_visible;
alter table public.job_offers drop constraint if exists job_offers_benefits_check;

alter table public.job_requests drop constraint if exists job_requests_extra_benefits_check;
alter table public.job_requests drop column if exists extra_benefits;

commit;
