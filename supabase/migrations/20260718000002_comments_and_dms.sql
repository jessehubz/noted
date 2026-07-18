-- ─────────────────────────────────────────────────────────────
-- Comments: public, tied to a note, requires auth.
-- The note itself stays anonymous; comments are by signed-in users.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  note_id    uuid not null references public.notes(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists comments_note_id_idx on public.comments (note_id);
create index if not exists comments_created_at_idx on public.comments (created_at);

alter table public.comments enable row level security;

-- Anyone can read comments on a note.
create policy "Comments are public"
  on public.comments for select
  using (true);

-- Signed-in users can post a comment.
create policy "Auth users can comment"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can delete their own comments.
create policy "Users delete own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- DM threads: one thread per (sender, note_author_token) pair.
-- Because notes are anonymous we identify the "author" by a
-- stable random token stored in the note itself (optional).
-- A simpler model: threads are between two user_ids.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.dm_threads (
  id            uuid primary key default gen_random_uuid(),
  note_id       uuid not null references public.notes(id) on delete cascade,
  -- The user who initiated the DM (clicked "Message author").
  sender_id     uuid not null references auth.users(id) on delete cascade,
  -- A display label shown to the sender so they know which note they messaged about.
  note_preview  text,
  created_at    timestamptz not null default now(),
  unique (note_id, sender_id)
);

create index if not exists dm_threads_sender_idx on public.dm_threads (sender_id);
create index if not exists dm_threads_note_idx   on public.dm_threads (note_id);

alter table public.dm_threads enable row level security;

-- Only the sender can see their own threads (notes are anonymous — no recipient account).
create policy "Sender sees own threads"
  on public.dm_threads for select
  to authenticated
  using (auth.uid() = sender_id);

create policy "Sender creates thread"
  on public.dm_threads for insert
  to authenticated
  with check (auth.uid() = sender_id);

-- ─────────────────────────────────────────────────────────────
-- DM messages: messages inside a thread.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.dm_messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.dm_threads(id) on delete cascade,
  sender_id  uuid not null references auth.users(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists dm_messages_thread_idx on public.dm_messages (thread_id, created_at);

alter table public.dm_messages enable row level security;

-- Only thread participants can read/write messages.
create policy "Thread participants read messages"
  on public.dm_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.dm_threads t
      where t.id = thread_id
        and t.sender_id = auth.uid()
    )
  );

create policy "Thread participants send messages"
  on public.dm_messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.dm_threads t
      where t.id = thread_id
        and t.sender_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- User profiles: display name for signed-in users.
-- Auto-created on first sign-in via a trigger.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 40),
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are public"
  on public.profiles for select using (true);

create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
