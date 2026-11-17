-- Read-only checks after 20261117220000.
select p.proname,
       p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'doc_type_from_json_id','country_key','names_match','candidate_file_owner',
    'normalize_demand_status','phone_key','reject_new_data_url','handle_new_auth_user'
  )
order by 1;

select grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public' and routine_name = 'handle_new_auth_user'
order by 1;
