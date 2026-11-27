-- Geri alma: 20261127160000_candidate_staff_notes.sql. Notlar job_candidates.notes'a geri yazılır.
-- Kod da geri alınmalı (PR revert), yoksa portal yeni tabloyu arar.
begin;
update public.job_candidates c set notes = n.notes
from public.candidate_staff_notes n
where n.candidate_id = c.id and nullif(btrim(n.notes), '') is not null;
drop table if exists public.candidate_staff_notes;
commit;
