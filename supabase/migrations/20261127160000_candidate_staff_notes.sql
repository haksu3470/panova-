-- Personel notu (job_candidates.notes) adayın kendi kaydında görünüyordu:
-- aday kendi satırını select('*') ile okuyor ve RLS sütun ayırmıyor.
-- Çözüm: notlar ayrı tabloda (candidate_staff_notes), yalnız adayı görebilen personel okur/yazar
-- (candidate_notifications ile aynı politika). Eski sütun boşaltılır, sütun kalır.
-- Yedek: backup.job_candidates_notes_20261127 (id, notes).
-- Sıra: supabase/verification/candidate_staff_notes_readonly.sql -> bu dosya
--       -> supabase/verification/candidate_staff_notes.sql
-- Geri alma: supabase/rollback/20261127160000_candidate_staff_notes_rollback.sql
begin;

create table if not exists backup.job_candidates_notes_20261127 as
select id, notes, now() as saved_at
from public.job_candidates
where nullif(btrim(notes), '') is not null;
alter table backup.job_candidates_notes_20261127 enable row level security;

create table if not exists public.candidate_staff_notes (
  candidate_id uuid primary key references public.job_candidates(id) on delete cascade,
  notes text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);
alter table public.candidate_staff_notes enable row level security;
revoke all on table public.candidate_staff_notes from anon;

drop policy if exists staff_select_staff_notes on public.candidate_staff_notes;
create policy staff_select_staff_notes on public.candidate_staff_notes
  for select to authenticated
  using (public.is_staff() and public.staff_can_read_candidate(candidate_id));
drop policy if exists staff_write_staff_notes on public.candidate_staff_notes;
create policy staff_write_staff_notes on public.candidate_staff_notes
  for all to authenticated
  using (public.is_staff() and public.staff_can_read_candidate(candidate_id))
  with check (public.is_staff() and public.staff_can_read_candidate(candidate_id));

insert into public.candidate_staff_notes (candidate_id, notes, updated_by)
select id, notes, null from backup.job_candidates_notes_20261127
on conflict (candidate_id) do nothing;

update public.job_candidates set notes = null
where nullif(btrim(notes), '') is not null;

commit;
