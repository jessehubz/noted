-- Admin dashboard: flagged notes, banned users, soft-delete for notes

-- ─── Soft delete on notes ────────────────────────────────────────
alter table public.notes
  add column if not exists is_deleted boolean not null default false;

-- Update the public select policy to exclude deleted notes
drop policy if exists "Public notes are viewable by everyone" on public.notes;
create policy "Public notes are viewable by everyone"
  on public.notes
  for select
  to anon, authenticated
  using (is_deleted = false);

-- Service role can see all notes (including deleted) for admin
create policy "Service role sees all notes"
  on public.notes for select
  to service_role
  using (true);

-- Service role can update notes (for soft delete)
create policy "Service role can update notes"
  on public.notes for update
  to service_role
  using (true)
  with check (true);

-- ─── Flagged notes ───────────────────────────────────────────────
create table if not exists public.flagged_notes (
  id         uuid primary key default gen_random_uuid(),
  note_id    uuid not null references public.notes(id) on delete cascade,
  reason     text not null default 'manual review',
  flagged_by text, -- clerk user id or 'system'
  status     text not null default 'pending' check (status in ('pending', 'approved', 'removed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (note_id, flagged_by)
);

create index if not exists flagged_notes_status_idx on public.flagged_notes (status);
create index if not exists flagged_notes_note_id_idx on public.flagged_notes (note_id);

alter table public.flagged_notes enable row level security;

-- Only service role can manage flags
create policy "Service role manages flags"
  on public.flagged_notes for all
  to service_role
  using (true)
  with check (true);

-- ─── Banned users ────────────────────────────────────────────────
create table if not exists public.banned_users (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null unique, -- clerk user id
  reason     text,
  banned_at  timestamptz not null default now(),
  banned_by  text -- admin clerk user id
);

create index if not exists banned_users_user_id_idx on public.banned_users (user_id);

alter table public.banned_users enable row level security;

-- Only service role can manage bans
create policy "Service role manages bans"
  on public.banned_users for all
  to service_role
  using (true)
  with check (true);

-- ─── Analytics helper: notes per day view ────────────────────────
create or replace view public.notes_daily_stats as
select
  date_trunc('day', created_at)::date as day,
  count(*) as note_count
from public.notes
where is_deleted = false
group by 1
order by 1 desc
limit 30;
