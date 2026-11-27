-- Geri alma: 20261127150000_login_attempts.sql. Route bellekteki sınıra geri düşer.
begin;
drop function if exists public.login_attempt_allowed(text, integer, integer);
drop table if exists public.login_attempts;
commit;
