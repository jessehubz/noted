-- Noted: anonymous, location-pinned confessional notes.
-- No accounts, no edits, no deletes for anonymous users — notes are immutable once posted.

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) > 0 and char_length(content) <= 300),
  latitude double precision not null check (latitude >= -90 and latitude <= 90),
  longitude double precision not null check (longitude >= -180 and longitude <= 180),
  spotify_track_id text check (spotify_track_id is null or spotify_track_id ~ '^[A-Za-z0-9]{10,30}$'),
  created_at timestamptz not null default now()
);

comment on table public.notes is 'Anonymous notes pinned to a real-world GPS location. Immutable: insert + select only, no update/delete policies exist.';

-- Index for viewport bounding-box queries (lat/lng range scans).
create index if not exists notes_latitude_idx on public.notes (latitude);
create index if not exists notes_longitude_idx on public.notes (longitude);
create index if not exists notes_created_at_idx on public.notes (created_at desc);

alter table public.notes enable row level security;

-- Anyone (anon or authenticated) can read all notes. There is no user data to protect.
create policy "Public notes are viewable by everyone"
  on public.notes
  for select
  to anon, authenticated
  using (true);

-- Anyone can post a note. Table-level CHECK constraints above enforce the 300-char
-- limit and valid coordinate ranges; there is intentionally no way to identify the
-- poster (no user_id/session column).
create policy "Anyone can post a note"
  on public.notes
  for insert
  to anon, authenticated
  with check (true);

-- No update or delete policy is defined for anon/authenticated roles, so notes
-- cannot be edited or removed once created — this is enforced by RLS default-deny.
