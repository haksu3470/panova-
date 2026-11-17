-- Rollback of 20261117220000_security_search_path_and_trigger_grants.sql
begin;

alter function public.doc_type_from_json_id(text) reset search_path;
alter function public.country_key(text) reset search_path;
alter function public.names_match(text, text) reset search_path;
alter function public.candidate_file_owner(text) reset search_path;
alter function public.normalize_demand_status(text) reset search_path;
alter function public.phone_key(text) reset search_path;
alter function public.reject_new_data_url() reset search_path;

grant execute on function public.handle_new_auth_user() to public, anon, authenticated;

notify pgrst, 'reload schema';
commit;
