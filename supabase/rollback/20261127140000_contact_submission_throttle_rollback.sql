-- Geri alma: 20261127140000_contact_submission_throttle.sql. Satırlara dokunmaz.
begin;
drop trigger if exists contact_submissions_throttle on public.contact_submissions;
drop function if exists public.contact_submission_throttle();
alter table public.contact_submissions drop constraint if exists contact_submissions_lengths;
commit;
