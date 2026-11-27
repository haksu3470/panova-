-- ADIM 1 (salt okuma): aday kayıtlarındaki personel notları. Yalnız sayı döner, not metni dönmez.
select count(*) as aday,
       count(*) filter (where nullif(btrim(notes), '') is not null) as notu_olan,
       to_regclass('public.candidate_staff_notes') is null as yeni_tablo_yok,
       to_regclass('backup.job_candidates_notes_20261127') is null as yedek_yok
from public.job_candidates;
