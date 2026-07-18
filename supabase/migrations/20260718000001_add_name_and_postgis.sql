-- Add optional display name to notes.
alter table public.notes
  add column if not exists display_name text
    check (display_name is null or (char_length(display_name) >= 1 and char_length(display_name) <= 40));

comment on column public.notes.display_name is
  'Optional self-chosen display name (max 40 chars, no auth).';

-- PostGIS lives in the extensions schema on Supabase hosted.
create extension if not exists postgis with schema extensions;

-- Expose extensions types to public search_path for this session.
set search_path to public, extensions;

-- Add geography column (schema-qualified type).
alter table public.notes
  add column if not exists location extensions.geography(Point, 4326);

-- Backfill existing rows.
update public.notes
  set location = extensions.st_point(longitude, latitude)::extensions.geography
  where location is null;

-- Spatial index.
create index if not exists notes_location_idx on public.notes using gist (location);

-- Trigger to auto-set location on insert.
create or replace function public.notes_set_location()
returns trigger language plpgsql as $$
begin
  new.location := extensions.st_point(new.longitude, new.latitude)::extensions.geography;
  return new;
end;
$$;

drop trigger if exists notes_before_insert_set_location on public.notes;
create trigger notes_before_insert_set_location
  before insert on public.notes
  for each row execute function public.notes_set_location();

-- RPC: notes within radius_m metres of a point, newest first, max 50.
create or replace function public.notes_nearby(
  lat      double precision,
  lng      double precision,
  radius_m integer default 5000
)
returns setof public.notes
language sql stable
set search_path = public, extensions
as $$
  select *
  from   public.notes
  where  extensions.st_dwithin(
           location,
           extensions.st_point(lng, lat)::extensions.geography,
           radius_m
         )
  order  by created_at desc
  limit  50;
$$;
