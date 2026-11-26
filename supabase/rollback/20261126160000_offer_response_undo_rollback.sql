-- Rollback of 20261126160000_offer_response_undo.sql
-- Revert the app code first (it calls undo_offer_response). Answers already
-- taken back stay pending; their audit_logs rows stay.
begin;

drop function if exists public.undo_offer_response(uuid);

-- guard_candidate_offer_response as it was before (without the panova.offer_undo bypass)
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

commit;
