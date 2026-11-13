-- Test for 20261116120000_interview_offer_write_roles.sql (rolled back).
--
--   1  upper_management, source_country, target_country: interview and offer
--      insert succeeds, update changes the row
--   2  field_officer: still SEES the interview and the offer, but insert and
--      update fail with "row-level security"
--   3  a candidate still accepts their own pending offer (cand_offers_update)
--   4  an employer still sees its own offer (emp_offers_select)
--
-- NOTHING IS KEPT. Everything runs in one DO block that always ends with
-- raise exception 'SONUC ...', so every row it wrote is rolled back.
-- Run it in the Supabase SQL Editor as postgres, AFTER the migration.
--
-- Accounts are not named in this file: one per role is taken from
-- staff_members (role_level, auth_user_id) and checked with current_staff();
-- the employer and the candidate are any linked accounts (my_employer_id(),
-- my_candidate_id()). Impersonation: request.jwt.claims + set local role
-- authenticated. Test rows have is_demo = true and a "TEST yazma rolü" title.
--
-- Reading the result: the error text is the report. "SONUC: GEÇTİ=n KALDI=n
-- YAPILAMADI=n" then one line per check. YAPILAMADI means the account could
-- not reach the test row for another reason (e.g. no scope_country), so the
-- rule was not tested for that role.

do $$
declare
  v_roles text[] := array['upper_management', 'source_country', 'target_country', 'field_officer'];
  v_role text;
  r record;
  v_uid uuid; v_found_role text; v_scope text; v_staff uuid; v_code text; v_is_staff boolean;
  v_acc jsonb := '{}'::jsonb;  -- role -> {uid, scope, staff, code}
  v_emp uuid; v_emp_uid uuid; v_emp_name text;
  v_cand uuid; v_cand_uid uuid;
  v_missing text;
  v_run text := substr(md5(clock_timestamp()::text || random()::text), 1, 8);
  v_nat text; v_country text;
  v_c1 uuid; v_ra uuid; v_iv0 uuid; v_of0 uuid; v_of_cand uuid;
  v_err text; v_n int; v_seen int; v_seen_of int;
  v_ins_iv text; v_ins_of text; v_upd_iv text; v_upd_of text; v_upd_iv_n int; v_upd_of_n int;
  v_pass int := 0; v_fail int := 0; v_skip int := 0;
  v_lines text := '';
  v_ok boolean;
  v_line text;
