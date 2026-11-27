-- Geri alma: 20261127100000_employer_unique_email_company.sql
-- Index'leri ve yeni fonksiyonları kaldırır. employers satırlarına dokunmaz.
-- Yedek tablo (employers_backup_20261127) bilerek silinmez; işiniz bitince elle:
--   drop table public.employers_backup_20261127;
begin;
drop index if exists public.employers_email_ci_unique;
drop index if exists public.employers_company_key_unique;
drop function if exists public.employer_signup_conflict(text, text);
drop function if exists public.employer_name_key(text);
commit;
notify pgrst, 'reload schema';
