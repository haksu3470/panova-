-- Test for 20261116130000_video_role_from_staff_members.sql (rolled back).
--
--   1  an upper-management account whose profiles.staff_role is empty
--      (role only in staff_members.role_level) gets true
--   2  source_country and target_country get true (unchanged)
--   3  field_officer gets false
--   4  a non-staff account (candidate or employer) gets false
--
-- NOTHING IS KEPT: one DO block that only reads and always ends with
-- raise exception 'SONUC ...'. Run it in the Supabase SQL Editor as postgres,
-- AFTER the migration. Accounts are chosen from staff_members / profiles by
-- role, never by name or e-mail. Impersonation: request.jwt.claims +
-- set local role authenticated (the grant is to authenticated).

do $$
declare
  r record;
  v_role text;
  v_uid uuid;
  v_result boolean;
  v_err text;
  v_ok boolean;
  v_pass int := 0; v_fail int := 0; v_skip int := 0;
  v_lines text := '';
  v_label text;
  v_expected boolean;
begin
  if pg_get_functiondef('public.can_manage_candidate_video()'::regprocedure) not ilike '%current_staff%' then
    raise exception 'Migration uygulanmamış: can_manage_candidate_video() hâlâ profiles.staff_role okuyor. Önce 20261116130000_video_role_from_staff_members.sql.';
  end if;

  -- [label, uid, expected]
  for r in
    -- 1. upper management with an empty profiles.staff_role
    (select 'upper_management (profiles.staff_role boş)' as label, sm.auth_user_id as uid, true as expected,
            coalesce(p.role, '-') as profile_role
     from public.staff_members sm
     left join public.profiles p on p.id = sm.auth_user_id
     where lower(sm.role_level) = 'upper_management'
       and coalesce(sm.is_active, true)
       and sm.auth_user_id is not null
       and nullif(btrim(coalesce(p.staff_role, '')), '') is null
     order by sm.id limit 1)
    union all
    (select 'source_country', sm.auth_user_id, true, coalesce(p.role, '-')
     from public.staff_members sm left join public.profiles p on p.id = sm.auth_user_id
     where lower(sm.role_level) = 'source_country' and coalesce(sm.is_active, true) and sm.auth_user_id is not null
     order by sm.id limit 1)
    union all
    (select 'target_country', sm.auth_user_id, true, coalesce(p.role, '-')
     from public.staff_members sm left join public.profiles p on p.id = sm.auth_user_id
     where lower(sm.role_level) = 'target_country' and coalesce(sm.is_active, true) and sm.auth_user_id is not null
     order by sm.id limit 1)
    union all
    (select 'field_officer', sm.auth_user_id, false, coalesce(p.role, '-')
     from public.staff_members sm left join public.profiles p on p.id = sm.auth_user_id
     where lower(sm.role_level) = 'field_officer' and coalesce(sm.is_active, true) and sm.auth_user_id is not null
     order by sm.id limit 1)
    union all
    -- 4. not staff: a candidate or employer profile with no staff_members row
    (select 'personel olmayan (' || p.role || ')', p.id, false, p.role
     from public.profiles p
     where p.role in ('candidate', 'employer')
       and not exists (select 1 from public.staff_members sm where sm.auth_user_id = p.id)
     order by p.role, p.id limit 1)
  loop
    v_result := null; v_err := null;
    perform set_config('request.jwt.claims', json_build_object('sub', r.uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', r.uid::text, true);
    begin
      set local role authenticated;
      v_result := public.can_manage_candidate_video();
      reset role;
    exception when others then
      v_err := sqlerrm;
    end;
    reset role;

    v_ok := v_err is null and v_result is not distinct from r.expected;
    v_lines := v_lines || format(E'\n[%s] %s: beklenen=%s, sonuç=%s, profiles.role=%s',
      case when v_ok then 'GEÇTİ' else 'KALDI' end, r.label, r.expected,
      coalesce(v_err, coalesce(v_result::text, 'null')), r.profile_role);
    if v_ok then v_pass := v_pass + 1; else v_fail := v_fail + 1; end if;
  end loop;

  -- Report the cases that had no account.
  foreach v_label in array array['upper_management (profiles.staff_role boş)', 'source_country', 'target_country', 'field_officer', 'personel olmayan'] loop
    if position(v_label in v_lines) = 0 then
      v_skip := v_skip + 1;
      v_lines := v_lines || format(E'\n[YAPILAMADI] %s: uygun hesap yok', v_label);
    end if;
  end loop;

  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);

  raise exception 'SONUC: GEÇTİ=% KALDI=% YAPILAMADI=% (hiçbir şey yazılmadı)%', v_pass, v_fail, v_skip, v_lines;
end
$$;
