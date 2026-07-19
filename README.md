# noted

**Anonymous thoughts, pinned to the world.**

A real-time map where anyone can drop anonymous notes at their exact GPS coordinates. Read confessions, jokes, and raw thoughts left by strangers — pinned to the real places where they were written.

> *Every place has something unsaid.*

---

## Screenshots

### Landing Page
![Landing page](public/screenshots/landing.png)

### Map View
![Map with pins and clusters](public/screenshots/map.png)

### Note Popup
![Note detail panel with actions](public/screenshots/note-popup.png)

### Compose Note
![Compose note modal](public/screenshots/compose.png)

### Story Sharing
![Story card export for Instagram/TikTok](public/screenshots/story-share.png)

### Report Flow
![Report a note inline flow](public/screenshots/report.png)

### Featured Note
![Featured note badge top-center](public/screenshots/featured.png)

---

## Overview

noted is a full-stack web application built for anonymous, location-based expression. Users open an interactive dark-themed map, see notes left by others in real-time, and can pin their own thoughts to their current GPS location — permanently, anonymously, with no edits or takebacks.

The app is designed with a minimalist dark aesthetic inspired by quiet, confessional spaces — focusing on the content and the map itself. It's built for mobile-first but works beautifully on desktop.

---

## Features

### Core
- **GPS-locked notes** — Notes are pinned to the user's exact coordinates at the moment of posting. Location cannot be changed before or after.
- **Account required to post** — Users must create an account to leave a note, ensuring accountability while keeping notes anonymous by default.
- **Real-time updates** — Notes from other users appear on the map instantly via Supabase Realtime. Deletions propagate in real time too.
- **Fuzzy location option** — Users can choose to offset their location by ~200m for privacy.
- **Immutable notes** — Notes cannot be edited once posted. Users can only delete their own notes.
- **Content moderation** — Server-side filtering blocks harmful content, spam, phone numbers, and all URLs/links.

### Map
- **Interactive dark map** — Powered by MapLibre GL JS with OpenFreeMap tiles (no API key required).
- **Redesigned pins & clusters** — Cream-colored rounded pins with drop shadows, cluster markers with concentric ring borders.
- **Smooth zoom behavior** — Consistent clustering transitions in both zoom directions with fade animations.
- **Auto-locate** — The map flies to the user's current GPS position on load.
- **Place search** — Search for any city, address, or place (powered by OpenStreetMap Nominatim, proxied server-side).
- **Time slider** — Filter notes by time period (last hour, day, week, all time).
- **Featured note** — A top-center badge highlights a noteworthy note (admin-controlled or auto-selected).

### Social
- **Comments** — Signed-in users can comment on any note.
- **Direct messages** — Signed-in users can start a conversation thread about a specific note.
- **Story-style sharing** — Export any note as a 1080×1920 story card (perfect for Instagram & TikTok Stories). Live preview, custom text editing, and download/share via Web Share API.
- **Report notes** — Anyone can report a note with a categorized reason (spam, harassment, hate speech, violence, personal info, inappropriate, other). Reports go straight to the admin review queue.

### Admin Dashboard
- **Analytics overview** — Total notes, daily activity chart, user counts, flagged content metrics.
- **Note moderation** — Browse all notes with pagination, flag suspicious content, soft-delete, restore.
- **Featured note control** — Manually select a specific note as featured, or click "Randomize" for automatic selection.
- **Report queue** — Review user reports with three actions: reject report (dismiss), approve (keep note), or delete note.
- **User management** — View active commenters, ban/unban users by Clerk ID.
- **Map view** — Visual overview of all notes directly in the admin panel.
- **Role-based access** — Only specified admin emails can access the dashboard.

