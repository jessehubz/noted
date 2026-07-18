# noted

A live map of anonymous thoughts pinned to real-world GPS locations.

> _Every place has something unsaid._

## What is noted?

noted is a web app where anyone can drop an anonymous note at their exact GPS coordinates. Users explore an interactive dark-themed map and read confessions, jokes, and raw thoughts left by strangers at the real places where they were written.

## Features

- **GPS-locked notes** — Notes are pinned to the user's exact coordinates at the moment of posting. The location cannot be changed before or after.
- **Fully anonymous posting** — No account required to post. No username is attached to notes.
- **Real-time map** — New notes from other users appear on the map instantly via Supabase realtime subscriptions.
- **Nearby notes (PostGIS)** — Spatial queries find notes within a radius using `ST_DWithin`.
- **Marker clustering** — Multiple notes at the same location are grouped into a single cluster marker, preventing map clutter.
- **Comments** — Signed-in users can comment on any note. Comments are public.
- **Direct messages** — Signed-in users can message the context of a note (anonymous thread). Comfort a stranger or start a conversation.
- **Spotify integration** — Optionally attach a Spotify track to any note. The track embeds inline.
- **Place search** — Search for any city or place (powered by OpenStreetMap Nominatim, proxied server-side).
- **Auto-locate** — The map flies to the user's current GPS position on load.
- **Dark monochromatic UI** — Pure black background, DM Sans + DM Serif Display typography.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Actions) |
| Database | Supabase (PostgreSQL + PostGIS) |
| Auth | Supabase Auth (email/password) |
| Realtime | Supabase Realtime (Postgres Changes) |
| Map | MapLibre GL JS + OpenFreeMap (no API key) |
| Clustering | Supercluster |
| Animations | Motion (Framer Motion) |
| Validation | Zod |
| Styling | Tailwind CSS v4 + custom CSS |
| Fonts | DM Sans, DM Serif Display (Google Fonts) |
| Deployment | Vercel (recommended) |

## Getting Started

```bash
# 1. Clone the repo
git clone <repo-url>
cd noted

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in:
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...

# 4. Push database migrations
cd ../supabase
supabase db push --yes

# 5. Run the dev server
cd ../noted
npm run dev
```

## Project Structure

```
noted/
├── app/
│   ├── page.tsx            # Landing page
│   ├── map/page.tsx        # Map view (the core experience)
│   ├── auth/page.tsx       # Sign in / sign up
│   ├── messages/page.tsx   # DM threads
│   └── api/                # Route handlers (Spotify oEmbed, place search)
├── components/             # UI components (map, compose, panel, cards)
├── hooks/                  # Custom React hooks (geolocation, Spotify preview)
├── lib/                    # Shared utilities, Supabase clients, actions, types
└── supabase/
    └── migrations/         # SQL migrations (notes, PostGIS, comments, DMs)
```

## Database Schema

- `notes` — id, content, latitude, longitude, spotify_track_id, display_name, location (geography), created_at
- `comments` — id, note_id, user_id, content, created_at
- `dm_threads` — id, note_id, sender_id, note_preview, created_at
- `dm_messages` — id, thread_id, sender_id, content, created_at
- `profiles` — id (FK to auth.users), display_name, created_at

All tables use Row Level Security (RLS). Notes are world-readable and insertable by anyone (anon). Comments and DMs require authentication.

## Author

Built by **David Francisco**.

## License

MIT
