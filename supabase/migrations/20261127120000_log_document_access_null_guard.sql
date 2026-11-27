-- log_document_access: an account that is neither a candidate nor staff
-- (e.g. an employer) got the document's file_url back instead of 'forbidden'.
-- Cause: my_candidate_id() is null for them, so "v_candidate = null" is null,
-- "not (null or false)" is null, and plpgsql skips an IF whose test is null.
-- Fix: the test must be true to pass (coalesce ... false). Nothing else changes.
-- Found by supabase/verification/document_access_scenario.sql (6c), 27.11.2026.
-- Rollback: supabase/rollback/20261127120000_log_document_access_null_guard_rollback.sql
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

  if not coalesce(
    v_candidate = public.my_candidate_id()
    or (public.is_staff() and public.staff_can_read_candidate(v_candidate)),
    false
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

notify pgrst, 'reload schema';
