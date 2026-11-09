-- Candidate offer responses, employer read of those offers, and
-- upper-management delete. Do not apply this file from CI; review it first.
--
-- my_candidate_id() and my_employer_id() already exist on the hosted database.
-- They are created here as well so a fresh replay of this migration still works.

create or replace function public.my_candidate_id()
returns uuid
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce(
    (select p.linked_candidate_id from public.profiles p where p.id = auth.uid() and p.role = 'candidate'),
    (select c.id from public.job_candidates c where c.auth_user_id = auth.uid() limit 1)
  );
$$;

create or replace function public.my_employer_id()
returns uuid
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce(
    (select p.linked_employer_id from public.profiles p where p.id = auth.uid() and p.role = 'employer'),
    (select e.id from public.employers e where e.auth_user_id = auth.uid() limit 1)
  );
$$;

revoke all on function public.my_candidate_id() from public, anon;
revoke all on function public.my_employer_id() from public, anon;
grant execute on function public.my_candidate_id() to authenticated;
grant execute on function public.my_employer_id() to authenticated;

-- A candidate may only move their own pending offer to accepted or rejected.
-- Salary, employer, and other columns stay as staff wrote them.
create or replace function public.guard_candidate_offer_response()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if public.is_staff() then
    return new;
  end if;
  if old.status is distinct from 'pending' then
    raise exception 'offer_not_pending';
  end if;
  if new.status not in ('accepted', 'rejected') then
    raise exception 'offer_status_invalid';
  end if;
  if new.candidate_id is distinct from old.candidate_id
     or new.employer_id is distinct from old.employer_id
     or new.request_id is distinct from old.request_id
     or new.employer_name is distinct from old.employer_name
     or new.position_title is distinct from old.position_title
     or new.monthly_net_salary is distinct from old.monthly_net_salary
     or new.start_date is distinct from old.start_date
     or new.terms_details is distinct from old.terms_details
     or new.offer_terms is distinct from old.offer_terms
     or new.is_demo is distinct from old.is_demo
  then
    raise exception 'offer_fields_locked';
  end if;
  new.responded_at := now();
  return new;
end;
$$;

revoke all on function public.guard_candidate_offer_response() from public, anon, authenticated;

drop trigger if exists job_offers_guard_candidate_response on public.job_offers;
create trigger job_offers_guard_candidate_response
  before update on public.job_offers
  for each row
  execute function public.guard_candidate_offer_response();

drop policy if exists cand_offers_update on public.job_offers;
create policy cand_offers_update on public.job_offers
  for update to authenticated
  using (
    candidate_id = public.my_candidate_id()
    and status = 'pending'
    and public.email_access_ok()
  )
  with check (
    candidate_id = public.my_candidate_id()
    and status in ('accepted', 'rejected')
    and public.email_access_ok()
  );

drop policy if exists emp_offers_select on public.job_offers;
create policy emp_offers_select on public.job_offers
  for select to authenticated
  using (employer_id = public.my_employer_id() and public.email_access_ok());

-- staff_all was FOR ALL, so every staff role could delete these rows.
-- Select, insert, and update stay with staff. Delete is upper management only.
drop policy if exists staff_all on public.job_offers;
create policy staff_select_offers on public.job_offers
  for select to authenticated using (public.is_staff());
create policy staff_insert_offers on public.job_offers
  for insert to authenticated with check (public.is_staff());
create policy staff_update_offers on public.job_offers
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy upper_delete_offers on public.job_offers
  for delete to authenticated using (public.is_portal_manager());

drop policy if exists staff_all on public.employers;
create policy staff_select_employers on public.employers
  for select to authenticated using (public.is_staff());
create policy staff_insert_employers on public.employers
  for insert to authenticated with check (public.is_staff());
create policy staff_update_employers on public.employers
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy upper_delete_employers on public.employers
  for delete to authenticated using (public.is_portal_manager());

drop policy if exists staff_all on public.job_requests;
create policy staff_select_requests on public.job_requests
  for select to authenticated using (public.is_staff());
create policy staff_insert_requests on public.job_requests
  for insert to authenticated with check (public.is_staff());
create policy staff_update_requests on public.job_requests
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy upper_delete_requests on public.job_requests
  for delete to authenticated using (public.is_portal_manager());

drop policy if exists staff_all on public.candidate_documents;
create policy staff_select_documents on public.candidate_documents
  for select to authenticated using (public.is_staff());
create policy staff_insert_documents on public.candidate_documents
  for insert to authenticated with check (public.is_staff());
create policy staff_update_documents on public.candidate_documents
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy upper_delete_documents on public.candidate_documents
  for delete to authenticated using (public.is_portal_manager());

-- Coded candidates stay protected from officers. Upper management may delete any candidate.
drop policy if exists upper_delete_candidates on public.job_candidates;
create policy upper_delete_candidates on public.job_candidates
  for delete to authenticated
  using (public.is_portal_manager());

notify pgrst, 'reload schema';
