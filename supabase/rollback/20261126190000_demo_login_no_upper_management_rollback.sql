-- Rollback of 20261126190000_demo_login_no_upper_management.sql: prepare_demo_login as in 20261126180000.
begin;

create or replace function public.prepare_demo_login(p_kind text, p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_actor text;
  v_name text;
  v_user uuid;
  v_email text;
  v_path text;
begin
  if not (public.is_staff() and public.is_upper_management()) then
    raise exception 'demo_login_forbidden' using errcode = '42501';
  end if;

  if p_kind = 'candidate' then
    select c.full_name, c.auth_user_id, nullif(btrim(c.email), '') into v_name, v_user, v_email
    from public.job_candidates c where c.id = p_id and coalesce(c.is_demo, false);
    v_path := '/candidate';
  elsif p_kind = 'employer' then
    select e.company_name, e.auth_user_id into v_name, v_user
    from public.employers e where e.id = p_id and coalesce(e.is_demo, false);
    v_path := '/employer';
  elsif p_kind = 'staff' then
    select s.name, s.auth_user_id, nullif(btrim(s.email), '') into v_name, v_user, v_email
    from public.staff_members s where s.id = p_id and s.is_test_account and coalesce(s.is_active, true);
    v_path := '/portal';
  else
    raise exception 'demo_login_kind_invalid' using errcode = '22023';
  end if;

  if v_name is null then
    raise exception 'demo_login_not_allowed' using errcode = '42501';
  end if;
  -- Linked accounts sign in with their auth e-mail; only a demo candidate without a login falls back to its own e-mail.
  if v_user is not null then
    select u.email into v_email from auth.users u where u.id = v_user;
  elsif p_kind <> 'candidate' then
    raise exception 'demo_login_no_account' using errcode = '22023';
  end if;
  if v_email is null then
    raise exception 'demo_login_no_email' using errcode = '22023';
  end if;

  select me.staff_name into v_actor from public.current_staff() me limit 1;
  insert into public.audit_logs (actor_user_id, actor_name, action, entity_type, entity_id, details, is_demo)
  values (auth.uid(), v_actor, format('Test girişi: %s (%s)', v_name, p_kind), 'demo_login', p_id,
          jsonb_build_object('kind', p_kind), p_kind <> 'staff');

  return jsonb_build_object('kind', p_kind, 'name', v_name, 'email', v_email, 'auth_user_id', v_user, 'path', v_path);
end;
$$;

revoke all on function public.prepare_demo_login(text, uuid) from public, anon;
grant execute on function public.prepare_demo_login(text, uuid) to authenticated;

commit;
