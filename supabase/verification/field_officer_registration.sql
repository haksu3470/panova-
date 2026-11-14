-- Test for 20261117100000_field_officer_registration.sql (nothing kept).
--
--   0   migration applied; staff_can_read_candidate and the UPDATE / DELETE
--       policies were not widened
--   a1  every active field officer has a PV + 6 code; codes are unique
--       (staff rows and the private ledger)
--   a2  on a test staff row: a client code is ignored, a role change clears
--       the live code, coming back restores the same code
--   b1  field officer A inserts with forged registered_by, referral_code,
--       kvkk_recorded_by, status and assignee: the server writes A, A's code,
--       kvkk_recorded_by = A, kvkk_version 2026-11-10, status pending, no
--       assignee (insert ... returning works under RLS)
--   b2  without kvkk_accepted_at: no version, no kvkk_recorded_by
--   c1  A sees their own candidate
--   c2  A cannot update it (no new write right) and an update cannot change
--       registered_by / referral_code
--   c3  another officer's candidate (registered_by = test officer B, carrying
--       a source-country code when one exists) is hidden from A
--   d1  A can add a document row and pass the file-path rule for their own
--       candidate, and reads the document back
--   d2  A cannot add a document or pass the file-path rule for B's candidate
--   d3  document UPDATE is unchanged: A cannot update their own candidate's
--       document (not assigned)
--   e1  upper management: no code -> registered_by = them, code null; an
--       officer code (also a field officer's) is accepted; a made-up code is
--       refused (unknown_supervisor_code)
--   e2  source_country: registered_by = them, their own code
--   f1  a candidate account cannot write registered_by / kvkk_recorded_by
--   f2  anon cannot write registered_by / kvkk_recorded_by
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
  v_cand_uid uuid;
  -- test rows
  v_b_staff uuid;
  v_c_staff uuid; v_c_code text; v_c_code2 text;
  v_own1 uuid; v_own2 uuid; v_other uuid; v_doc uuid;
  v_reg uuid; v_code text; v_krec uuid; v_kver text; v_status text; v_assignee uuid;
  v_bool boolean;
begin
  -- 0. Migration applied, nothing widened --------------------------------------
  v_ok := exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'job_candidates' and column_name = 'registered_by')
      and exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'job_candidates' and column_name = 'kvkk_recorded_by')
      and to_regprocedure('public.field_officer_owns_candidate(uuid,text)') is not null
      and to_regprocedure('public.field_officer_owns_candidate_id(uuid)') is not null
      and pg_get_functiondef('public.stamp_candidate_referral_code()'::regprocedure) ilike '%registered_by%'
      and pg_get_functiondef('public.assign_supervisor_referral_code()'::regprocedure) ilike '%field_officer%';
  if not v_ok then
    raise exception 'Migration uygulanmamış: önce 20261117100000_field_officer_registration.sql.';
  end if;
  select count(*) into v_n from pg_policies
  where ((schemaname = 'public' and tablename in ('job_candidates', 'candidate_documents'))
         or (schemaname = 'storage' and tablename = 'objects' and policyname like 'candidate_files_%'))
    and cmd in ('UPDATE', 'DELETE', 'ALL')
    and (coalesce(qual, '') ilike '%field_officer_owns%' or coalesce(with_check, '') ilike '%field_officer_owns%');
  v_ok := v_n = 0
      and pg_get_functiondef('public.staff_can_read_candidate(uuid)'::regprocedure) not ilike '%registered_by%';
  v_lines := v_lines || format(E'\n[%s] 0 staff_can_read_candidate ve UPDATE/DELETE politikaları genişlemedi (yeni kurallı yazma politikası: %s)',
    case when v_ok then 'GEÇTİ' else 'KALDI' end, v_n);

  -- a1. Every active field officer has a valid, unique code --------------------
  select count(*) into v_n from public.staff_members
  where role_level = 'field_officer' and coalesce(is_active, true)
    and (referral_code is null or referral_code !~ '^PV[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$');
  v_ok := v_n = 0
    and not exists (
      select referral_code from public.staff_members where referral_code is not null
      group by referral_code having count(*) > 1)
    and not exists (
      select 1 from public.staff_members s
      join private.staff_referral_codes l on l.referral_code = s.referral_code and l.staff_id <> s.id);
  v_lines := v_lines || format(E'\n[%s] a1 her saha görevlisinin geçerli, benzersiz kodu var (kodsuz: %s)',
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

  select p.id into v_cand_uid
  from public.profiles p
  where p.role = 'candidate'
    and not exists (select 1 from public.staff_members sm where sm.auth_user_id = p.id)
  order by p.id limit 1;

  -- a2. Code assignment on a test staff row (as postgres) ---------------------
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
  v_lines := v_lines || format(E'\n[%s] a2 kod sunucuda üretildi, istemci kodu yok sayıldı, rol değişince aynı kod geri geldi %s',
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
    v_lines := v_lines || format(E'\n[YAPILAMADI] c3/d2 test görevlisi B / adayı oluşturulamadı (%s)', sqlerrm);
  end;

  if v_a_uid is null then
    v_lines := v_lines || E'\n[YAPILAMADI] b-d giriş yapabilen aktif saha görevlisi yok';
  else
    perform set_config('request.jwt.claims', json_build_object('sub', v_a_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_a_uid::text, true);

    -- b1. Insert with forged values and consent
    v_err := null;
    begin
      set local role authenticated;
      insert into public.job_candidates (full_name, nationality, email, profession, sector, status,
                                         registered_by, referral_code, kvkk_recorded_by, kvkk_accepted_at, kvkk_version,
                                         assigned_to)
      values ('TEST aday A1', 'Testland', 'test-aday-a1@example.invalid', 'TEST', 'construction', 'approved',
              v_b_staff, 'PVZZZZZZ', v_b_staff, now(), 'sahte', v_b_staff)
      returning id, registered_by, referral_code, kvkk_recorded_by, kvkk_version, status, assigned_to
        into v_own1, v_reg, v_code, v_krec, v_kver, v_status, v_assignee;
      reset role;
    exception when others then
      v_err := sqlerrm;
    end;
    reset role;
    v_ok := v_err is null and v_reg = v_a_staff and v_code = v_a_code and v_krec = v_a_staff
        and v_kver = v_kvkk and v_status = 'pending' and v_assignee is null;
    v_lines := v_lines || format(E'\n[%s] b1 saha kaydı: kaydeden=kendisi, kod=kendi kodu, KVKK kaydeden=kendisi, sürüm=%s, statü=%s, sorumlu boş %s',
      case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce(v_kver, '-'), coalesce(v_status, '-'), coalesce('(' || v_err || ')', ''));

    -- b2. Without consent
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
    v_lines := v_lines || format(E'\n[%s] b2 KVKK onayı yoksa sürüm ve kaydeden boş %s',
      case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce('(' || v_err || ')', ''));

    -- c1 / c2. Own candidate: visible, not writable
    v_err := null; v_n := null; v_upd := null;
    begin
      set local role authenticated;
      select count(*) into v_n from public.job_candidates where id in (v_own1, v_own2);
      update public.job_candidates
         set profession = 'TEST 2', registered_by = v_b_staff, referral_code = 'PVZZZZZZ'
       where id = v_own2;
      get diagnostics v_upd = row_count;
      reset role;
    exception when others then
      v_err := sqlerrm;
    end;
    reset role;
    v_lines := v_lines || format(E'\n[%s] c1 kendi kaydettiği adayları görüyor (%s/2) %s',
      case when v_err is null and v_n = 2 then 'GEÇTİ' else 'KALDI' end, coalesce(v_n::text, '-'), coalesce('(' || v_err || ')', ''));
    select registered_by, referral_code into v_reg, v_code from public.job_candidates where id = v_own2;
    v_ok := v_err is null and v_upd = 0 and v_reg = v_a_staff and v_code = v_a_code;
    v_lines := v_lines || format(E'\n[%s] c2 kendi adayını güncelleyemiyor (yeni yazma yetkisi yok), kaydeden/kod değişmedi (etkilenen satır: %s)',
      case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce(v_upd::text, '-'));

    if v_other is not null then
      -- c3. Another officer's candidate stays hidden
      v_err := null; v_n := null;
      begin
        set local role authenticated;
        select count(*) into v_n from public.job_candidates where id = v_other;
        reset role;
      exception when others then
        v_err := sqlerrm;
      end;
      reset role;
      v_lines := v_lines || format(E'\n[%s] c3 başka görevlinin adayı görünmüyor %s',
        case when v_err is null and v_n = 0 then 'GEÇTİ' else 'KALDI' end, coalesce('(' || v_err || ')', ''));

      -- d2. No document or file for B's candidate
      v_err := null; v_bool := null;
      begin
        set local role authenticated;
        -- the candidate-files INSERT rule, evaluated for B's folder
        v_bool := public.can_access_candidate_file(v_other::text || '/passport/test.pdf')
          or (public.is_staff() and public.field_officer_owns_candidate_id(public.candidate_file_owner(v_other::text || '/passport/test.pdf')));
        reset role;
      exception when others then
        v_err := sqlerrm;
      end;
      reset role;
      v_ok := v_err is null and v_bool = false;
      begin
        set local role authenticated;
        insert into public.candidate_documents (candidate_id, doc_type, status, file_url, uploaded_at)
        values (v_other, 'passport', 'uploaded', 'storage:candidate-files/' || v_other || '/passport/test.pdf', now());
        reset role;
        v_ok := false; v_err := 'belge eklendi';
      exception when insufficient_privilege then
        null;
      when others then
        v_ok := false; v_err := sqlerrm;
      end;
      reset role;
      v_lines := v_lines || format(E'\n[%s] d2 başka görevlinin adayına belge/dosya eklenemiyor %s',
        case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce('(' || v_err || ')', ''));
    end if;

    -- d1 / d3. Documents for own candidate
    if v_own1 is null then
      v_lines := v_lines || E'\n[YAPILAMADI] d1/d3 kendi adayı oluşmadı (b1)';
    else
      v_err := null; v_doc := null; v_bool := null; v_n := null;
      begin
        set local role authenticated;
        v_bool := public.can_access_candidate_file(v_own1::text || '/passport/test.pdf')
          or (public.is_staff() and public.field_officer_owns_candidate_id(public.candidate_file_owner(v_own1::text || '/passport/test.pdf')));
        insert into public.candidate_documents (candidate_id, doc_type, status, file_url, uploaded_at)
        values (v_own1, 'passport', 'uploaded', 'storage:candidate-files/' || v_own1 || '/passport/test.pdf', now())
        returning id into v_doc;
        select count(*) into v_n from public.candidate_documents where id = v_doc;
        reset role;
      exception when others then
        v_err := sqlerrm;
      end;
      reset role;
      v_ok := v_err is null and v_bool and v_doc is not null and v_n = 1;
      v_lines := v_lines || format(E'\n[%s] d1 kendi adayına dosya yolu izni, belge kaydı ve okuma var %s',
        case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce('(' || v_err || ')', ''));

      if v_doc is not null then
        v_err := null; v_upd := null;
        begin
          set local role authenticated;
          update public.candidate_documents set notes = 'TEST' where id = v_doc;
          get diagnostics v_upd = row_count;
          reset role;
        exception when others then
          v_err := sqlerrm;
        end;
        reset role;
        v_lines := v_lines || format(E'\n[%s] d3 belge UPDATE kuralı değişmedi: atanmamış kendi adayının belgesini güncelleyemiyor %s',
          case when v_err is null and v_upd = 0 then 'GEÇTİ' else 'KALDI' end, coalesce('(' || v_err || ')', ''));
      end if;
    end if;
  end if;

  -- e1. Upper management
  if v_um_uid is null then
    v_lines := v_lines || E'\n[YAPILAMADI] e1 giriş yapabilen Üst Yönetim hesabı yok';
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
    -- an existing officer code (the field officer's when there is one) is accepted
    if coalesce(v_a_code, v_src_code) is not null then
      begin
        set local role authenticated;
        insert into public.job_candidates (full_name, nationality, email, profession, sector, status, referral_code)
        values ('TEST aday UM2', 'Testland', 'test-aday-um2@example.invalid', 'TEST', 'construction', 'pending', coalesce(v_a_code, v_src_code))
        returning referral_code into v_code;
        reset role;
        v_ok := v_ok and v_code = coalesce(v_a_code, v_src_code);
      exception when others then
        v_ok := false; v_err := sqlerrm;
      end;
      reset role;
    end if;
    -- a made-up code is refused
    begin
      set local role authenticated;
      insert into public.job_candidates (full_name, nationality, email, profession, sector, status, referral_code)
      values ('TEST aday UM3', 'Testland', 'test-aday-um3@example.invalid', 'TEST', 'construction', 'pending', 'PVZZZZZZ');
      reset role;
      v_ok := false;
    exception when others then
      v_ok := v_ok and sqlerrm like '%unknown_supervisor_code%';
    end;
    reset role;
    v_lines := v_lines || format(E'\n[%s] e1 Üst Yönetim: kaydeden=kendisi; mevcut kaynak ülke/saha kodu seçilebiliyor, uydurma kod ret %s',
      case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce('(' || v_err || ')', ''));
  end if;

  -- e2. Source country
  if v_src_uid is null then
    v_lines := v_lines || E'\n[YAPILAMADI] e2 kodu olan, giriş yapabilen kaynak ülke sorumlusu yok';
  else
    perform set_config('request.jwt.claims', json_build_object('sub', v_src_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_src_uid::text, true);
    v_err := null; v_reg := null; v_code := null;
    begin
      set local role authenticated;
      insert into public.job_candidates (full_name, nationality, email, profession, sector, status, registered_by)
      values ('TEST aday KÜ', 'Testland', 'test-aday-src@example.invalid', 'TEST', 'construction', 'pending', v_b_staff)
      returning registered_by, referral_code into v_reg, v_code;
      reset role;
    exception when others then
      v_err := sqlerrm;
    end;
    reset role;
    v_ok := v_err is null and v_reg = v_src_staff and v_code = v_src_code;
    v_lines := v_lines || format(E'\n[%s] e2 kaynak ülke: kaydeden=kendisi, kod=kendi kodu %s',
      case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce('(' || v_err || ')', ''));
  end if;

  -- f1. Candidate account
  if v_cand_uid is null then
    v_lines := v_lines || E'\n[YAPILAMADI] f1 aday hesabı yok';
  else
    perform set_config('request.jwt.claims', json_build_object('sub', v_cand_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_cand_uid::text, true);
    v_err := null;
    begin
      set local role authenticated;
      insert into public.job_candidates (full_name, nationality, email, profession, sector, status, registered_by, kvkk_recorded_by)
      values ('TEST aday self', 'Testland', 'test-aday-self@example.invalid', 'TEST', 'construction', 'pending', v_b_staff, v_b_staff);
      reset role;
      select registered_by, kvkk_recorded_by into v_reg, v_krec
      from public.job_candidates where email = 'test-aday-self@example.invalid';
      v_ok := v_reg is null and v_krec is null;
    exception when insufficient_privilege then
      v_ok := true; v_err := 'aday doğrudan ekleyemiyor';
    when others then
      v_ok := false; v_err := sqlerrm;
    end;
    reset role;
    v_lines := v_lines || format(E'\n[%s] f1 aday hesabı kaydeden/KVKK kaydeden yazamıyor %s',
      case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce('(' || v_err || ')', ''));
  end if;

  -- f2. Anon
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
  v_lines := v_lines || format(E'\n[%s] f2 anon kaydeden/KVKK kaydeden yazamıyor %s',
    case when v_ok then 'GEÇTİ' else 'KALDI' end, coalesce('(' || v_err || ')', ''));

  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);

  v_pass := (length(v_lines) - length(replace(v_lines, '[GEÇTİ]', ''))) / length('[GEÇTİ]');
  v_fail := (length(v_lines) - length(replace(v_lines, '[KALDI]', ''))) / length('[KALDI]');
  v_skip := (length(v_lines) - length(replace(v_lines, '[YAPILAMADI]', ''))) / length('[YAPILAMADI]');
  raise exception 'SONUC: GEÇTİ=% KALDI=% YAPILAMADI=% (hiçbir şey yazılmadı)%', v_pass, v_fail, v_skip, v_lines;
end
$$;
