-- Rollback for supabase/migrations/20261115120000_employer_placements.sql
--
-- NOT a migration. Run by hand in the SQL Editor, and only when needed.
-- Drops public.employer_placements(). Nothing else was created or changed by
-- the migration, so nothing else is restored. No table or row changes.
-- WARNING: once the employer page reads this function, the three tabs
-- (İşlem Durumu, Seyahat Bilgilerim, Aktif Çalışanlar) show a load error
-- after this rollback until the page change is reverted too.

begin;

drop function if exists public.employer_placements();

notify pgrst, 'reload schema';

commit;
