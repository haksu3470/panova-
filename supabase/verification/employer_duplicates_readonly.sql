-- ADIM 1 (salt okuma): işveren kayıtlarında mükerrer var mı? Yalnız sayı döner, kişisel veri dönmez.
-- Supabase > SQL Editor'da panova-db üzerinde çalıştırın. Hiçbir şey değiştirmez.
-- Firma adı anahtarı migration'daki public.employer_name_key ile aynı kuraldır (küçük harf,
-- Türkçe harfler sadeleşir, boşluk/noktalama atılır).
with e as (
  select coalesce(is_demo, false) as demo,
         nullif(lower(btrim(email)), '') as email_key,
         nullif(regexp_replace(translate(lower(coalesce(company_name, '')), 'ışğüöçâîû', 'isguocaiu'), '[^[:alnum:]]+', '', 'g'), '') as name_key,
         auth_user_id
  from public.employers
)
select 'toplam_isveren' as olcu, count(*) as sayi from e
union all select 'demo_isveren', count(*) from e where demo
union all select 'gercek_isveren', count(*) from e where not demo
union all select 'eposta_bos (gercek)', count(*) from e where not demo and email_key is null
union all select 'hesaba_bagli (gercek)', count(*) from e where not demo and auth_user_id is not null
union all select 'mukerrer_eposta_grup (gercek)', count(*) from (select 1 from e where not demo and email_key is not null group by email_key having count(*) > 1) s
union all select 'mukerrer_eposta_satir (gercek)', coalesce(sum(c), 0) from (select count(*) c from e where not demo and email_key is not null group by email_key having count(*) > 1) s
union all select 'mukerrer_firma_grup (gercek)', count(*) from (select 1 from e where not demo and name_key is not null group by name_key having count(*) > 1) s
union all select 'mukerrer_firma_satir (gercek)', coalesce(sum(c), 0) from (select count(*) c from e where not demo and name_key is not null group by name_key having count(*) > 1) s
union all select 'mukerrer_firma_ve_eposta_grup (gercek)', count(*) from (select 1 from e where not demo and name_key is not null and email_key is not null group by name_key, email_key having count(*) > 1) s
union all select 'mukerrer_eposta_grup (demo dahil)', count(*) from (select 1 from e where email_key is not null group by email_key having count(*) > 1) s
union all select 'mukerrer_firma_grup (demo dahil)', count(*) from (select 1 from e where name_key is not null group by name_key having count(*) > 1) s;

-- Tablodaki mevcut tekil index / kısıt / trigger / RLS adları (kişisel veri içermez).
select 'index' as tur, indexname as ad, indexdef as tanim from pg_indexes where schemaname = 'public' and tablename = 'employers'
union all select 'kisit', conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.employers'::regclass
union all select 'trigger', tgname, pg_get_triggerdef(oid) from pg_trigger where tgrelid = 'public.employers'::regclass and not tgisinternal
union all select 'rls', policyname, cmd from pg_policies where schemaname = 'public' and tablename = 'employers'
order by 1, 2;
