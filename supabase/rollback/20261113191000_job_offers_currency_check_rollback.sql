-- Rollback of supabase/migrations/20261113191000_job_offers_currency_check.sql
begin;

alter table public.job_offers drop constraint if exists job_offers_currency_check;

notify pgrst, 'reload schema';
commit;
