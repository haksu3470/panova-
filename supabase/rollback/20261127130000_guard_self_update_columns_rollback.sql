-- Geri alma: 20261127130000_guard_self_update_columns.sql. Satırlara dokunmaz.
begin;
drop trigger if exists job_candidates_guard_self_update on public.job_candidates;
drop trigger if exists employers_guard_self_update on public.employers;
drop function if exists public.guard_self_update_columns();
commit;
