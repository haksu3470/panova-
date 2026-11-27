-- Giriş yapmamış (anon) kullanıcının employers tablosuna doğrudan satır eklemesini kapatır.
-- Canlıda elle eklenmiş: anon_register_employer, INSERT to anon, with check (auth_user_id is null).
-- Kodda kullanan yer yok: işveren satırı link_my_employer() (security definer) ile açılır.
-- Açık kalırsa biri başka bir firmanın adını/e-postasını önceden kaydedip tekil index ile
-- gerçek firmanın kaydını engelleyebilir.
-- Geri alma: supabase/rollback/20261127110000_drop_anon_register_employer_rollback.sql
begin;
drop policy if exists anon_register_employer on public.employers;
commit;
notify pgrst, 'reload schema';

-- Doğrulama (0 = GEÇTİ):
-- select count(*) from pg_policies where schemaname = 'public' and tablename = 'employers' and 'anon' = any (roles);
