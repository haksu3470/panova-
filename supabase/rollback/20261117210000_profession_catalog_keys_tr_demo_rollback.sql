-- Rollback of 20261117210000_profession_catalog_keys_tr_demo.sql
-- Restores only rows backed up by that migration's mapped values.
begin;

update public.job_candidates c
set profession = b.old_value
from public.profession_key_backup b
where b.table_name = 'job_candidates'
  and b.column_name = 'profession'
  and b.row_id = c.id
  and b.new_value in ('cook', 'carpenter', 'warehouse_worker')
  and lower(btrim(b.old_value)) in ('aşçı', 'kalıpçı', 'depo görevlisi');

update public.job_requests r
set position_title = b.old_value
from public.profession_key_backup b
where b.table_name = 'job_requests'
  and b.column_name = 'position_title'
  and b.row_id = r.id
  and b.new_value in ('cook', 'carpenter', 'warehouse_worker')
  and lower(btrim(b.old_value)) in ('aşçı', 'kalıpçı', 'depo görevlisi');

delete from public.profession_key_backup b
where b.new_value in ('cook', 'carpenter', 'warehouse_worker')
  and lower(btrim(b.old_value)) in ('aşçı', 'kalıpçı', 'depo görevlisi');

notify pgrst, 'reload schema';
commit;
