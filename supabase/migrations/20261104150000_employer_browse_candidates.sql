-- Safe to re-run: create or replace. The function is also already present on panova-db.
--
-- Employers can request an interview only for candidates linked to their own
-- requests (employer_request_interview). They have no SELECT policy on
-- job_candidates, so the portal query returned zero rows and filters had
-- nothing to narrow. This function returns that same linked set, and only
-- the columns the browse screen shows. Passport, phone, and email stay out.

create or replace function public.employer_browse_candidates()
returns table (
  id uuid,
  full_name text,
  profession text,
  sector text,
  nationality text,
  city text,
  experience_years integer,
  language_skills text,
  shift_suitable boolean,
  status text,
  travel_status text,
  created_at timestamptz,
  active_request_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    picked.id,
    picked.full_name,
    picked.profession,
    picked.sector,
    picked.nationality,
    picked.city,
    picked.experience_years,
    picked.language_skills,
    picked.shift_suitable,
    picked.status,
    picked.travel_status,
    picked.created_at,
    picked.active_request_id
  from (
    select distinct on (c.id)
      c.id,
      c.full_name,
      c.profession,
      c.sector,
      c.nationality,
      c.city,
      c.experience_years,
      c.language_skills,
      c.shift_suitable,
      c.status,
      c.travel_status,
      c.created_at,
      m.request_id as active_request_id
    from public.job_candidates c
    join public.request_matches m on m.candidate_id = c.id
    join public.job_requests r on r.id = m.request_id
    where public.my_employer_id() is not null
      and r.employer_id = public.my_employer_id()
      and c.archived_at is null
    order by c.id, m.presented_at desc nulls last, m.created_at desc
  ) picked
  order by picked.created_at desc nulls last, picked.full_name;
$$;

revoke all on function public.employer_browse_candidates() from public, anon;
grant execute on function public.employer_browse_candidates() to authenticated;

notify pgrst, 'reload schema';
