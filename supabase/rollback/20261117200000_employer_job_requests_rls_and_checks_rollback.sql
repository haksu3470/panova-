-- Rollback of 20261117200000_employer_job_requests_rls_and_checks.sql
begin;

alter table public.job_requests drop constraint if exists job_requests_required_language_nonblank;

alter table public.job_requests drop constraint if exists job_requests_city_nonblank;
alter table public.job_requests add constraint job_requests_city_nonblank
  check (city is null or btrim(city) <> '');

alter table public.job_requests drop constraint if exists job_requests_contract_type_nonblank;
alter table public.job_requests add constraint job_requests_contract_type_nonblank
  check (contract_type is null or btrim(contract_type) <> '');

-- Restore live-before policies (employer_id only, no email_access_ok).
drop policy if exists emp_requests_select on public.job_requests;
create policy emp_requests_select on public.job_requests
  for select to authenticated
  using (employer_id = public.my_employer_id());

drop policy if exists emp_requests_insert on public.job_requests;
create policy emp_requests_insert on public.job_requests
  for insert to authenticated
  with check (employer_id = public.my_employer_id());

drop policy if exists emp_requests_update on public.job_requests;
create policy emp_requests_update on public.job_requests
  for update to authenticated
  using (employer_id = public.my_employer_id())
  with check (employer_id = public.my_employer_id());

notify pgrst, 'reload schema';
commit;
