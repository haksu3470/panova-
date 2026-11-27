-- Geri alma: anon_register_employer kuralını canlıdaki eski haliyle geri koyar.
begin;
drop policy if exists anon_register_employer on public.employers;
create policy anon_register_employer on public.employers
  for insert to anon
  with check (auth_user_id is null);
commit;
notify pgrst, 'reload schema';
