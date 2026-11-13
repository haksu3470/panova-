-- Rollback of supabase/migrations/20261113200000_demo_data_tools.sql
-- DİKKAT: yedek tablodaki veri silinir (demo_data_backup tablosu tümüyle kaldırılır).
-- Demo verisi (is_demo satırları) ve audit_logs kayıtları değişmez.
begin;

drop function if exists public.staff_delete_demo_data();
drop function if exists public.staff_seed_demo_data();
drop function if exists public.staff_demo_data_summary();
drop table if exists public.demo_data_backup;

notify pgrst, 'reload schema';
commit;
