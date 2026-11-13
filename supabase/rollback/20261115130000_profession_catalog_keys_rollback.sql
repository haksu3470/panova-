-- Restores the legacy profession / position values saved by
-- 20261115130000_profession_catalog_keys.sql. A row is restored only while it still
-- holds the value the migration wrote; rows edited since are left alone.
-- The backup table is kept (drop it by hand when no longer needed).
begin;

update public.job_candidates c
set profession = b.old_value
from public.profession_key_backup b
where b.table_name = 'job_candidates'
  and b.column_name = 'profession'
  and b.row_id = c.id
  and c.profession::text = b.new_value;

update public.job_requests r
set position_title = b.old_value
from public.profession_key_backup b
where b.table_name = 'job_requests'
  and b.column_name = 'position_title'
  and b.row_id = r.id
  and r.position_title::text = b.new_value;

commit;
