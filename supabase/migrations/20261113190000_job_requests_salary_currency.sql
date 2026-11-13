-- job_requests.salary_currency: EUR (default) or USD. Applied to production by hand; this file is the repo record.
-- Rollback: supabase/rollback/20261113190000_job_requests_salary_currency_rollback.sql
begin;

alter table public.job_requests add column if not exists salary_currency text not null default 'EUR';

alter table public.job_requests drop constraint if exists job_requests_salary_currency_check;
alter table public.job_requests add constraint job_requests_salary_currency_check
  check (salary_currency in ('EUR', 'USD'));

notify pgrst, 'reload schema';
commit;