begin
  -- 0. The migration must be in place -------------------------------------------
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'interviews'
                 and policyname = 'staff_insert_interviews' and with_check ilike '%current_staff%')
     or not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'interviews'
                 and policyname = 'staff_update_interviews' and with_check ilike '%current_staff%')
     or not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'job_offers'
                 and policyname = 'staff_insert_offers' and with_check ilike '%current_staff%')
     or not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'job_offers'
                 and policyname = 'staff_update_offers' and with_check ilike '%current_staff%') then
    raise exception 'Migration uygulanmamış: staff_insert/update politikalarında rol kontrolü yok. Önce 20261116120000_interview_offer_write_roles.sql.';
  end if;

  -- 1. One account per staff role (from staff_members) ---------------------------
  foreach v_role in array v_roles loop
    for r in
      select sm.auth_user_id as uid
      from public.staff_members sm
      where lower(sm.role_level) = v_role
        and coalesce(sm.is_active, true)
        and sm.auth_user_id is not null
      order by sm.id
    loop
      perform set_config('request.jwt.claims', json_build_object('sub', r.uid, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', r.uid::text, true);
      v_found_role := null; v_scope := null; v_staff := null; v_code := null;
      select lower(me.role_level), me.scope_country, me.staff_id, me.referral_code
        into v_found_role, v_scope, v_staff, v_code
      from public.current_staff() me limit 1;
      v_is_staff := public.is_staff();
      if v_found_role = v_role and v_is_staff then
        v_acc := v_acc || jsonb_build_object(v_role, jsonb_build_object(
          'uid', r.uid, 'scope', v_scope, 'staff', v_staff, 'code', v_code));
        exit;
      end if;
    end loop;
  end loop;

  -- Employer and candidate accounts.
  for r in
    select e.auth_user_id as uid, e.id from public.employers e where e.auth_user_id is not null
    union all
    select p.id, p.linked_employer_id from public.profiles p where p.role = 'employer' and p.linked_employer_id is not null
  loop
    perform set_config('request.jwt.claims', json_build_object('sub', r.uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', r.uid::text, true);
    if public.my_employer_id() = r.id and public.email_access_ok() then
      v_emp := r.id; v_emp_uid := r.uid; exit;
    end if;
  end loop;

  for r in
    select c.auth_user_id as uid, c.id from public.job_candidates c where c.auth_user_id is not null
    union all
    select p.id, p.linked_candidate_id from public.profiles p where p.role = 'candidate' and p.linked_candidate_id is not null
  loop
    perform set_config('request.jwt.claims', json_build_object('sub', r.uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', r.uid::text, true);
    if public.my_candidate_id() = r.id and public.email_access_ok() and not public.is_staff() then
      v_cand := r.id; v_cand_uid := r.uid; exit;
    end if;
  end loop;

  -- Back to "no end user" for the setup inserts.
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);

  if v_emp is null then
    raise exception 'SONUC: kurulamadı. Giriş hesabı bağlı bir işveren bulunamadı.';
  end if;
  select company_name into v_emp_name from public.employers where id = v_emp;

  select string_agg(t.tbl || '.' || col.column_name, ', ' order by t.tbl, col.column_name) into v_missing
  from (values
    ('job_candidates',  array['full_name', 'nationality', 'phone', 'email', 'profession', 'sector',
                              'passport_number', 'status', 'is_demo', 'referral_code', 'assigned_to']),
    ('job_requests',    array['employer_id', 'employer_name', 'sector', 'position_title', 'headcount',
                              'monthly_net_salary', 'accommodation_provided', 'food_provided',
                              'status', 'country', 'is_demo']),
    ('request_matches', array['request_id', 'candidate_id', 'bound_at', 'presented_at', 'is_demo']),
    ('interviews',      array['request_id', 'candidate_id', 'employer_id', 'scheduled_at', 'status', 'is_demo']),
    ('job_offers',      array['candidate_id', 'request_id', 'employer_id', 'employer_name', 'position_title',
                              'monthly_net_salary', 'offer_terms', 'status', 'is_demo'])
  ) as t(tbl, covered)
  join information_schema.columns col on col.table_schema = 'public' and col.table_name = t.tbl
  where col.is_nullable = 'NO' and col.column_default is null
    and col.is_identity = 'NO' and col.is_generated = 'NEVER'
    and col.column_name <> all (t.covered);
  if v_missing is not null then
    raise exception 'SONUC: kurulamadı. Zorunlu, varsayılansız sütun test insert''lerinde yok: %', v_missing;
  end if;

  -- 2. Test data (as postgres) ---------------------------------------------------
  -- One candidate every staff role can reach: source code + source nationality,
  -- assigned to the field officer, matched to a request in the target country.
  v_nat := coalesce(nullif(v_acc #>> '{source_country,scope}', ''), 'Belirtilmedi');
  v_country := coalesce(nullif(v_acc #>> '{target_country,scope}', ''), (select country from public.employers where id = v_emp));

  insert into public.job_candidates (full_name, nationality, phone, email, profession, sector,
                                     passport_number, status, is_demo, referral_code, assigned_to)
  values ('TEST yazma rolü aday', v_nat, 'p-wr-' || v_run, 'test-yazma-' || v_run || '@example.invalid',
          'Belirtilmedi', 'construction', 'TWR' || upper(v_run), 'pending', true,
          nullif(v_acc #>> '{source_country,code}', ''), nullif(v_acc #>> '{field_officer,staff}', '')::uuid)
  returning id into v_c1;

  insert into public.job_requests (employer_id, employer_name, sector, position_title, headcount,
                                   monthly_net_salary, accommodation_provided, food_provided, status, country, is_demo)
  values (v_emp, v_emp_name, 'construction', 'TEST yazma rolü talep', 2, 1000, true, true,
          'searching_candidates', v_country, true)
  returning id into v_ra;

  insert into public.request_matches (request_id, candidate_id, bound_at, presented_at, is_demo)
  values (v_ra, v_c1, now(), now(), true);

  insert into public.interviews (request_id, candidate_id, employer_id, scheduled_at, status, is_demo)
  values (v_ra, v_c1, v_emp, now() + interval '1 day', 'scheduled', true)
  returning id into v_iv0;

  insert into public.job_offers (candidate_id, request_id, employer_id, employer_name, position_title,
                                 monthly_net_salary, offer_terms, status, is_demo)
  values (v_c1, v_ra, v_emp, v_emp_name, 'TEST yazma rolü teklif', 1000, '{"currency":"EUR"}'::jsonb, 'pending', true)
  returning id into v_of0;

  if v_cand is not null then
    -- No request: the presented-candidate guard does not apply.
    insert into public.job_offers (candidate_id, request_id, employer_id, employer_name, position_title,
                                   monthly_net_salary, offer_terms, status, is_demo)
    values (v_cand, null, v_emp, v_emp_name, 'TEST yazma rolü aday teklifi', 1000, '{"currency":"EUR"}'::jsonb, 'pending', true)
    returning id into v_of_cand;
  end if;

  -- 3. Staff roles ---------------------------------------------------------------
  foreach v_role in array v_roles loop
    if not v_acc ? v_role then
      v_skip := v_skip + 1;
      v_lines := v_lines || format(E'\n[YAPILAMADI] %s: staff_members içinde current_staff() ile doğrulanan hesap yok', v_role);
      continue;
    end if;
    v_uid := (v_acc #>> array[v_role, 'uid'])::uuid;
    v_seen := 0; v_seen_of := 0;
    v_ins_iv := null; v_ins_of := null; v_upd_iv := null; v_upd_of := null; v_upd_iv_n := 0; v_upd_of_n := 0;

    perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid::text, true);

    -- Can the role see the test rows at all (select policy unchanged)?
    begin
      set local role authenticated;
      select count(*) into v_seen from public.interviews where id = v_iv0;
      select count(*) into v_seen_of from public.job_offers where id = v_of0;
      reset role;
    exception when others then
      reset role;
    end;

    begin
      set local role authenticated;
      insert into public.interviews (request_id, candidate_id, employer_id, scheduled_at, status, is_demo)
      values (v_ra, v_c1, v_emp, now() + interval '2 days', 'scheduled', true);
      reset role;
    exception when others then
      v_ins_iv := sqlerrm;
    end;
    reset role;

    begin
      set local role authenticated;
      insert into public.job_offers (candidate_id, request_id, employer_id, employer_name, position_title,
                                     monthly_net_salary, offer_terms, status, is_demo)
      values (v_c1, v_ra, v_emp, v_emp_name, 'TEST yazma rolü yeni teklif', 1100, '{"currency":"EUR"}'::jsonb, 'pending', true);
      reset role;
    exception when others then
      v_ins_of := sqlerrm;
    end;
    reset role;

    begin
      set local role authenticated;
      update public.interviews set panova_notes = 'TEST yazma rolü ' || v_role where id = v_iv0;
      get diagnostics v_upd_iv_n = row_count;
      reset role;
    exception when others then
      v_upd_iv := sqlerrm;
    end;
    reset role;

    begin
      set local role authenticated;
      update public.job_offers set terms_details = 'TEST yazma rolü ' || v_role where id = v_of0;
      get diagnostics v_upd_of_n = row_count;
      reset role;
    exception when others then
      v_upd_of := sqlerrm;
    end;
    reset role;

    v_line := format('görüş=%s/%s; mülakat_ekle=%s; teklif_ekle=%s; mülakat_güncelle=%s; teklif_güncelle=%s',
      v_seen, v_seen_of,
      coalesce(v_ins_iv, 'başarılı'), coalesce(v_ins_of, 'başarılı'),
      coalesce(v_upd_iv, v_upd_iv_n || ' satır'), coalesce(v_upd_of, v_upd_of_n || ' satır'));

    if v_seen <> 1 or v_seen_of <> 1 then
      v_skip := v_skip + 1;
      v_lines := v_lines || format(E'\n[YAPILAMADI] %s: test satırını göremiyor (kapsam / atama?) | %s', v_role, v_line);
      continue;
    end if;

    if v_role = 'field_officer' then
      v_ok := coalesce(v_ins_iv, '') ilike '%row-level security%'
          and coalesce(v_ins_of, '') ilike '%row-level security%'
          and coalesce(v_upd_iv, '') ilike '%row-level security%'
          and coalesce(v_upd_of, '') ilike '%row-level security%';
      v_lines := v_lines || format(E'\n[%s] field_officer görür ama ekleyemez / güncelleyemez | %s',
        case when v_ok then 'GEÇTİ' else 'KALDI' end, v_line);
    else
      v_ok := v_ins_iv is null and v_ins_of is null and v_upd_iv is null and v_upd_of is null
          and v_upd_iv_n = 1 and v_upd_of_n = 1;
      v_lines := v_lines || format(E'\n[%s] %s ekler ve günceller | %s',
        case when v_ok then 'GEÇTİ' else 'KALDI' end, v_role, v_line);
    end if;
    if v_ok then v_pass := v_pass + 1; else v_fail := v_fail + 1; end if;
  end loop;

  -- 4. Candidate accepts own offer -----------------------------------------------
  if v_cand is null then
    v_skip := v_skip + 1;
    v_lines := v_lines || E'\n[YAPILAMADI] aday: giriş hesabı bağlı aday bulunamadı';
  else
    v_err := null; v_n := 0;
    perform set_config('request.jwt.claims', json_build_object('sub', v_cand_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_cand_uid::text, true);
    begin
      set local role authenticated;
      update public.job_offers set status = 'accepted' where id = v_of_cand;
      get diagnostics v_n = row_count;
      reset role;
    exception when others then
      v_err := sqlerrm;
    end;
    reset role;
    v_ok := v_err is null and v_n = 1
        and (select status from public.job_offers where id = v_of_cand) = 'accepted';
    v_lines := v_lines || format(E'\n[%s] aday kendi teklifini kabul eder | %s',
      case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce(v_err, v_n || ' satır'));
    if v_ok then v_pass := v_pass + 1; else v_fail := v_fail + 1; end if;
  end if;

  -- 5. Employer sees own offer ---------------------------------------------------
  v_err := null; v_n := 0;
  perform set_config('request.jwt.claims', json_build_object('sub', v_emp_uid, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_emp_uid::text, true);
  begin
    set local role authenticated;
    select count(*) into v_n from public.job_offers where id = v_of0;
    reset role;
  exception when others then
    v_err := sqlerrm;
  end;
  reset role;
  v_ok := v_err is null and v_n = 1;
  v_lines := v_lines || format(E'\n[%s] işveren kendi teklifini görür | %s',
    case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce(v_err, v_n || ' satır'));
  if v_ok then v_pass := v_pass + 1; else v_fail := v_fail + 1; end if;

  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);

  raise exception 'SONUC: GEÇTİ=% KALDI=% YAPILAMADI=% (hepsi geri alındı)%', v_pass, v_fail, v_skip, v_lines;
end
$$;
