-- Personel davet akışı: davet bilgisi + e-posta eşleşmesiyle hesap bağlama
alter table public.staff_members
  add column if not exists invited_at timestamptz,
  add column if not exists invited_by uuid;

create or replace function public.is_upper_management()
returns boolean language sql stable security definer set search_path to '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'staff' and p.staff_role = 'upper_management'
  );
$$;

-- Yalnızca üst yönetim çağırabilir. Henüz bağlanmamış kaydı oluşturur/günceller;
-- hesabı bağlı (aktif) personelin kaydına dokunmaz.
create or replace function public.invite_staff(p_email text, p_name text, p_staff_role text)
returns public.staff_members language plpgsql security definer set search_path to '' as $$
declare
  v_email text := lower(trim(p_email));
  v_row public.staff_members;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.is_upper_management() then raise exception 'Only upper_management can invite'; end if;
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Invalid email'; end if;
  if p_staff_role is null or p_staff_role not in
     ('upper_management','source_country','target_country','field_officer','finance','limited') then
    raise exception 'Invalid staff_role';
  end if;

  select * into v_row from public.staff_members where lower(email) = v_email limit 1;
  if found and v_row.auth_user_id is not null then
    raise exception 'Staff already active';
  end if;

  if found then
    update public.staff_members
       set name = coalesce(nullif(trim(p_name),''), name), role_level = p_staff_role,
           invited_at = now(), invited_by = auth.uid(), is_active = true, updated_at = now()
     where id = v_row.id returning * into v_row;
  else
    insert into public.staff_members (id, name, email, role_level, is_active, invited_at, invited_by)
    values (gen_random_uuid(), coalesce(nullif(trim(p_name),''), v_email), v_email, p_staff_role, true, now(), auth.uid())
    returning * into v_row;
  end if;
  return v_row;
end; $$;

-- Giriş yapan kullanıcı, doğrulanmış e-postası davetli bir personel kaydıyla eşleşirse bağlanır.
create or replace function public.link_my_staff()
returns uuid language plpgsql security definer set search_path to '' as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_confirmed timestamptz;
  v_staff public.staff_members;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from public.profiles where id = v_uid and role = 'staff') then
    return (select linked_staff_id from public.profiles where id = v_uid);
  end if;
  select lower(email), email_confirmed_at into v_email, v_confirmed from auth.users where id = v_uid;
  if v_confirmed is null then raise exception 'Email not confirmed'; end if;

  select * into v_staff from public.staff_members
   where lower(email) = v_email and auth_user_id is null
     and coalesce(is_active, true) and invited_at is not null
   limit 1;
  if not found then raise exception 'No pending staff invite for this email'; end if;

  update public.staff_members set auth_user_id = v_uid, updated_at = now() where id = v_staff.id;
  insert into public.profiles (id, role, staff_role, linked_staff_id, full_name)
  values (v_uid, 'staff', v_staff.role_level, v_staff.id, v_staff.name)
  on conflict (id) do update
    set role = 'staff', staff_role = excluded.staff_role, linked_staff_id = excluded.linked_staff_id,
        full_name = excluded.full_name, updated_at = now();
  return v_staff.id;
end; $$;

revoke all on function public.invite_staff(text, text, text) from public, anon;
revoke all on function public.link_my_staff() from public, anon;
revoke all on function public.is_upper_management() from public, anon;
grant execute on function public.invite_staff(text, text, text) to authenticated;
grant execute on function public.link_my_staff() to authenticated;
grant execute on function public.is_upper_management() to authenticated;
