-- Employer job_requests RLS (repo record of live policies) + tighter checks.
-- city / contract_type / required_language must be non-blank (form already requires them).
-- One demo row had null required_language; it is filled before the check is added.
-- Rollback: supabase/rollback/20261117200000_employer_job_requests_rls_and_checks_rollback.sql
begin;

do $$
declare
  bad_count integer;
begin
  if to_regprocedure('public.my_employer_id()') is null
     or to_regprocedure('public.email_access_ok()') is null then
    raise exception 'my_employer_id() or email_access_ok() missing. Nothing was changed.';
  end if;

  -- Demo placeholder so the language check can be added.
  update public.job_requests
  set required_language = '—'
  where is_demo is true
    and (required_language is null or btrim(required_language) = '');

  select count(*) into bad_count
  from public.job_requests r
  where r.city is null or btrim(r.city) = ''
     or r.contract_type is null or btrim(r.contract_type) = ''
     or r.required_language is null or btrim(r.required_language) = '';

  if bad_count > 0 then
    raise exception 'job_requests: % kayit sehir/sure/dil kuralina uymuyor. Hicbir sey degistirilmedi.', bad_count;
  end if;
end $$;

alter table public.job_requests drop constraint if exists job_requests_city_nonblank;
alter table public.job_requests add constraint job_requests_city_nonblank
  check (city is not null and btrim(city) <> '');

alter table public.job_requests drop constraint if exists job_requests_contract_type_nonblank;
alter table public.job_requests add constraint job_requests_contract_type_nonblank
  check (contract_type is not null and btrim(contract_type) <> '');

alter table public.job_requests drop constraint if exists job_requests_required_language_nonblank;
alter table public.job_requests add constraint job_requests_required_language_nonblank
  check (required_language is not null and btrim(required_language) <> '');

-- Employer SELECT / INSERT / UPDATE: own employer_id + confirmed email.
drop policy if exists emp_requests_select on public.job_requests;
create policy emp_requests_select on public.job_requests
  for select to authenticated
  using (employer_id = public.my_employer_id() and public.email_access_ok());

drop policy if exists emp_requests_insert on public.job_requests;
create policy emp_requests_insert on public.job_requests
  for insert to authenticated
  with check (employer_id = public.my_employer_id() and public.email_access_ok());

drop policy if exists emp_requests_update on public.job_requests;
create policy emp_requests_update on public.job_requests
  for update to authenticated
  using (employer_id = public.my_employer_id() and public.email_access_ok())
  with check (employer_id = public.my_employer_id() and public.email_access_ok());

notify pgrst, 'reload schema';
commit;
