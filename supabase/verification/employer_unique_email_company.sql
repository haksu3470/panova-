-- Doğrulama: 20261127100000_employer_unique_email_company.sql (migration SONRASI çalıştırın).
-- Salt okuma; tablo değiştirmez. Her satır GEÇTİ / KALDI / YAPILAMADI, en sonda toplam.
with checks(no, kontrol, sonuc) as (
  select 1, 'yedek tablo var',
    case when to_regclass('public.employers_backup_20261127') is not null then 'GEÇTİ' else 'KALDI' end
  union all select 2, 'yedek tabloya anon/authenticated erişemez',
    case when to_regclass('public.employers_backup_20261127') is null then 'YAPILAMADI'
         when not has_table_privilege('anon', 'public.employers_backup_20261127', 'select')
          and not has_table_privilege('authenticated', 'public.employers_backup_20261127', 'select') then 'GEÇTİ' else 'KALDI' end
  union all select 3, 'e-posta tekil index (unique) var',
    case when exists (select 1 from pg_index i join pg_class c on c.oid = i.indexrelid
                      where c.relname = 'employers_email_ci_unique' and i.indisunique and i.indisvalid) then 'GEÇTİ' else 'KALDI' end
  union all select 4, 'firma adı tekil index (unique) var',
    case when exists (select 1 from pg_index i join pg_class c on c.oid = i.indexrelid
                      where c.relname = 'employers_company_key_unique' and i.indisunique and i.indisvalid) then 'GEÇTİ' else 'KALDI' end
  union all select 5, 'employer_name_key normalize ediyor',
    case when to_regprocedure('public.employer_name_key(text)') is null then 'YAPILAMADI'
         when public.employer_name_key('  ABC İnşaat Ltd. Şti. ') = public.employer_name_key('abc insaat ltd sti')
          and public.employer_name_key(' .- ') is null then 'GEÇTİ' else 'KALDI' end
  union all select 6, 'employer_signup_conflict: anon çalıştırabilir, security definer',
    case when to_regprocedure('public.employer_signup_conflict(text,text)') is null then 'YAPILAMADI'
         when has_function_privilege('anon', 'public.employer_signup_conflict(text,text)', 'execute')
          and (select prosecdef from pg_proc where oid = 'public.employer_signup_conflict(text,text)'::regprocedure) then 'GEÇTİ' else 'KALDI' end
  union all select 7, 'employer_signup_conflict: olmayan firma/e-posta için null',
    case when to_regprocedure('public.employer_signup_conflict(text,text)') is null then 'YAPILAMADI'
         when public.employer_signup_conflict('yok-' || gen_random_uuid() || '@example.invalid', 'Yok ' || gen_random_uuid()) is null then 'GEÇTİ' else 'KALDI' end
  union all select 8, 'employer_signup_conflict: mevcut gerçek firma için company (büyük harf + noktalama ile)',
    case when to_regprocedure('public.employer_signup_conflict(text,text)') is null then 'YAPILAMADI'
         when not exists (select 1 from public.employers where not is_demo and public.employer_name_key(company_name) is not null) then 'YAPILAMADI'
         when public.employer_signup_conflict('yok-' || gen_random_uuid() || '@example.invalid',
                (select upper(company_name) || ' .' from public.employers
                 where not is_demo and public.employer_name_key(company_name) is not null limit 1)) = 'company' then 'GEÇTİ' else 'KALDI' end
  union all select 9, 'mükerrer e-posta grubu 0 (gerçek)',
    case when (select count(*) from (select 1 from public.employers where not is_demo and nullif(btrim(email), '') is not null
               group by lower(btrim(email)) having count(*) > 1) s) = 0 then 'GEÇTİ' else 'KALDI' end
  union all select 10, 'mükerrer firma grubu 0 (gerçek)',
    case when to_regprocedure('public.employer_name_key(text)') is null then 'YAPILAMADI'
         when (select count(*) from (select 1 from public.employers where not is_demo and public.employer_name_key(company_name) is not null
               group by public.employer_name_key(company_name) having count(*) > 1) s) = 0 then 'GEÇTİ' else 'KALDI' end
  union all select 11, 'satır sayısı yedekle aynı (migration satır silmedi/eklemedi)',
    case when to_regclass('public.employers_backup_20261127') is null then 'YAPILAMADI'
         when (select count(*) from public.employers)
              = (xpath('/row/c/text()', query_to_xml('select count(*) as c from public.employers_backup_20261127', false, true, '')))[1]::text::int
         then 'GEÇTİ' else 'KALDI' end
)
select * from (
select no::text as no, kontrol, sonuc from checks
union all
select 'TOPLAM', 'GEÇTİ ' || count(*) filter (where sonuc = 'GEÇTİ') || ' / KALDI ' || count(*) filter (where sonuc = 'KALDI')
       || ' / YAPILAMADI ' || count(*) filter (where sonuc = 'YAPILAMADI'), ''
from checks
) r
order by no = 'TOPLAM', length(no), no;
