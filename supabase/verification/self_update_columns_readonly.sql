-- ADIM 1 (salt okuma): aday/işveren kendi satırını hangi kurallarla güncelleyebiliyor? Kişisel veri dönmez.
-- Supabase > panova-db > SQL Editor. Hiçbir şey değiştirmez.
select 'politika' as tur, tablename || '.' || policyname as ad, cmd as tanim
from pg_policies
where schemaname = 'public' and tablename in ('job_candidates', 'employers') and cmd = 'UPDATE'
union all
select 'trigger', tgrelid::regclass::text || '.' || tgname, pg_get_triggerdef(oid)
from pg_trigger
where not tgisinternal and tgrelid in ('public.job_candidates'::regclass, 'public.employers'::regclass)
union all
select 'yeni_fonksiyon_var_mi', 'guard_self_update_columns',
       (to_regprocedure('public.guard_self_update_columns()') is not null)::text
order by 1, 2;
-- 27.11.2026: UPDATE politikaları cand_self_update, staff_update_candidates, emp_self_update,
-- staff_update_employers; employers'ta yalnız updated_at tetikleyicisi; yeni fonksiyon yok.
