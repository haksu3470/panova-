-- Supabase Auth is live; drop legacy plaintext/hash password columns.
alter table public.staff_members  drop column if exists password;
alter table public.job_candidates drop column if exists password;
alter table public.employers      drop column if exists password;
alter table public.portal_users   drop column if exists password_hash;
