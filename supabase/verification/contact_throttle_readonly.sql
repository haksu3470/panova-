-- ADIM 1 (salt okuma): iletişim formu tablosu. Yalnız sayı ve uzunluk döner, kişisel veri dönmez.
-- Supabase > panova-db > SQL Editor. Hiçbir şey değiştirmez.
select count(*) as toplam,
       count(*) filter (where created_at > now() - interval '1 hour') as son_1_saat,
       coalesce(max(length(full_name)), 0) as en_uzun_ad,
       coalesce(max(length(email)), 0) as en_uzun_eposta,
       coalesce(max(length(phone)), 0) as en_uzun_telefon,
       coalesce(max(length(company_name)), 0) as en_uzun_firma,
       coalesce(max(length(notes)), 0) as en_uzun_not,
       (select count(*) from pg_trigger where tgrelid = 'public.contact_submissions'::regclass and not tgisinternal) as tetikleyici,
       (select count(*) from pg_constraint where conrelid = 'public.contact_submissions'::regclass and contype = 'c') as check_kisiti
from public.contact_submissions;
