-- Doğrulama: 20261127160000_candidate_staff_notes.sql (migration SONRASI). Salt okuma.
with s as (
  select 1 as no, 'yeni tablo var, RLS açık' as kontrol,
    case when (select relrowsecurity from pg_class where oid = to_regclass('public.candidate_staff_notes')) then 'GEÇTİ' else 'KALDI' end as sonuc
  union all select 2, 'yedekteki her not yeni tabloda aynen var',
    case when not exists (
      select 1 from backup.job_candidates_notes_20261127 b
      left join public.candidate_staff_notes n on n.candidate_id = b.id
      where n.notes is distinct from b.notes) then 'GEÇTİ' else 'KALDI' end
  union all select 3, 'job_candidates.notes boşaltıldı',
    case when not exists (select 1 from public.job_candidates where nullif(btrim(notes), '') is not null) then 'GEÇTİ' else 'KALDI' end
  union all select 4, 'anon yeni tabloyu okuyamaz',
    case when not has_table_privilege('anon', 'public.candidate_staff_notes', 'select') then 'GEÇTİ' else 'KALDI' end
  union all select 5, 'politikalar is_staff + staff_can_read_candidate',
    case when (select count(*) from pg_policies where tablename = 'candidate_staff_notes'
               and qual like '%is_staff()%' and qual like '%staff_can_read_candidate%') = 2 then 'GEÇTİ' else 'KALDI' end
)
select no::text, kontrol, sonuc from s
union all
select 'TOPLAM', 'GEÇTİ ' || count(*) filter (where sonuc = 'GEÇTİ') || ' / KALDI ' || count(*) filter (where sonuc = 'KALDI'), '' from s
order by 1;
