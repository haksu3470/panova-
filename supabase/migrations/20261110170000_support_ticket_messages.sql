-- Threaded support replies. Do not apply this file from CI. Review it, then run it by hand.
-- The original request stays on candidate_support_tickets.message.
-- Each staff or candidate follow-up is a row here.
-- A candidate reads and writes only messages on their own ticket.
-- Staff use the same read scope as candidate_support_tickets.

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.candidate_support_tickets (id) on delete cascade,
  author_role text not null check (author_role in ('staff', 'candidate', 'employer')),
  author_id uuid,
  author_name text,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint support_ticket_messages_body_not_blank check (char_length(btrim(body)) > 0)
);

create index if not exists support_ticket_messages_ticket_idx
  on public.support_ticket_messages (ticket_id, created_at);

comment on table public.support_ticket_messages is
  'Replies on a support ticket. The opening message stays on candidate_support_tickets.message.';

alter table public.support_ticket_messages enable row level security;

insert into public.support_ticket_messages (ticket_id, author_role, author_id, author_name, body, created_at)
select t.id, 'staff', t.replied_by, t.replied_by_name, btrim(t.admin_reply), coalesce(t.replied_at, t.created_at, now())
from public.candidate_support_tickets t
where nullif(btrim(t.admin_reply), '') is not null
  and not exists (
    select 1 from public.support_ticket_messages m
    where m.ticket_id = t.id and m.author_role = 'staff' and m.body = btrim(t.admin_reply)
  );

create or replace function public.stamp_support_message()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_ticket public.candidate_support_tickets;
begin
  select * into v_ticket from public.candidate_support_tickets where id = new.ticket_id;
  if not found then
    raise exception 'ticket_missing';
  end if;

  new.body := btrim(coalesce(new.body, ''));
  if new.body = '' then
    raise exception 'message_empty';
  end if;

  if public.is_staff() and (
    public.is_portal_manager()
    or (v_ticket.candidate_id is not null and public.staff_can_read_candidate(v_ticket.candidate_id))
    or (v_ticket.employer_id is not null and public.staff_can_read_employer(v_ticket.employer_id))
  ) then
    new.author_role := 'staff';
    new.author_id := auth.uid();
    return new;
  end if;

  if lower(coalesce(v_ticket.status, '')) = 'closed' then
    raise exception 'ticket_closed';
  end if;

  if v_ticket.candidate_id is not null and v_ticket.candidate_id = public.my_candidate_id() and public.email_access_ok() then
    new.author_role := 'candidate';
    new.author_id := auth.uid();
    return new;
  end if;

  if v_ticket.employer_id is not null
     and v_ticket.candidate_id is null
     and v_ticket.employer_id = public.my_employer_id()
     and public.email_access_ok() then
    new.author_role := 'employer';
    new.author_id := auth.uid();
    return new;
  end if;

  raise exception 'ticket_forbidden';
end;
$$;

revoke all on function public.stamp_support_message() from public, anon, authenticated;

drop trigger if exists support_ticket_messages_stamp on public.support_ticket_messages;
create trigger support_ticket_messages_stamp
  before insert on public.support_ticket_messages
  for each row
  execute function public.stamp_support_message();

create or replace function public.guard_support_message_update()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if public.is_staff() then
    return new;
  end if;
  if new.ticket_id is distinct from old.ticket_id
     or new.author_role is distinct from old.author_role
     or new.author_id is distinct from old.author_id
     or new.author_name is distinct from old.author_name
     or new.body is distinct from old.body
     or new.created_at is distinct from old.created_at
     or old.author_role <> 'staff'
  then
    raise exception 'message_locked';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_support_message_update() from public, anon, authenticated;

drop trigger if exists support_ticket_messages_guard_update on public.support_ticket_messages;
create trigger support_ticket_messages_guard_update
  before update on public.support_ticket_messages
  for each row
  execute function public.guard_support_message_update();

create or replace function public.guard_candidate_ticket_update()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if public.is_staff() then
    return new;
  end if;
  if old.candidate_id is distinct from public.my_candidate_id() or not public.email_access_ok() then
    raise exception 'ticket_forbidden';
  end if;
  if lower(coalesce(old.status, '')) = 'closed' then
    raise exception 'ticket_closed';
  end if;
  if new.subject is distinct from old.subject
     or new.message is distinct from old.message
     or new.candidate_id is distinct from old.candidate_id
     or new.candidate_name is distinct from old.candidate_name
     or new.employer_id is distinct from old.employer_id
     or new.request_id is distinct from old.request_id
     or new.category is distinct from old.category
     or new.admin_reply is distinct from old.admin_reply
     or new.replied_at is distinct from old.replied_at
     or new.replied_by is distinct from old.replied_by
     or new.replied_by_name is distinct from old.replied_by_name
     or new.is_demo is distinct from old.is_demo
     or new.created_at is distinct from old.created_at
  then
    raise exception 'ticket_fields_locked';
  end if;
  if lower(coalesce(new.status, '')) <> 'open' then
    raise exception 'ticket_status_invalid';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.guard_candidate_ticket_update() from public, anon, authenticated;

