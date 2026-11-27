-- ADIM 1 (salt okuma): anon aday kaydı kuralı ve şüpheli satır sayısı. Kişisel veri dönmez.
-- Supabase > panova-db > SQL Editor. Hiçbir şey değiştirmez.
select 'anon_insert_politikasi' as olcu,
       count(*)::text as deger
from pg_policies
where schemaname = 'public' and tablename = 'job_candidates' and 'anon' = any (roles)
union all
select 'toplam_aday', count(*)::text from public.job_candidates
union all
select 'sahipsiz_kayitsiz_gercek_aday (anon ile acilmis olabilir)', count(*)::text
from public.job_candidates
where auth_user_id is null and registered_by is null and not coalesce(is_demo, false);
-- 27.11.2026: politika 1, toplam 5, şüpheli 0.
