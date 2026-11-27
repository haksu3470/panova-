-- Doğrulama: 20261127130000_guard_self_update_columns.sql (migration SONRASI).
-- 1-6 salt okuma. 7-8 senaryo: gerçek bir aday/işveren oturumu taklit edilir, güncelleme
-- denenir ve her şey ROLLBACK ile geri alınır (hiçbir satır kalıcı değişmez).
begin;
create temp table _sonuc (no int, kontrol text, sonuc text) on commit drop;

insert into _sonuc
select 1, 'fonksiyon var ve SECURITY INVOKER',
  case when to_regprocedure('public.guard_self_update_columns()') is null then 'KALDI'
       when not (select prosecdef from pg_proc where oid = 'public.guard_self_update_columns()'::regprocedure) then 'GEÇTİ' else 'KALDI' end
union all select 2, 'job_candidates tetikleyicisi var',
  case when exists (select 1 from pg_trigger where tgname = 'job_candidates_guard_self_update' and tgrelid = 'public.job_candidates'::regclass) then 'GEÇTİ' else 'KALDI' end
union all select 3, 'employers tetikleyicisi var',
  case when exists (select 1 from pg_trigger where tgname = 'employers_guard_self_update' and tgrelid = 'public.employers'::regclass) then 'GEÇTİ' else 'KALDI' end
union all select 4, 'anon/authenticated fonksiyonu doğrudan çağıramaz',
  case when not has_function_privilege('anon', 'public.guard_self_update_columns()', 'execute')
        and not has_function_privilege('authenticated', 'public.guard_self_update_columns()', 'execute') then 'GEÇTİ' else 'KALDI' end
union all select 5, 'cand_self_update ve emp_self_update duruyor',
  case when (select count(*) from pg_policies where schemaname = 'public' and policyname in ('cand_self_update', 'emp_self_update')) = 2 then 'GEÇTİ' else 'KALDI' end
union all select 6, 'personel güncelleme politikaları duruyor',
  case when (select count(*) from pg_policies where schemaname = 'public' and policyname in ('staff_update_candidates', 'staff_update_employers')) = 2 then 'GEÇTİ' else 'KALDI' end;

-- 7-8: senaryo (oturumu bağlı aday / işveren yoksa YAPILAMADI)
do $$
declare
  v_uid uuid; v_id uuid; v_rows int; v_ok_profile boolean := false; v_blocked boolean := false;
begin
  -- Aday
  select c.auth_user_id, c.id into v_uid, v_id from public.job_candidates c
  where c.auth_user_id is not null
    and not exists (select 1 from public.staff_members s where s.auth_user_id = c.auth_user_id)
  limit 1;
  if v_uid is null then
    insert into _sonuc values (7, 'aday: profil alanı güncellenir, notes engellenir', 'YAPILAMADI');
  else
    perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      update public.job_candidates set full_name = full_name || '' where id = v_id;
      get diagnostics v_rows = row_count;
      v_ok_profile := v_rows = 1;
    exception when others then v_ok_profile := false;
    end;
    begin
      update public.job_candidates set notes = coalesce(notes, '') || 'x' where id = v_id;
    exception when others then v_blocked := (sqlerrm = 'self_update_column_forbidden');
    end;
    reset role;
    insert into _sonuc values (7, 'aday: profil alanı güncellenir, notes engellenir',
      case when v_ok_profile and v_blocked then 'GEÇTİ' else 'KALDI' end);
  end if;

  -- İşveren
  v_uid := null; v_ok_profile := false; v_blocked := false;
  select e.auth_user_id, e.id into v_uid, v_id from public.employers e
  where e.auth_user_id is not null
    and not exists (select 1 from public.staff_members s where s.auth_user_id = e.auth_user_id)
  limit 1;
  if v_uid is null then
    insert into _sonuc values (8, 'işveren: firma adı güncellenir, compliance_status engellenir', 'YAPILAMADI');
  else
    perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    set local role authenticated;
    begin
      update public.employers set company_name = company_name where id = v_id;
      get diagnostics v_rows = row_count;
      v_ok_profile := v_rows = 1;
    exception when others then v_ok_profile := false;
    end;
    begin
      update public.employers set compliance_status = 'self-approved-test' where id = v_id;
    exception when others then v_blocked := (sqlerrm = 'self_update_column_forbidden');
    end;
    reset role;
    insert into _sonuc values (8, 'işveren: firma adı güncellenir, compliance_status engellenir',
      case when v_ok_profile and v_blocked then 'GEÇTİ' else 'KALDI' end);
  end if;
end $$;

select no::text, kontrol, sonuc from _sonuc
union all
select 'TOPLAM', 'GEÇTİ ' || count(*) filter (where sonuc = 'GEÇTİ') || ' / KALDI ' || count(*) filter (where sonuc = 'KALDI')
       || ' / YAPILAMADI ' || count(*) filter (where sonuc = 'YAPILAMADI'), ''
from _sonuc
order by 1;
rollback;
