-- Doğrulama: 20261127150000_login_attempts.sql (migration SONRASI).
-- 1-4 salt okuma. 5: deneme kayıtları eklenir ve ROLLBACK ile geri alınır.
begin;
create temp table _sonuc (no int, kontrol text, sonuc text) on commit drop;

insert into _sonuc
select 1, 'tablo var, RLS açık',
  case when (select relrowsecurity from pg_class where oid = to_regclass('public.login_attempts')) then 'GEÇTİ' else 'KALDI' end
union all select 2, 'anon/authenticated tabloyu okuyamaz',
  case when not has_table_privilege('anon', 'public.login_attempts', 'select')
        and not has_table_privilege('authenticated', 'public.login_attempts', 'select') then 'GEÇTİ' else 'KALDI' end
union all select 3, 'fonksiyon SECURITY DEFINER, search_path boş',
  case when (select prosecdef and proconfig @> array['search_path=""'] from pg_proc
             where oid = to_regprocedure('public.login_attempt_allowed(text,integer,integer)')) then 'GEÇTİ' else 'KALDI' end
union all select 4, 'yalnız service_role çağırabilir',
  case when has_function_privilege('service_role', 'public.login_attempt_allowed(text,integer,integer)', 'execute')
        and not has_function_privilege('anon', 'public.login_attempt_allowed(text,integer,integer)', 'execute')
        and not has_function_privilege('authenticated', 'public.login_attempt_allowed(text,integer,integer)', 'execute') then 'GEÇTİ' else 'KALDI' end;

do $$
declare
  v_key text := 'test:' || gen_random_uuid();
  v_ok boolean := true;
  i int;
begin
  for i in 1..3 loop
    v_ok := v_ok and public.login_attempt_allowed(v_key, 3, 600);
  end loop;
  insert into _sonuc values (5, 'sınır 3: ilk 3 izinli, 4. reddedilir',
    case when v_ok and not public.login_attempt_allowed(v_key, 3, 600) then 'GEÇTİ' else 'KALDI' end);
end $$;

select no::text, kontrol, sonuc from _sonuc
union all
select 'TOPLAM', 'GEÇTİ ' || count(*) filter (where sonuc = 'GEÇTİ') || ' / KALDI ' || count(*) filter (where sonuc = 'KALDI'), ''
from _sonuc
order by 1;
rollback;
