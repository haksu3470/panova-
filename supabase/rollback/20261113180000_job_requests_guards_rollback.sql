-- Rollback of supabase/migrations/20261113180000_job_requests_guards.sql
begin;

alter table public.job_requests drop constraint if exists job_requests_headcount_range;
alter table public.job_requests drop constraint if exists job_requests_position_title_nonblank;
alter table public.job_requests drop constraint if exists job_requests_employer_name_nonblank;
alter table public.job_requests drop constraint if exists job_requests_sector_nonblank;
alter table public.job_requests drop constraint if exists job_requests_salary_range;
alter table public.job_requests drop constraint if exists job_requests_experience_range;
alter table public.job_requests drop constraint if exists job_requests_city_nonblank;
alter table public.job_requests drop constraint if exists job_requests_contract_type_nonblank;

drop trigger if exists job_requests_guard_staff_fields on public.job_requests;
drop function if exists public.guard_request_staff_fields();

-- The policy uses request_has_activity, so it is restored before the function is dropped.
drop policy if exists emp_requests_delete on public.job_requests;
create policy emp_requests_delete on public.job_requests
  for delete to authenticated
  using (employer_id = public.my_employer_id());

drop function if exists public.request_has_activity(uuid);

notify pgrst, 'reload schema';
commit;
