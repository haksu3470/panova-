-- Scenario for 20261126120000_process_metrics.sql. Run in the SQL editor;
-- everything is rolled back. Acts as the first staff profile (auth.uid()).
-- Raises an exception on the first wrong value; ends with notice 'process_metrics scenario OK'.
begin;

select set_config('request.jwt.claims',
  json_build_object('sub', (select id from public.profiles where role = 'staff' limit 1), 'role', 'authenticated')::text, true);

do $$
declare
  c1 uuid; c2 uuid; c3 uuid;
  r record;
  got jsonb := '{}';
begin
  insert into public.job_candidates (full_name, nationality, phone, sector, profession, is_demo)
    values ('SCENARIO 1', 'Bangladesh', '+88000000001', 'construction', 'welder', true) returning id into c1;
  insert into public.job_candidates (full_name, nationality, phone, sector, profession, is_demo)
    values ('SCENARIO 2', 'Bangladesh', '+88000000002', 'construction', 'welder', true) returning id into c2;
  insert into public.job_candidates (full_name, nationality, phone, sector, profession, is_demo)
    values ('SCENARIO 3', 'Bangladesh', '+88000000003', 'construction', 'welder', true) returning id into c3;

  -- c1: permit -> visa applied -> visa approved -> started work
  update public.job_candidates set official_process_status = 'work_permit_applied' where id = c1;
  update public.job_candidates set official_process_status = 'visa_applied' where id = c1;
  update public.job_candidates set official_process_status = 'visa_approved' where id = c1;
  update public.job_candidates set official_process_status = 'started_work' where id = c1;
  -- c2: visa applied -> rejected (a visa rejection)
  update public.job_candidates set official_process_status = 'visa_applied' where id = c2;
  update public.job_candidates set official_process_status = 'rejected' where id = c2;
  -- c3: started work 13 months ago, left after 5 months
  update public.job_candidates set official_process_status = 'started_work' where id = c3;
  update public.job_candidates set employment_ended_on = (now() - interval '8 months')::date,
                                   employment_end_reason = 'absconded' where id = c3;

  update public.candidate_process_history set changed_at = now() - interval '200 days'
    where candidate_id = c1 and to_status = 'work_permit_applied';
  update public.candidate_process_history set changed_at = now() - interval '170 days'
    where candidate_id = c1 and to_status = 'visa_approved';
  update public.candidate_process_history set changed_at = now() - interval '7 months'
    where candidate_id = c1 and to_status = 'started_work';
  update public.candidate_process_history set changed_at = now() - interval '13 months'
    where candidate_id = c3 and to_status = 'started_work';

  if (select count(*) from public.candidate_process_history where candidate_id in (c1, c2, c3)) <> 7 then
    raise exception 'history rows: expected 7';
  end if;

  for r in
    select m.metric, m.value, m.sample from public.staff_process_metrics(true) m
  loop
    got := got || jsonb_build_object(r.metric, jsonb_build_array(r.value, r.sample));
  end loop;

  -- Other demo rows may exist, so only check when this scenario is the whole cohort.
  if (select count(*) from public.candidate_process_history h
      where h.candidate_id not in (c1, c2, c3)) = 0 then
    if got->'days_permit_to_visa_median' <> '[30.0, 1]' then raise exception 'days: %', got; end if;
    if got->'visa_approval_rate' <> '[50.0, 2]' then raise exception 'visa rate: %', got; end if;
    if got->'retention_3m' <> '[100.0, 2]' then raise exception 'retention 3m: %', got; end if;
    if got->'retention_6m' <> '[50.0, 2]' then raise exception 'retention 6m: %', got; end if;
    if got->'retention_12m' <> '[0.0, 1]' then raise exception 'retention 12m: %', got; end if;
  end if;

  -- Bad end reason is refused.
  begin
    update public.job_candidates set employment_ended_on = current_date, employment_end_reason = 'x' where id = c2;
    raise exception 'bad end reason accepted';
  exception when check_violation then null;
  end;

  raise notice 'process_metrics scenario OK %', got;
end $$;

rollback;
