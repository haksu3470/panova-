-- Giriş yapmamış (anon) kullanıcının job_candidates tablosuna doğrudan satır eklemesini kapatır.
-- Canlıda elle eklenmiş: anon_register_candidate, INSERT to anon,
--   with check (auth_user_id is null and coalesce(is_verified, false) = false).
-- Kodda kullanan yer yok: aday kaydı link_my_candidate() (security definer, oturumlu),
-- personel kaydı staff_insert_candidates politikasıyla yapılır.
-- Açık kalırsa biri REST API ile sahte aday açıp referral_code / registered_by / notes
-- alanlarını doldurabilir; o e-postanın sahibi kayıt olunca link_my_candidate bu satırı ona bağlar.
-- Satır silinmez, yalnız kural kalkar; bu yüzden yedek tablo gerekmez.
-- Sıra: supabase/verification/anon_register_candidate_readonly.sql -> bu dosya
--       -> supabase/verification/drop_anon_register_candidate.sql
-- Geri alma: supabase/rollback/20261127120000_drop_anon_register_candidate_rollback.sql
begin;
drop policy if exists anon_register_candidate on public.job_candidates;
commit;
notify pgrst, 'reload schema';
