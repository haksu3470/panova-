-- Rollback of supabase/migrations/20261113190000_job_requests_salary_currency.sql
-- WARNING: dropping the column deletes the stored currency of every request (salary_currency data is lost).
begin;

alter table public.job_requests drop constraint if exists job_requests_salary_currency_check;
alter table public.job_requests drop column if exists salary_currency;

notify pgrst, 'reload schema';
commit;
