-- Taking back an answer to a job offer (accepted / rejected -> pending).
--
-- public.undo_offer_response(p_offer_id):
--   * staff who may write offers (upper_management, source_country,
--     target_country) and can read the candidate: any time;
--   * the candidate: within 48 hours of answering, and only while the
--     official process has not reached the work permit application.
--   Clears responded_at, recomputes the automatic candidate status
--   (candidate_status_for: an accepted offer only matters at visa_applied),
--   and writes an audit_logs row.
-- guard_candidate_offer_response: unchanged, except that it lets this
-- function's own update through (transaction-local panova.offer_undo).
-- Same rule in lib/offerUndo.ts.
--
-- One transaction, idempotent.
-- Rollback: supabase/rollback/20261126160000_offer_response_undo_rollback.sql

begin;

create or replace function public.guard_candidate_offer_response()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if public.is_staff() then
    return new;
  end if;
  -- Set only inside public.undo_offer_response (security definer); not reachable from the API.
  if coalesce(current_setting('panova.offer_undo', true), '') = 'on' then
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

create or replace function public.undo_offer_response(p_offer_id uuid)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare
  o public.job_offers;
  c public.job_candidates;
  v_staff boolean;
  v_actor text;
  v_status text;
begin
  select * into o from public.job_offers where id = p_offer_id for update;
  if not found then
    raise exception 'offer_not_found' using errcode = 'P0002';
  end if;
  if o.status not in ('accepted', 'rejected') then
    raise exception 'offer_not_answered' using errcode = '22023';
  end if;
  select * into c from public.job_candidates where id = o.candidate_id;

  v_staff := public.is_staff()
    and public.staff_can_read_candidate(o.candidate_id)
    and exists (
      select 1 from public.current_staff() me
      where lower(me.role_level) in ('upper_management', 'source_country', 'target_country')
    );

  if v_staff then
    select me.staff_name into v_actor from public.current_staff() me limit 1;
  else
    if o.candidate_id is distinct from public.my_candidate_id() or not public.email_access_ok() then
      raise exception 'offer_undo_forbidden' using errcode = '42501';
    end if;
    if o.responded_at is null or o.responded_at < now() - interval '48 hours' then
      raise exception 'offer_undo_expired' using errcode = '42501';
    end if;
    if coalesce(c.official_process_status, 'not_started') in (
      'work_permit_applied', 'work_permit_approved', 'visa_applied', 'visa_approved', 'ready_to_travel', 'started_work'
    ) then
      raise exception 'offer_undo_process_started' using errcode = '42501';
    end if;
    v_actor := c.full_name;
  end if;

  perform set_config('panova.offer_undo', 'on', true);
  update public.job_offers set status = 'pending', responded_at = null where id = o.id;
  perform set_config('panova.offer_undo', '', true);

  -- An accepted offer only changes the automatic status at visa_applied (staff path only).
  v_status := public.candidate_status_for(c.official_process_status, c.id, c.status);
  if v_status is distinct from c.status then
    perform set_config('panova.candidate_status_mode', 'manual', true);
    update public.job_candidates set status = v_status where id = c.id;
    perform set_config('panova.candidate_status_mode', '', true);
  end if;

  insert into public.audit_logs (actor_user_id, actor_name, action, entity_type, entity_id, details, is_demo)
  values (
    auth.uid(),
    v_actor,
    format('Teklif yanıtı geri alındı (%s → bekliyor): %s · %s', o.status, c.full_name, o.employer_name),
    'job_offer',
    o.id,
    jsonb_build_object('previous_status', o.status, 'candidate_id', o.candidate_id, 'by', case when v_staff then 'staff' else 'candidate' end),
    coalesce(o.is_demo, false)
  );
  return 'pending';
end;
$$;

revoke all on function public.undo_offer_response(uuid) from public, anon;
grant execute on function public.undo_offer_response(uuid) to authenticated;

commit;