drop trigger if exists candidate_support_tickets_guard_candidate on public.candidate_support_tickets;
create trigger candidate_support_tickets_guard_candidate
  before update on public.candidate_support_tickets
  for each row
  execute function public.guard_candidate_ticket_update();

drop policy if exists cand_tickets_update on public.candidate_support_tickets;
create policy cand_tickets_update on public.candidate_support_tickets
  for update to authenticated
  using (
    candidate_id = public.my_candidate_id()
    and public.email_access_ok()
    and lower(coalesce(status, '')) <> 'closed'
  )
  with check (
    candidate_id = public.my_candidate_id()
    and public.email_access_ok()
    and lower(coalesce(status, '')) = 'open'
  );

drop policy if exists cand_messages_select on public.support_ticket_messages;
create policy cand_messages_select on public.support_ticket_messages
  for select to authenticated
  using (
    public.email_access_ok()
    and exists (
      select 1 from public.candidate_support_tickets t
      where t.id = ticket_id and t.candidate_id = public.my_candidate_id()
    )
  );

drop policy if exists cand_messages_insert on public.support_ticket_messages;
create policy cand_messages_insert on public.support_ticket_messages
  for insert to authenticated
  with check (
    author_role = 'candidate'
    and public.email_access_ok()
    and exists (
      select 1 from public.candidate_support_tickets t
      where t.id = ticket_id
        and t.candidate_id = public.my_candidate_id()
        and lower(coalesce(t.status, '')) <> 'closed'
    )
  );

drop policy if exists cand_messages_update on public.support_ticket_messages;
create policy cand_messages_update on public.support_ticket_messages
  for update to authenticated
  using (
    author_role = 'staff'
    and public.email_access_ok()
    and exists (
      select 1 from public.candidate_support_tickets t
      where t.id = ticket_id and t.candidate_id = public.my_candidate_id()
    )
  )
  with check (
    author_role = 'staff'
    and public.email_access_ok()
    and exists (
      select 1 from public.candidate_support_tickets t
      where t.id = ticket_id and t.candidate_id = public.my_candidate_id()
    )
  );

drop policy if exists emp_messages_select on public.support_ticket_messages;
create policy emp_messages_select on public.support_ticket_messages
  for select to authenticated
  using (
    public.email_access_ok()
    and exists (
      select 1 from public.candidate_support_tickets t
      where t.id = ticket_id
        and t.employer_id = public.my_employer_id()
        and t.candidate_id is null
    )
  );

drop policy if exists emp_messages_insert on public.support_ticket_messages;
create policy emp_messages_insert on public.support_ticket_messages
  for insert to authenticated
  with check (
    author_role = 'employer'
    and public.email_access_ok()
    and exists (
      select 1 from public.candidate_support_tickets t
      where t.id = ticket_id
        and t.employer_id = public.my_employer_id()
        and t.candidate_id is null
        and lower(coalesce(t.status, '')) <> 'closed'
    )
  );

drop policy if exists staff_messages_select on public.support_ticket_messages;
create policy staff_messages_select on public.support_ticket_messages
  for select to authenticated
  using (
    public.is_staff()
    and exists (
      select 1 from public.candidate_support_tickets t
      where t.id = ticket_id
        and (
          public.is_portal_manager()
          or (t.candidate_id is not null and public.staff_can_read_candidate(t.candidate_id))
          or (t.employer_id is not null and public.staff_can_read_employer(t.employer_id))
        )
    )
  );

drop policy if exists staff_messages_insert on public.support_ticket_messages;
create policy staff_messages_insert on public.support_ticket_messages
  for insert to authenticated
  with check (
    author_role = 'staff'
    and public.is_staff()
    and exists (
      select 1 from public.candidate_support_tickets t
      where t.id = ticket_id
        and (
          public.is_portal_manager()
          or (t.candidate_id is not null and public.staff_can_read_candidate(t.candidate_id))
          or (t.employer_id is not null and public.staff_can_read_employer(t.employer_id))
        )
    )
  );

revoke all on table public.support_ticket_messages from public, anon;
grant select, insert, update on table public.support_ticket_messages to authenticated;

notify pgrst, 'reload schema';
