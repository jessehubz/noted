-- Votes: simple upvote/downvote per note.
-- One vote per IP hash (anonymized) to prevent spam without requiring auth.
create table if not exists public.votes (
  id         uuid primary key default gen_random_uuid(),
  note_id    uuid not null references public.notes(id) on delete cascade,
  value      smallint not null check (value in (-1, 1)),
  voter_hash text not null,
  created_at timestamptz not null default now(),
  unique (note_id, voter_hash)
);

create index if not exists votes_note_id_idx on public.votes (note_id);

alter table public.votes enable row level security;

-- Anyone can read vote counts.
create policy "Votes are public"
  on public.votes for select using (true);

-- Anyone can vote (anon or authenticated).
create policy "Anyone can vote"
  on public.votes for insert
  to anon, authenticated
  with check (true);

-- Prevent changing a vote (delete + re-insert is fine via the unique constraint).
-- No update policy = RLS default-deny for updates.

-- Add a score column to notes for fast sorting (maintained via trigger).
alter table public.notes
  add column if not exists score integer not null default 0;

create index if not exists notes_score_idx on public.notes (score desc);

-- Trigger: update score on notes whenever a vote is inserted.
create or replace function public.update_note_score()
returns trigger language plpgsql security definer
as $$
begin
  update public.notes
  set score = (
    select coalesce(sum(value), 0) from public.votes where note_id = new.note_id
  )
  where id = new.note_id;
  return new;
end;
$$;

drop trigger if exists votes_after_insert on public.votes;
create trigger votes_after_insert
  after insert on public.votes
  for each row execute function public.update_note_score();
