-- Test for 20261117100000_field_officer_registration.sql (nothing kept).
--
--   1  migration applied: columns, functions, policies
--   2  every active field officer has a PV + 6 code; codes are unique
--   3  code assignment on a test staff row: a client code is ignored, a role
--      change clears the live code, returning to field_officer (or moving to
--      source_country) restores the same code
--   4  field officer A inserts a candidate with forged registered_by,
--      referral_code and kvkk_recorded_by: the server writes A, A's code,
--      kvkk_recorded_by = A and kvkk_version = 2026-11-10 (insert ... returning
--      works under RLS)
--   5  without kvkk_accepted_at: no version, no kvkk_recorded_by
--   6  A reads and updates their own candidate; registered_by / referral_code
--      cannot be changed by an update
--   7  another officer's candidate (registered_by = test officer B, and a
--      source-country code when one exists) is hidden from A: select, update,
--      staff_can_read_candidate, document insert and the file path all fail
--   8  A may upload documents for their own candidate: the file path check
--      (candidate-files bucket rule) and the candidate_documents insert pass
--   9  code rule: field_officer_owns_candidate(null, A's code) is true for A,
--      false for an unknown code
--  10  upper management: no code -> registered_by = them, code null; a field
--      officer's code is refused (unknown_supervisor_code, unchanged)
--  11  source_country: registered_by = them, their code (unchanged)
--  12  anon: cannot insert, or the row has no registered_by / kvkk_recorded_by
--
-- NOTHING IS KEPT: one DO block that always ends with raise exception
-- 'SONUC ...', so every test row is rolled back. Run it in the Supabase SQL
-- Editor as postgres, AFTER the migration. Accounts are chosen by role, never
-- by name or e-mail. Test rows use example.invalid addresses.
-- Impersonation: request.jwt.claims + set local role.

do $$
declare
  v_lines text := '';
  v_ok boolean;
  v_err text;
  v_n int;
  v_upd int;
  v_pass int; v_fail int; v_skip int;
  v_kvkk constant text := '2026-11-10';
  -- accounts
  v_a_uid uuid; v_a_staff uuid; v_a_code text;
  v_um_uid uuid; v_um_staff uuid;
  v_src_uid uuid; v_src_staff uuid; v_src_code text;
  -- test rows
  v_b_staff uuid;
  v_c_staff uuid; v_c_code text; v_c_code2 text;
  v_own1 uuid; v_own2 uuid; v_other uuid; v_doc uuid;
  v_reg uuid; v_code text; v_krec uuid; v_kver text;
  v_bool boolean;
begin
  -- 1. Migration applied -------------------------------------------------------
  v_ok := exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'job_candidates' and column_name = 'registered_by')
      and exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'job_candidates' and column_name = 'kvkk_recorded_by')
      and to_regprocedure('public.field_officer_owns_candidate(uuid,text)') is not null
      and pg_get_functiondef('public.stamp_candidate_referral_code()'::regprocedure) ilike '%registered_by%'
      and pg_get_functiondef('public.staff_can_read_candidate(uuid)'::regprocedure) ilike '%registered_by%'
      and pg_get_functiondef('public.staff_can_insert_candidate()'::regprocedure) ilike '%field_officer%'
      and pg_get_functiondef('public.assign_supervisor_referral_code()'::regprocedure) ilike '%field_officer%';
  if not v_ok then
    raise exception 'Migration uygulanmamış: önce 20261117100000_field_officer_registration.sql.';
  end if;
  select count(*) into v_n from pg_policies
  where (schemaname, tablename, policyname) in (
    ('public', 'job_candidates', 'staff_select_candidates'),
    ('public', 'job_candidates', 'staff_insert_candidates'),
    ('public', 'job_candidates', 'staff_update_candidates'),
    ('public', 'candidate_documents', 'staff_insert_documents'),
    ('storage', 'objects', 'candidate_files_insert'));
  v_lines := v_lines || format(E'\n[%s] 1 kolonlar, fonksiyonlar ve %s/5 politika yerinde',
    case when v_n = 5 then 'GEÇTİ' else 'KALDI' end, v_n);

  -- 2. Every active field officer has a valid, unique code ---------------------
  select count(*) into v_n from public.staff_members
  where role_level = 'field_officer' and coalesce(is_active, true)
    and (referral_code is null or referral_code !~ '^PV[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$');
  v_ok := v_n = 0 and not exists (
    select referral_code from public.staff_members where referral_code is not null
    group by referral_code having count(*) > 1);
  v_lines := v_lines || format(E'\n[%s] 2 her saha görevlisinin geçerli, benzersiz kodu var (kodsuz: %s)',
    case when v_ok then 'GEÇTİ' else 'KALDI' end, v_n);

  -- Accounts, by role only.
  select sm.auth_user_id, sm.id, sm.referral_code into v_a_uid, v_a_staff, v_a_code
  from public.staff_members sm
  join public.profiles p on p.id = sm.auth_user_id and p.role = 'staff'
  where sm.role_level = 'field_officer' and coalesce(sm.is_active, true)
  order by sm.id limit 1;

  select sm.auth_user_id, sm.id into v_um_uid, v_um_staff
  from public.staff_members sm
  join public.profiles p on p.id = sm.auth_user_id and p.role = 'staff'
  where sm.role_level = 'upper_management' and coalesce(sm.is_active, true)
  order by sm.id limit 1;

  select sm.auth_user_id, sm.id, sm.referral_code into v_src_uid, v_src_staff, v_src_code
  from public.staff_members sm
  join public.profiles p on p.id = sm.auth_user_id and p.role = 'staff'
  where sm.role_level = 'source_country' and coalesce(sm.is_active, true)
    and sm.referral_code is not null
  order by sm.id limit 1;

  -- 3. Code assignment on a test staff row (as postgres) ----------------------
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  v_err := null;
  begin
    insert into public.staff_members (id, name, email, role_level, is_active, referral_code)
    values (gen_random_uuid(), 'TEST saha C', 'test-saha-c@example.invalid', 'field_officer', true, 'PVAAAAAA')
    returning id, referral_code into v_c_staff, v_c_code;
    v_ok := v_c_code ~ '^PV[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$' and v_c_code <> 'PVAAAAAA';
    update public.staff_members set role_level = 'finance' where id = v_c_staff returning referral_code into v_c_code2;
    v_ok := v_ok and v_c_code2 is null;
    update public.staff_members set role_level = 'field_officer', referral_code = 'PVBBBBBB' where id = v_c_staff
    returning referral_code into v_c_code2;
    v_ok := v_ok and v_c_code2 = v_c_code;
    update public.staff_members set role_level = 'source_country' where id = v_c_staff returning referral_code into v_c_code2;
    v_ok := v_ok and v_c_code2 = v_c_code;
  exception when others then
    v_ok := false; v_err := sqlerrm;
  end;
  v_lines := v_lines || format(E'\n[%s] 3 kod sunucuda üretildi, istemci kodu yok sayıldı, rol değişince aynı kod geri geldi %s',
    case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce('(' || v_err || ')', ''));

  -- Test officer B (no login) and a candidate that belongs to B.
  begin
    insert into public.staff_members (id, name, email, role_level, is_active)
    values (gen_random_uuid(), 'TEST saha B', 'test-saha-b@example.invalid', 'field_officer', true)
    returning id into v_b_staff;
    insert into public.job_candidates (full_name, nationality, email, profession, sector, status, registered_by, referral_code)
    values ('TEST aday B', 'Testland', 'test-aday-b@example.invalid', 'TEST', 'construction', 'pending', v_b_staff, v_src_code)
    returning id into v_other;
  exception when others then
    v_b_staff := null; v_other := null;
    v_lines := v_lines || format(E'\n[YAPILAMADI] 7 test görevlisi B / adayı oluşturulamadı (%s)', sqlerrm);
  end;

  if v_a_uid is null then
    v_lines := v_lines || E'\n[YAPILAMADI] 4-9 giriş yapabilen aktif saha görevlisi yok';
  else
    perform set_config('request.jwt.claims', json_build_object('sub', v_a_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_a_uid::text, true);

    -- 4. Insert with forged values and consent
    v_err := null;
    begin
      set local role authenticated;
      insert into public.job_candidates (full_name, nationality, email, profession, sector, status,
                                         registered_by, referral_code, kvkk_recorded_by, kvkk_accepted_at, kvkk_version)
      values ('TEST aday A1', 'Testland', 'test-aday-a1@example.invalid', 'TEST', 'construction', 'pending',
              v_b_staff, 'PVZZZZZZ', v_b_staff, now(), 'sahte')
      returning id, registered_by, referral_code, kvkk_recorded_by, kvkk_version
        into v_own1, v_reg, v_code, v_krec, v_kver;
      reset role;
    exception when others then
      v_err := sqlerrm;
    end;
    reset role;
    v_ok := v_err is null and v_reg = v_a_staff and v_code = v_a_code and v_krec = v_a_staff and v_kver = v_kvkk;
    v_lines := v_lines || format(E'\n[%s] 4 saha kaydı: registered_by=kendisi, kod=kendi kodu, KVKK kaydeden=kendisi, sürüm=%s %s',
      case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce(v_kver, '-'), coalesce('(' || v_err || ')', ''));

    -- 5. Without consent
    v_err := null;
    begin
      set local role authenticated;
      insert into public.job_candidates (full_name, nationality, email, profession, sector, status, kvkk_recorded_by, kvkk_version)
      values ('TEST aday A2', 'Testland', 'test-aday-a2@example.invalid', 'TEST', 'construction', 'pending', v_b_staff, 'sahte')
      returning id, registered_by, kvkk_recorded_by, kvkk_version into v_own2, v_reg, v_krec, v_kver;
      reset role;
    exception when others then
      v_err := sqlerrm;
    end;
    reset role;
    v_ok := v_err is null and v_reg = v_a_staff and v_krec is null and v_kver is null;
    v_lines := v_lines || format(E'\n[%s] 5 KVKK onayı yoksa sürüm ve kaydeden boş %s',
      case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce('(' || v_err || ')', ''));

    -- 6. Own candidate: read, update, immutable fields
    v_err := null; v_n := null;
    begin
      set local role authenticated;
      update public.job_candidates
         set profession = 'TEST 2', registered_by = v_b_staff, referral_code = 'PVZZZZZZ', kvkk_recorded_by = v_b_staff
       where id = v_own2;
      get diagnostics v_n = row_count;
      select registered_by, referral_code, kvkk_recorded_by into v_reg, v_code, v_krec
      from public.job_candidates where id = v_own2;
      reset role;
    exception when others then
      v_err := sqlerrm;
    end;
    reset role;
    v_ok := v_err is null and v_n = 1 and v_reg = v_a_staff and v_code = v_a_code and v_krec is null;
    v_lines := v_lines || format(E'\n[%s] 6 kendi adayını görüyor ve güncelliyor; kaydeden/kod değiştirilemiyor %s',
      case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce('(' || v_err || ')', ''));

    -- 7. Another officer's candidate stays hidden
    if v_other is not null then
    v_err := null; v_n := null; v_bool := null; v_upd := null;
    begin
      set local role authenticated;
      select count(*) into v_n from public.job_candidates where id = v_other;
      v_bool := public.staff_can_read_candidate(v_other) or public.can_access_candidate_file(v_other::text || '/passport/test.pdf');
      update public.job_candidates set profession = 'X' where id = v_other;
      get diagnostics v_upd = row_count;
      reset role;
    exception when others then
      v_err := sqlerrm;
    end;
    reset role;
    v_ok := v_err is null and v_n = 0 and v_bool = false and v_upd = 0;
    -- document insert must be refused
    v_err := null;
    begin
      set local role authenticated;
      insert into public.candidate_documents (candidate_id, doc_type, status, file_url, uploaded_at)
      values (v_other, 'passport', 'uploaded', 'storage:candidate-files/' || v_other || '/passport/test.pdf', now());
      reset role;
      v_err := 'eklendi';
    exception when insufficient_privilege then
      v_err := null;
    when others then
      v_err := sqlerrm;
    end;
    reset role;
    v_ok := v_ok and v_err is null;
    v_lines := v_lines || format(E'\n[%s] 7 başka görevlinin adayı görünmüyor, güncellenmiyor, belge/dosya eklenemiyor %s',
      case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce('(' || v_err || ')', ''));
    end if;

    -- 8. Documents for own candidate
    if v_own1 is null then
      v_lines := v_lines || E'\n[YAPILAMADI] 8 kendi adayı oluşmadı (4. adım)';
    else
      v_err := null; v_doc := null; v_bool := null;
      begin
        set local role authenticated;
        v_bool := public.can_access_candidate_file(v_own1::text || '/passport/test.pdf');
        insert into public.candidate_documents (candidate_id, doc_type, status, file_url, uploaded_at)
        values (v_own1, 'passport', 'uploaded', 'storage:candidate-files/' || v_own1 || '/passport/test.pdf', now())
        returning id into v_doc;
        reset role;
      exception when others then
        v_err := sqlerrm;
      end;
      reset role;
      v_ok := v_err is null and v_bool and v_doc is not null;
      v_lines := v_lines || format(E'\n[%s] 8 kendi adayına dosya yolu izni ve belge kaydı var %s',
        case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce('(' || v_err || ')', ''));
    end if;

    -- 9. Code rule
    v_err := null;
    begin
      set local role authenticated;
      v_ok := public.field_officer_owns_candidate(null, v_a_code)
          and not public.field_officer_owns_candidate(null, 'PVZZZZZZ')
          and not public.field_officer_owns_candidate(v_b_staff, null);
      reset role;
    exception when others then
      v_err := sqlerrm; v_ok := false;
    end;
    reset role;
    v_lines := v_lines || format(E'\n[%s] 9 kod kuralı: kendi kodu açık, yabancı kod ve başkasının kaydı kapalı %s',
      case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce('(' || v_err || ')', ''));
  end if;

  -- 10. Upper management (unchanged code choice)
  if v_um_uid is null then
    v_lines := v_lines || E'\n[YAPILAMADI] 10 giriş yapabilen Üst Yönetim hesabı yok';
  else
    perform set_config('request.jwt.claims', json_build_object('sub', v_um_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_um_uid::text, true);
    v_err := null; v_reg := null; v_code := 'x';
    begin
      set local role authenticated;
      insert into public.job_candidates (full_name, nationality, email, profession, sector, status, registered_by)
      values ('TEST aday UM', 'Testland', 'test-aday-um@example.invalid', 'TEST', 'construction', 'pending', v_b_staff)
      returning registered_by, referral_code into v_reg, v_code;
      reset role;
    exception when others then
      v_err := sqlerrm;
    end;
    reset role;
    v_ok := v_err is null and v_reg = v_um_staff and v_code is null;
    -- a field officer's code is not a choice for upper management
    if v_a_code is not null then
      begin
        set local role authenticated;
        insert into public.job_candidates (full_name, nationality, email, profession, sector, status, referral_code)
        values ('TEST aday UM2', 'Testland', 'test-aday-um2@example.invalid', 'TEST', 'construction', 'pending', v_a_code);
        reset role;
        v_ok := false;
      exception when others then
        v_ok := v_ok and sqlerrm like '%unknown_supervisor_code%';
      end;
      reset role;
    end if;
    v_lines := v_lines || format(E'\n[%s] 10 Üst Yönetim: kaydeden=kendisi, kod boş; saha kodu seçilemiyor %s',
      case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce('(' || v_err || ')', ''));
  end if;

  -- 11. Source country (unchanged)
  if v_src_uid is null then
    v_lines := v_lines || E'\n[YAPILAMADI] 11 kodu olan, giriş yapabilen kaynak ülke sorumlusu yok';
  else
    perform set_config('request.jwt.claims', json_build_object('sub', v_src_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_src_uid::text, true);
    v_err := null; v_reg := null; v_code := null;
    begin
      set local role authenticated;
      insert into public.job_candidates (full_name, nationality, email, profession, sector, status)
      values ('TEST aday KÜ', 'Testland', 'test-aday-src@example.invalid', 'TEST', 'construction', 'pending')
      returning registered_by, referral_code into v_reg, v_code;
      reset role;
    exception when others then
      v_err := sqlerrm;
    end;
    reset role;
    v_ok := v_err is null and v_reg = v_src_staff and v_code = v_src_code;
    v_lines := v_lines || format(E'\n[%s] 11 kaynak ülke: kaydeden=kendisi, kod=kendi kodu %s',
      case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce('(' || v_err || ')', ''));
  end if;

  -- 12. Anon
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  perform set_config('request.jwt.claim.sub', '', true);
  v_err := null; v_reg := null; v_krec := null;
  begin
    set local role anon;
    insert into public.job_candidates (full_name, nationality, email, profession, sector, status, registered_by, kvkk_recorded_by)
    values ('TEST aday anon', 'Testland', 'test-aday-anon@example.invalid', 'TEST', 'construction', 'pending', v_b_staff, v_b_staff);
    reset role;
    select registered_by, kvkk_recorded_by into v_reg, v_krec
    from public.job_candidates where email = 'test-aday-anon@example.invalid';
    v_ok := v_reg is null and v_krec is null;
  exception when insufficient_privilege then
    v_ok := true; v_err := 'anon ekleyemiyor';
  when others then
    v_ok := false; v_err := sqlerrm;
  end;
  reset role;
  v_lines := v_lines || format(E'\n[%s] 12 anon: kaydeden/KVKK kaydeden boş %s',
    case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce('(' || v_err || ')', ''));

  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);

  v_pass := (length(v_lines) - length(replace(v_lines, '[GEÇTİ]', ''))) / length('[GEÇTİ]');
  v_fail := (length(v_lines) - length(replace(v_lines, '[KALDI]', ''))) / length('[KALDI]');
  v_skip := (length(v_lines) - length(replace(v_lines, '[YAPILAMADI]', ''))) / length('[YAPILAMADI]');
  raise exception 'SONUC: GEÇTİ=% KALDI=% YAPILAMADI=% (hiçbir şey yazılmadı)%', v_pass, v_fail, v_skip, v_lines;
end
$$;
