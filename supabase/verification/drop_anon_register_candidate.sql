-- Doğrulama: 20261127120000_drop_anon_register_candidate.sql (migration SONRASI). Salt okuma.
with checks(no, kontrol, sonuc) as (
  select 1, 'job_candidates üzerinde anon politikası yok',
    case when not exists (select 1 from pg_policies where schemaname = 'public'
                          and tablename = 'job_candidates' and 'anon' = any (roles)) then 'GEÇTİ' else 'KALDI' end
  union all select 2, 'personel ekleme politikası duruyor (staff_insert_candidates)',
    case when exists (select 1 from pg_policies where schemaname = 'public'
                      and tablename = 'job_candidates' and policyname = 'staff_insert_candidates') then 'GEÇTİ' else 'KALDI' end
  union all select 3, 'aday kendi kaydını görebiliyor (cand_self_select duruyor)',
    case when exists (select 1 from pg_policies where schemaname = 'public'
                      and tablename = 'job_candidates' and policyname = 'cand_self_select') then 'GEÇTİ' else 'KALDI' end
  union all select 4, 'link_my_candidate fonksiyonu var',
    case when to_regprocedure('public.link_my_candidate()') is not null then 'GEÇTİ' else 'YAPILAMADI' end
  union all select 5, 'RLS açık',
    case when (select relrowsecurity from pg_class where oid = 'public.job_candidates'::regclass) then 'GEÇTİ' else 'KALDI' end
)
select no::text, kontrol, sonuc from checks
union all
select 'TOPLAM', 'GEÇTİ ' || count(*) filter (where sonuc = 'GEÇTİ') || ' / KALDI ' || count(*) filter (where sonuc = 'KALDI')
       || ' / YAPILAMADI ' || count(*) filter (where sonuc = 'YAPILAMADI'), ''
from checks;
