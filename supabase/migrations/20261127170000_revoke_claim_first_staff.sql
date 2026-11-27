-- claim_first_staff yalnız kurulumda (hiç personel yokken) ilk yöneticiyi açmak içindi.
-- Kurulum bitti; oturumlu her kullanıcının çağırabilmesine gerek yok. Fonksiyon silinmez,
-- yalnız istemci yetkisi kaldırılır. Satır değişmez, yedek gerekmez.
-- Doğrulama: supabase/verification/revoke_claim_first_staff.sql
-- Geri alma: supabase/rollback/20261127170000_revoke_claim_first_staff_rollback.sql
revoke all on function public.claim_first_staff(text, text) from public, anon, authenticated;
