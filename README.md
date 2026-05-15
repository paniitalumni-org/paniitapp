# PAN IIT Bangalore Summit 2026 — Event PWA

Mobile-first event app for the **PAN IIT Bangalore Summit 2026** — *Sovereignty in Technology* — May 16, 2026 at Taj Yeshwantpur, Bengaluru.

Built with Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase, shipped as an installable PWA.

> **Status: Phase 1 complete.** Email-only sign-in, profile read/edit, shell + 5-tab nav, PWA assets. Phases 2–6 follow per the build spec.

---

## Quick start

```bash
git clone https://github.com/paniitalumni-org/paniitapp.git
cd paniitapp
npm install --legacy-peer-deps

# Set env vars (see "Environment variables" below)
cp .env.local.example .env.local
# fill values in

# Apply migrations against the Supabase project
psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_init.sql        # owner-provided seed
psql "$SUPABASE_DB_URL" -f supabase/migrations/0002_email_unique.sql # this repo, Phase 1

npm run dev   # http://localhost:3000
```

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=https://fncnndrexzmqqengbkvi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:tech@paniit.org
```

The service-role key is **server-only** and never reaches the client bundle. It's used by `lib/supabase/server.ts → createServiceRoleClient()` solely inside server actions and route handlers.

## Migrations

| File | What it does | Run when |
| --- | --- | --- |
| `supabase/migrations/0001_init.sql` | Owner-provided seed: profiles (with 2,000 pre-registered attendees), sessions, venues, sponsors, announcements, etc. | Already applied |
| `supabase/migrations/0002_email_unique.sql` | Partial unique index on `lower(email)` so the sign-in lookup deterministically resolves one profile. | **Run before testing sign-in.** Paste into Supabase SQL editor or `psql` against the DB URL. |

## Bulk-importing the attendee registration CSV

The Supabase `profiles` table expects one row per registered attendee, with `email` populated (used for sign-in). Use the Supabase SQL editor's CSV import tool or `psql \copy`:

```sql
-- via psql
\copy public.profiles (id, email, full_name, role, iit_campus, graduation_year, branch, company, designation, interests)
  from 'attendees.csv' csv header;
```

After importing, run migration `0002_email_unique.sql` if it hasn't been run yet — it will fail loudly if there are duplicate emails, which is what you want.

## Auth: email-only sign-in (intentional, hardening later)

Phase 1 sign-in is intentionally simple:

1. User opens the app → lands on `/` (the sign-in page).
2. User types an email → server action queries `profiles.email`.
3. If the email isn't on the registered list → inline error: *"This email isn't on the registered attendee list."*
4. If it matches → server-side `admin.generateLink({ type: "magiclink" })` returns an OTP that we immediately `verifyOtp` on a Supabase SSR server client. No email round-trip; cookies are set and the user is redirected to `/agenda`.

**No password. No emailed OTP. No magic link.** Threat model for Phase 1: trust the registration list, optimize friction-free entry on summit day. **Anyone who knows another attendee's registered email could currently impersonate them.** A password layer will be added in Phase 7.

See `DECISIONS.md` for the design choice.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run `next lint` |
| `npm run generate-icons` | Regenerate `public/icons/*.png` |

## File structure (Phase 1)

```
app/
  page.tsx                     ← sign-in page (the entry point — NOT a marketing landing)
  sign-in-form.tsx             ← client form (email + Continue)
  actions/
    sign-in.ts                 ← server action: lookup → generateLink → verifyOtp
    update-profile.ts          ← server action: update profile row
  (authed)/
    layout.tsx                 ← auth gate + TopBar/BottomNav chrome
    agenda/page.tsx            ← seeded sessions, time + venue + track
    network/page.tsx           ← Phase 2 placeholder
    meetings/page.tsx          ← Phase 3 placeholder
    map/page.tsx               ← venue list grouped by floor
    sponsors/page.tsx          ← seeded sponsors grouped by tier
    me/page.tsx                ← read-only profile
    me/edit/page.tsx           ← editable form
  api/auth/signout/route.ts
  layout.tsx                   ← Inter font, SW registration
  globals.css                  ← PAN IIT design tokens
components/
  ui/                          ← shadcn primitives
  features/
    top-bar.tsx                ← 56px, brand-800 lockup + bell
    bottom-nav.tsx             ← 64px, 5 tabs
    empty-state.tsx
lib/
  supabase/{client,server,middleware,types}.ts
  utils.ts, constants.ts, date.ts, redirect.ts
public/
  manifest.json, sw.js, icons/
scripts/
  generate-icons.js
supabase/
  migrations/0001_init.sql       ← owner-provided
  migrations/0002_email_unique.sql
middleware.ts                  ← refreshes session, gates (authed)
vercel.json                    ← install/build/region/headers
```

## Design tokens

- **Brand navy** `#1B1464` — primary. Used for headings (`text-brand-900`), primary buttons (`bg-brand-800`), nav active states.
- **IIT red** `#DD002B` — accent. Used sparingly: error states, destructive actions, urgent announcement banners.
- **Slate** for all neutrals.
- **Inter** font only. No serif anywhere.

Tighter radius (`--radius: 0.5rem`) for an institutional feel.

## Deploying to Vercel

1. Connect the GitHub repo at vercel.com/new.
2. Add env vars (Production scope) — at minimum `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
3. `vercel.json` pins install command, build region (`bom1`), and security headers.
4. Deploy. Hard-refresh after first build to clear any stale service worker from earlier deployments.

See `DECISIONS.md` for engineering judgement calls per phase.
