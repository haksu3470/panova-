-- Employer workforce requests must record whether lodging and meals are provided.
-- The columns already exist. They were nullable and defaulted to true, so an insert
-- that omitted them was stored as "provided" without an answer.
-- Historical nulls keep that previous default. New inserts must send true or false.

update public.job_requests
  set accommodation_provided = true
  where accommodation_provided is null;

update public.job_requests
  set food_provided = true
  where food_provided is null;

alter table public.job_requests
  alter column accommodation_provided set not null,
  alter column accommodation_provided drop default,
  alter column food_provided set not null,
  alter column food_provided drop default;