### Security
- **Clerk authentication** — Modern auth with social logins, managed via Clerk.
- **Row Level Security (RLS)** — Every Supabase table has RLS enabled with appropriate policies.
- **Server-side auth verification** — All write operations verify the user's identity server-side via Clerk, never trusting client-supplied user IDs.
- **Rate limiting** — Upstash Redis-based rate limiting across all serverless instances (notes: 5/min, votes: 30/min, comments: 10/min, DMs: 20/min per user).
- **UUID validation** — All ID parameters are validated before database queries.
- **Input sanitization** — Zod schemas validate all inputs. URLs and suspicious content are blocked.
- **IP hashing** — IP addresses are hashed (never stored raw) for rate limiting and report deduplication.
- **Soft delete** — Notes are never permanently deleted; they're hidden via `is_deleted` flag.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL + PostGIS extension) |
| Authentication | Clerk |
| Realtime | Supabase Realtime (Postgres Changes) |
| Rate Limiting | Upstash Redis |
| Map | MapLibre GL JS + OpenFreeMap (free, no API key) |
| Clustering | Supercluster |
| Animations | Motion (Framer Motion) |
| Validation | Zod |
| Styling | Tailwind CSS v4 + custom CSS |
| Fonts | DM Sans, DM Serif Display (Google Fonts) |
| Deployment | Vercel |
| Region | Supabase: Mumbai (ap-south-1), Upstash: Mumbai |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project
- A [Clerk](https://clerk.com) application
- An [Upstash](https://upstash.com) Redis database (optional, for rate limiting)

### Installation

```bash
# Clone the repository
git clone https://github.com/jessehubz/noted.git
cd noted

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/auth-redirect
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/auth-redirect

# Upstash Redis (optional — rate limiting works without it in dev)
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Admin (comma-separated emails that can access /admin)
ADMIN_EMAILS=your-email@example.com
```

### Database Setup

```bash
# Link your Supabase project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
noted/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout (ClerkProvider, fonts)
│   ├── providers.tsx               # Client providers wrapper
│   ├── globals.css                 # All styles
│   ├── auth-redirect/page.tsx      # Post-login redirect (admin vs user)
│   ├── map/page.tsx                # Map view (core experience)
│   ├── messages/page.tsx           # DM threads
│   ├── sign-in/[[...sign-in]]/     # Clerk sign-in page
│   ├── sign-up/[[...sign-up]]/     # Clerk sign-up page
│   ├── terms/page.tsx              # Terms of Service
│   ├── privacy/page.tsx            # Privacy Policy
│   ├── admin/                      # Admin dashboard (protected)
│   │   ├── layout.tsx              # Admin guard + nav
│   │   ├── page.tsx                # Overview + analytics
│   │   ├── notes/page.tsx          # Note moderation + featured control
│   │   ├── flagged/page.tsx        # Report queue (approve/reject/delete)
│   │   ├── users/page.tsx          # User/ban management
│   │   └── map/page.tsx            # Admin map view
│   └── api/
│       ├── search-places/route.ts  # Nominatim proxy
│       ├── spotify-preview/route.ts # Spotify oEmbed proxy
│       └── me/route.ts             # Debug: current user info
├── components/
│   ├── note-map.tsx                # MapLibre map + markers + realtime
│   ├── compose-note.tsx            # Note creation modal
│   ├── notes-panel.tsx             # Note detail panel + actions
│   ├── note-card.tsx               # Individual note display
│   ├── comments-section.tsx        # Comments UI
│   ├── story-share.tsx             # Story card generator + export
│   ├── report-flow.tsx             # Inline report form
│   ├── place-search.tsx            # Location search input
│   ├── featured-note.tsx           # Featured note badge
│   └── time-slider.tsx             # Time filter slider
├── hooks/
│   └── useGeolocation.ts           # GPS position hook
├── lib/
│   ├── actions.ts                  # Note creation + deletion (server action)
│   ├── actions-comments.ts         # Comments (server action)
│   ├── actions-dm.ts               # DMs (server action)
│   ├── actions-report.ts           # User report submission (server action)
│   ├── actions-vote.ts             # Voting (server action)
│   ├── admin-actions.ts            # Admin operations (server action)
│   ├── cluster.ts                  # Supercluster setup
│   ├── geo.ts                      # Geo utilities
│   ├── map-config.ts               # Map style + defaults
│   ├── moderation.ts               # Content moderation
│   ├── notes-client.ts             # Client-side note fetching
│   ├── rate-limit.ts               # Upstash rate limiter
│   ├── types.ts                    # TypeScript interfaces
│   ├── validation.ts               # Zod schemas
│   └── supabase/
│       ├── client.ts               # Anon/public Supabase client
│       ├── browser.ts              # Browser Supabase client
│       └── server.ts               # Service role client (server only)
├── supabase/
│   └── migrations/                 # SQL migrations
├── middleware.ts                    # Clerk auth middleware
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `notes` | Anonymous GPS-pinned notes (content, lat/lng, user_id, ip_hash, is_deleted) |
| `comments` | Public comments on notes (requires auth) |
| `dm_threads` | DM conversation threads tied to notes |
| `dm_messages` | Messages within DM threads |
| `profiles` | User display names (auto-created) |
| `votes` | Upvote/downvote per IP hash per note |
| `flagged_notes` | Report/moderation queue (user reports + admin flags) |
| `banned_users` | Banned user list |
| `app_settings` | Key-value config (e.g. featured_note_id) |

All tables have **Row Level Security** enabled. Public-facing tables use the anon key. Auth-gated operations use the service role key with server-side Clerk verification.

---

## Deployment

### Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all environment variables (see above)
4. Deploy

The app is optimized for Vercel's Edge Network with static pages where possible and dynamic server components where auth is needed.

### Environment Variables on Vercel

Add these in **Settings → Environment Variables**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `ADMIN_EMAILS`

---

## Scalability

| Component | Free Tier Limit | Recommended Upgrade |
|-----------|----------------|-------------------|
| Supabase | 500MB storage, 2GB transfer/mo | Pro ($25/mo) at ~1000 DAU |
| Vercel | 100GB bandwidth, 100k invocations/day | Pro ($20/mo) at ~5000 DAU |
| Upstash Redis | 10k commands/day | Pay-as-you-go at ~500 DAU |
| Clerk | 10,000 MAU | Pro ($25/mo) after that |

The app comfortably handles **5,000–10,000 daily active users** on free tiers. For viral growth, upgrading Supabase and Vercel to Pro ($45/mo combined) supports up to ~50,000 DAU.

---

## Author

Built by **Jesse David Francisco** — full-stack engineer building products that connect people to places.

- [GitHub](https://github.com/jessehubz)
- [LinkedIn](https://linkedin.com/in/jessedavidfrancisco)

---

## License

MIT
