-- İşveren görüşmeleri: yalnızca kendi görüşmelerini okuyabilir; ekleme SECURITY DEFINER RPC ile,
-- sadece kendi talebine bağlı (request_matches) adaylar için.
drop policy if exists employer_select_own on public.interviews;
create policy employer_select_own on public.interviews
  for select to authenticated
  using (employer_id is not null and employer_id = public.my_employer_id());

create or replace function public.employer_request_interview(
  p_candidate_id uuid,
  p_request_id uuid default null,
  p_scheduled_at timestamptz default null,
  p_notes text default null
) returns uuid
language plpgsql security definer set search_path to ''
as $$
declare
  v_emp uuid := public.my_employer_id();
  v_req uuid;
  v_demo boolean;
  v_id uuid;
begin
  if v_emp is null then
    raise exception 'not_linked_employer' using errcode = '42501';
  end if;

  select m.request_id, (m.is_demo or r.is_demo)
    into v_req, v_demo
  from public.request_matches m
  join public.job_requests r on r.id = m.request_id
  where m.candidate_id = p_candidate_id
    and r.employer_id = v_emp
    and (p_request_id is null or m.request_id = p_request_id)
  order by m.presented_at desc nulls last, m.created_at desc
  limit 1;

  if v_req is null then
    raise exception 'candidate_not_presented_to_employer' using errcode = '42501';
  end if;

  insert into public.interviews (request_id, candidate_id, employer_id, scheduled_at, status, panova_notes, is_demo)
  values (v_req, p_candidate_id, v_emp,
          coalesce(p_scheduled_at, now() + interval '3 days'),
          'scheduled', left(coalesce(p_notes, 'İşveren portalından görüşme talebi'), 1000), coalesce(v_demo, false))
  returning id into v_id;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, details, is_demo)
  values (auth.uid(), 'İşveren görüşme talebi oluşturdu', 'interview', v_id,
          jsonb_build_object('employer_id', v_emp, 'request_id', v_req, 'candidate_id', p_candidate_id), coalesce(v_demo, false));
  return v_id;
end $$;

revoke all on function public.employer_request_interview(uuid, uuid, timestamptz, text) from public, anon;
grant execute on function public.employer_request_interview(uuid, uuid, timestamptz, text) to authenticated;
