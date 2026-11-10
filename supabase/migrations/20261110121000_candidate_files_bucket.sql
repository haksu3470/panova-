-- Private bucket for candidate photos and documents.
-- Existing candidate_documents.file_url values may still be data URLs.
-- New uploads should store storage:candidate-files/<candidate_id>/<slot>/<uuid>.<ext>
-- and the app keeps displaying a legacy data URL until that row is replaced.
-- This migration does not read or rewrite those rows.
-- Bucket limits: pdf, jpeg, png, 8 MB. The app also caps photos at 2 MB.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-files',
  'candidate-files',
  false,
  8388608,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.candidate_file_owner(p_name text)
returns uuid
language plpgsql
stable
as $$
declare
  folder text := split_part(coalesce(p_name, ''), '/', 1);
begin
  if folder ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return folder::uuid;
  end if;
  return null;
exception
  when others then
    return null;
end;
$$;

create or replace function public.can_access_candidate_file(p_name text)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select public.candidate_file_owner(p_name) is not null
    and (
      public.candidate_file_owner(p_name) = public.my_candidate_id()
      or (
        public.is_staff()
        and public.staff_can_read_candidate(public.candidate_file_owner(p_name))
      )
    );
$$;

revoke all on function public.candidate_file_owner(text) from public, anon;
revoke all on function public.can_access_candidate_file(text) from public, anon;
grant execute on function public.candidate_file_owner(text) to authenticated;
grant execute on function public.can_access_candidate_file(text) to authenticated;

drop policy if exists candidate_files_select on storage.objects;
drop policy if exists candidate_files_insert on storage.objects;
drop policy if exists candidate_files_update on storage.objects;
drop policy if exists candidate_files_delete on storage.objects;

create policy candidate_files_select on storage.objects
  for select to authenticated
  using (bucket_id = 'candidate-files' and public.can_access_candidate_file(name));

create policy candidate_files_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'candidate-files' and public.can_access_candidate_file(name));

create policy candidate_files_update on storage.objects
  for update to authenticated
  using (bucket_id = 'candidate-files' and public.can_access_candidate_file(name))
  with check (bucket_id = 'candidate-files' and public.can_access_candidate_file(name));

create policy candidate_files_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'candidate-files'
    and public.candidate_file_owner(name) is not null
    and (
      public.candidate_file_owner(name) = public.my_candidate_id()
      or public.is_portal_manager()
    )
  );

create or replace function public.log_document_access(p_document_id uuid)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_url text;
  v_candidate uuid;
  v_type text;
  v_name text;
begin
  select d.file_url, d.candidate_id, d.doc_type
    into v_url, v_candidate, v_type
  from public.candidate_documents d
  where d.id = p_document_id;

  if v_candidate is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  if not (
    v_candidate = public.my_candidate_id()
    or (public.is_staff() and public.staff_can_read_candidate(v_candidate))
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if public.is_staff() then
    select me.staff_name into v_name from public.current_staff() me;
    insert into public.audit_logs (actor_user_id, actor_name, action, entity_type, entity_id, details)
    values (
      auth.uid(),
      v_name,
      'Belge görüntülendi',
      'candidate_document',
      p_document_id,
      jsonb_build_object('candidate_id', v_candidate, 'doc_type', v_type)
    );
  end if;

  return v_url;
end;
$$;

revoke all on function public.log_document_access(uuid) from public, anon;
grant execute on function public.log_document_access(uuid) to authenticated;

comment on column public.candidate_documents.file_url is
  'Legacy rows may contain a data URL. New files use storage:candidate-files/<candidate_id>/<slot>/<file>. Replace a legacy row by uploading the bytes to the private candidate-files bucket and saving that storage URL. This migration does not rewrite existing URLs.';

notify pgrst, 'reload schema';
