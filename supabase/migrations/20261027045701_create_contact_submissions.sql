-- Already applied on production (panova-db / vptcihlhkzfmwxpaituf) as
-- supabase migration create_contact_submissions (version 20261027045701).
-- This file records that SQL so git matches the live database.
-- Do not re-apply it against production.

-- Public homepage contact form (app/page.tsx)
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company_key text,
  company_name text,
  full_name text not null,
  email text not null,
  phone text,
  notes text
);

alter table public.contact_submissions enable row level security;

-- Anyone can submit the public contact form
drop policy if exists contact_submissions_insert_anon on public.contact_submissions;
create policy contact_submissions_insert_anon
  on public.contact_submissions
  for insert
  to anon, authenticated
  with check (true);

-- Staff can read submissions
drop policy if exists contact_submissions_select_staff on public.contact_submissions;
create policy contact_submissions_select_staff
  on public.contact_submissions
  for select
  to authenticated
  using (public.is_staff());

grant insert on public.contact_submissions to anon, authenticated;
grant select on public.contact_submissions to authenticated;
notify pgrst, 'reload schema';
