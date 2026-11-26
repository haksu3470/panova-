-- Offers and requests: selectable benefits, and offers hidden from the employer.
--
-- A. job_offers.employer_visible (default true). The employer reads an offer
--    only when it is visible (emp_offers_select). Staff choose it on the
--    candidate file's offer form; existing offers stay visible.
-- B. job_offers.offer_terms.benefits: a JSON array of benefit keys (lib/benefits.ts).
-- C. job_requests.extra_benefits text[]: benefits that have no column of
--    their own. accommodation / meals / transport / outbound flight keep
--    accommodation_provided, food_provided, transport_provided, flight_covered.
--
-- One transaction, idempotent.
-- Rollback: supabase/rollback/20261126140000_offer_benefits_visibility_rollback.sql

begin;

-- A ---------------------------------------------------------------------------
alter table public.job_offers add column if not exists employer_visible boolean not null default true;

drop policy if exists emp_offers_select on public.job_offers;
create policy emp_offers_select on public.job_offers
  for select to authenticated
  using (employer_id = public.my_employer_id() and employer_visible and public.email_access_ok());

-- B ---------------------------------------------------------------------------
alter table public.job_offers drop constraint if exists job_offers_benefits_check;
alter table public.job_offers add constraint job_offers_benefits_check check (
  offer_terms is null
  or offer_terms -> 'benefits' is null
  or (
    jsonb_typeof(offer_terms -> 'benefits') = 'array'
    and (offer_terms -> 'benefits') <@ '["accommodation","meals","transport","flight_out","flight_return","permit_fees","health_insurance","overtime_paid","work_gear"]'::jsonb
  )
);

-- C ---------------------------------------------------------------------------
alter table public.job_requests add column if not exists extra_benefits text[] not null default '{}';
alter table public.job_requests drop constraint if exists job_requests_extra_benefits_check;
alter table public.job_requests add constraint job_requests_extra_benefits_check check (
  extra_benefits <@ array['flight_return', 'permit_fees', 'health_insurance', 'overtime_paid', 'work_gear']::text[]
);

commit;
