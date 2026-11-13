begin;

do $$
declare
  bad_count integer;
begin
  select count(*) into bad_count
  from public.candidate_documents
  where status in ('approved', 'reviewing')
    and (file_url is null or btrim(file_url) = '');

  if bad_count > 0 then
    raise exception 'Kuraldisi % satir var. Hicbir sey degistirilmedi.', bad_count;
  end if;
end
$$;

alter table public.candidate_documents drop constraint if exists candidate_documents_review_needs_file;

alter table public.candidate_documents add constraint candidate_documents_review_needs_file
  check (status not in ('approved', 'reviewing') or (file_url is not null and btrim(file_url) <> ''));

notify pgrst, 'reload schema';

commit;
