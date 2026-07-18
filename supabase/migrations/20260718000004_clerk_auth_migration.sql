-- Migration: Switch from Supabase Auth to Clerk
-- Must drop ALL policies that reference these columns (even cross-table via subqueries)
-- BEFORE altering any column types.

-- ══════════════════════════════════════════════════════════════════
-- PHASE 1: Drop ALL RLS policies that reference user_id/sender_id
-- ══════════════════════════════════════════════════════════════════

-- Comments policies
drop policy if exists "Auth users can comment" on public.comments;
drop policy if exists "Users delete own comments" on public.comments;

-- DM threads policies
drop policy if exists "Sender sees own threads" on public.dm_threads;
drop policy if exists "Sender creates thread" on public.dm_threads;

-- DM messages policies (these reference dm_threads.sender_id via subquery!)
drop policy if exists "Thread participants read messages" on public.dm_messages;
drop policy if exists "Thread participants send messages" on public.dm_messages;

-- Profiles policies
drop policy if exists "Users update own profile" on public.profiles;

-- ══════════════════════════════════════════════════════════════════
-- PHASE 2: Drop foreign key constraints
-- ══════════════════════════════════════════════════════════════════

alter table public.comments drop constraint if exists comments_user_id_fkey;
alter table public.dm_threads drop constraint if exists dm_threads_sender_id_fkey;
alter table public.dm_messages drop constraint if exists dm_messages_sender_id_fkey;
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles drop constraint if exists profiles_pkey;

-- ══════════════════════════════════════════════════════════════════
-- PHASE 3: Alter column types (uuid -> text for Clerk user IDs)
-- ══════════════════════════════════════════════════════════════════

alter table public.comments alter column user_id type text;
alter table public.dm_threads alter column sender_id type text;
alter table public.dm_messages alter column sender_id type text;
alter table public.profiles alter column id type text;
alter table public.profiles add primary key (id);

-- ══════════════════════════════════════════════════════════════════
-- PHASE 4: Recreate RLS policies for service_role access
-- (Auth is now verified in server actions via Clerk, not at DB level)
-- ══════════════════════════════════════════════════════════════════

-- Comments: public read stays (from original migration), service_role writes
create policy "Service role can insert comments"
  on public.comments for insert
  to service_role
  with check (true);

create policy "Service role can delete comments"
  on public.comments for delete
  to service_role
  using (true);

-- DM threads: service_role only
create policy "Service role select threads"
  on public.dm_threads for select
  to service_role
  using (true);

create policy "Service role insert threads"
  on public.dm_threads for insert
  to service_role
  with check (true);

-- DM messages: service_role only
create policy "Service role select messages"
  on public.dm_messages for select
  to service_role
  using (true);

create policy "Service role insert messages"
  on public.dm_messages for insert
  to service_role
  with check (true);

-- Profiles: public read stays, service_role manages
create policy "Service role manages profiles"
  on public.profiles for all
  to service_role
  using (true)
  with check (true);

-- ══════════════════════════════════════════════════════════════════
-- PHASE 5: Cleanup old triggers
-- ══════════════════════════════════════════════════════════════════

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- ══════════════════════════════════════════════════════════════════
-- PHASE 6: Add IP hash column for rate limiting
-- ══════════════════════════════════════════════════════════════════

alter table public.notes
  add column if not exists ip_hash text;

create index if not exists notes_ip_hash_created_idx
  on public.notes (ip_hash, created_at desc)
  where ip_hash is not null;
