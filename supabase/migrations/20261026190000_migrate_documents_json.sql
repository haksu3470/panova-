-- documents_json -> candidate_documents (idempotent). Kaynak satır işareti: notes = 'json:<id>'
create or replace function public.doc_type_from_json_id(p text) returns text
language sql immutable as $$
  select case p when '1' then 'passport' when '2' then 'certificate' when '3' then 'criminal_record'
                when '4' then 'health_report' when '5' then 'apostille' else 'other' end $$;

insert into public.candidate_documents (candidate_id, doc_type, file_url, status, notes, uploaded_at, is_demo)
select c.id,
       public.doc_type_from_json_id(d->>'id'),
       d->>'file_url',
       case when d->>'status' in ('pending','uploaded','reviewing','approved','rejected','rerequested','expiring','expired')
            then d->>'status' else 'pending' end,
       'json:' || coalesce(d->>'id','?') || coalesce(' ' || nullif(d->>'file_name',''), ''),
       case when d ? 'file_url' then now() end,
       c.is_demo
from public.job_candidates c
cross join lateral jsonb_array_elements(
  case when jsonb_typeof(c.documents_json::jsonb) = 'array' then c.documents_json::jsonb
       else coalesce(c.documents_json::jsonb -> 'docs', '[]'::jsonb) end) d
where c.documents_json ~ '^\s*[\[{]'
  and (d ? 'file_url' or d->>'status' <> 'pending')
  and not exists (
    select 1 from public.candidate_documents x
    where x.candidate_id = c.id and x.notes like 'json:' || coalesce(d->>'id','?') || '%');

-- Aday kendi belgesini yükleyebilsin (sadece pending/uploaded durumunda, onay personelde)
drop policy if exists cand_docs_insert on public.candidate_documents;
create policy cand_docs_insert on public.candidate_documents for insert to authenticated
  with check (candidate_id = public.my_candidate_id() and status in ('pending','uploaded') and is_demo = false);
drop policy if exists cand_docs_update on public.candidate_documents;
create policy cand_docs_update on public.candidate_documents for update to authenticated
  using (candidate_id = public.my_candidate_id() and status in ('pending','uploaded','rerequested','rejected'))
  with check (candidate_id = public.my_candidate_id() and status in ('pending','uploaded'));

-- Eski şifre kolonları: kod okumuyor; silmek yerine soft-deprecate
comment on column public.job_candidates.password is 'DEPRECATED: Supabase Auth kullanılır; silinecek';
comment on column public.employers.password is 'DEPRECATED: Supabase Auth kullanılır; silinecek';
comment on column public.staff_members.password is 'DEPRECATED: Supabase Auth kullanılır; silinecek';
comment on column public.portal_users.password_hash is 'DEPRECATED: Supabase Auth kullanılır; silinecek';
