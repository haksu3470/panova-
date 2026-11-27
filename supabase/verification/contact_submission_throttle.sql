-- Doğrulama: 20261127140000_contact_submission_throttle.sql (migration SONRASI).
-- 1-4 salt okuma. 5-6 senaryo: anon olarak deneme kayıtları eklenir ve ROLLBACK ile geri alınır.
begin;
create temp table _sonuc (no int, kontrol text, sonuc text) on commit drop;

insert into _sonuc
select 1, 'tetikleyici var',
  case when exists (select 1 from pg_trigger where tgname = 'contact_submissions_throttle'
                    and tgrelid = 'public.contact_submissions'::regclass) then 'GEÇTİ' else 'KALDI' end
union all select 2, 'fonksiyon SECURITY DEFINER, search_path boş',
  case when (select prosecdef and proconfig @> array['search_path=""'] from pg_proc
             where oid = to_regprocedure('public.contact_submission_throttle()')) then 'GEÇTİ' else 'KALDI' end
union all select 3, 'anon/authenticated fonksiyonu doğrudan çağıramaz',
  case when not has_function_privilege('anon', 'public.contact_submission_throttle()', 'execute')
        and not has_function_privilege('authenticated', 'public.contact_submission_throttle()', 'execute') then 'GEÇTİ' else 'KALDI' end
union all select 4, 'uzunluk kısıtı var',
  case when exists (select 1 from pg_constraint where conname = 'contact_submissions_lengths') then 'GEÇTİ' else 'KALDI' end;

do $$
declare
  v_mail text := 'sinir-testi-' || gen_random_uuid() || '@example.invalid';
  v_first_ok boolean := true; v_blocked boolean := false; v_long_blocked boolean := false;
  i int;
begin
  set local role anon;
  begin
    for i in 1..3 loop
      insert into public.contact_submissions (full_name, email, phone, notes, company_key, company_name)
      values ('Sınır Testi', v_mail, '0', 'test', 'hr', 'test');
    end loop;
  exception when others then v_first_ok := false;
  end;
  begin
    insert into public.contact_submissions (full_name, email, phone, notes, company_key, company_name)
    values ('Sınır Testi', v_mail, '0', 'test', 'hr', 'test');
  exception when others then v_blocked := (sqlerrm = 'contact_rate_limited');
  end;
  begin
    insert into public.contact_submissions (full_name, email, phone, notes, company_key, company_name)
    values (repeat('x', 121), 'uzun-' || gen_random_uuid() || '@example.invalid', '0', 'test', 'hr', 'test');
  exception when check_violation then v_long_blocked := true;
            when others then v_long_blocked := false;
  end;
  reset role;
  insert into _sonuc values
    (5, 'aynı e-posta: ilk 3 kabul, 4. reddedilir (saatlik sınır doluysa KALDI olabilir)',
     case when v_first_ok and v_blocked then 'GEÇTİ' else 'KALDI' end),
    (6, 'çok uzun ad reddedilir', case when v_long_blocked then 'GEÇTİ' else 'KALDI' end);
end $$;

select no::text, kontrol, sonuc from _sonuc
union all
select 'TOPLAM', 'GEÇTİ ' || count(*) filter (where sonuc = 'GEÇTİ') || ' / KALDI ' || count(*) filter (where sonuc = 'KALDI')
       || ' / YAPILAMADI ' || count(*) filter (where sonuc = 'YAPILAMADI'), ''
from _sonuc
order by 1;
rollback;
