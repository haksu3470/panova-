-- job_offers: offer_terms.currency may only be EUR or USD (or missing). Applied to production by hand; this file is the repo record.
-- Rollback: supabase/rollback/20261113191000_job_offers_currency_check_rollback.sql
begin;

do $$
declare
  bad_count integer;
begin
  select count(*) into bad_count
  from public.job_offers o
  where o.offer_terms is not null
    and o.offer_terms ->> 'currency' is not null
    and o.offer_terms ->> 'currency' not in ('EUR', 'USD');

  if bad_count > 0 then
    raise exception 'job_offers: % kayitta gecersiz para birimi var. Hicbir sey degistirilmedi.', bad_count;
  end if;
end $$;

alter table public.job_offers drop constraint if exists job_offers_currency_check;
alter table public.job_offers add constraint job_offers_currency_check
  check (offer_terms is null or offer_terms ->> 'currency' is null or offer_terms ->> 'currency' in ('EUR', 'USD'));

notify pgrst, 'reload schema';
commit;
