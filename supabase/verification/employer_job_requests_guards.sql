-- Read-only checks after 20261117200000. Do not change data.
-- Expect: city/contract/language checks require non-blank; employer policies use email_access_ok.

select conname, pg_get_constraintdef(oid) as def
from pg_constraint
where conrelid = 'public.job_requests'::regclass
  and conname in (
    'job_requests_city_nonblank',
    'job_requests_contract_type_nonblank',
    'job_requests_required_language_nonblank',
    'job_requests_headcount_range',
    'job_requests_salary_range'
  )
order by conname;

select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'job_requests'
  and policyname in ('emp_requests_select', 'emp_requests_insert', 'emp_requests_update')
order by policyname;

-- Should be zero after the migration.
select count(*)::int as blank_language
from public.job_requests
where required_language is null or btrim(required_language) = '';
