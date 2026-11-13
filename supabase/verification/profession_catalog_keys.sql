-- A) BEFORE applying: what would change (read-only dry run).
with map(kind, old_value, new_value) as (values
  ('candidate', 'cook', 'cook'),
  ('candidate', 'electrician', 'electrician'),
  ('candidate', 'elektrikçi', 'electrician'),
  ('candidate', 'farm worker', 'farm_worker'),
  ('candidate', 'machine operator', 'machine_operator'),
  ('candidate', 'truck driver', 'truck_driver'),
  ('request', 'cook', 'cook'),
  ('request', 'electrician', 'electrician'),
  ('request', 'elektrikçi', 'electrician')
)
select 'aday' as tur, c.profession::text as eski, m.new_value as yeni, count(*) as adet
from public.job_candidates c
join map m on m.kind = 'candidate' and lower(btrim(c.profession::text)) = m.old_value
where c.profession::text is distinct from m.new_value
group by 1, 2, 3
union all
select 'talep', r.position_title::text, m.new_value, count(*)
from public.job_requests r
join map m on m.kind = 'request' and lower(btrim(r.position_title::text)) = m.old_value
where r.position_title::text is distinct from m.new_value
group by 1, 2, 3
order by 1, 2;

-- B) AFTER applying: values still in use, and the backup rows.
select kaynak, deger, adet, katalog_anahtari_gibi from (
  select 'job_candidates.profession' as kaynak,
         coalesce(nullif(btrim(c.profession::text), ''), '(boş)') as deger,
         count(*) as adet,
         coalesce(nullif(btrim(c.profession::text), ''), '(boş)') ~ '^[a-z]+(_[a-z]+)*$' as katalog_anahtari_gibi
  from public.job_candidates c group by 2
  union all
  select 'job_requests.position_title',
         coalesce(nullif(btrim(r.position_title::text), ''), '(boş)'),
         count(*),
         coalesce(nullif(btrim(r.position_title::text), ''), '(boş)') ~ '^[a-z]+(_[a-z]+)*(, ?[a-z]+(_[a-z]+)*)*$'
  from public.job_requests r group by 2
  union all
  select 'yedek:' || b.table_name, b.old_value || ' -> ' || b.new_value, count(*), true
  from public.profession_key_backup b group by b.table_name, b.old_value, b.new_value
) x
order by kaynak, adet desc, deger;
