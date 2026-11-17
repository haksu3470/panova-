-- Security harden: pin search_path on helper/trigger functions; revoke
-- public RPC access to handle_new_auth_user (no-op stub, no trigger; was
-- callable by anon via /rest/v1/rpc).
-- Rollback: supabase/rollback/20261117220000_security_search_path_and_trigger_grants_rollback.sql
begin;

alter function public.doc_type_from_json_id(text) set search_path to '';
alter function public.country_key(text) set search_path to '';
alter function public.names_match(text, text) set search_path to '';
alter function public.candidate_file_owner(text) set search_path to '';
alter function public.normalize_demand_status(text) set search_path to '';
alter function public.phone_key(text) set search_path to '';
alter function public.reject_new_data_url() set search_path to '';

-- Trigger-only / unused stub: do not expose via PostgREST.
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
-- Keep for postgres / service_role in case a trigger is reattached later.
grant execute on function public.handle_new_auth_user() to postgres, service_role;

notify pgrst, 'reload schema';
commit;
