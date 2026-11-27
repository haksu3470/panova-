-- Salt okuma. Beklenen: üç sütun da true.
select not has_function_privilege('authenticated', 'public.claim_first_staff(text,text)', 'execute') as authenticated_cagiramaz,
       not has_function_privilege('anon', 'public.claim_first_staff(text,text)', 'execute') as anon_cagiramaz,
       (select count(*) from public.staff_members where coalesce(is_active, true)) > 0 as personel_var;
