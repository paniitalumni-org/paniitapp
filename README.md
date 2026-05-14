# PAN IIT Bangalore Summit 2026 — Event PWA

Mobile-first event app for the **PAN IIT Bangalore Summit 2026** — *Sovereignty in
Technology* — May 16, 2026 at Taj Yeshwantpur, Bengaluru.

Built with Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase
(Auth, Postgres, Realtime, Storage), shipped as an installable PWA.

> **Status: all six phases scaffolded and building cleanly.** Replace seed data,
> apply migrations, wire VAPID keys, deploy to Vercel.

---

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/paniitalumni-org/paniitapp.git
cd paniitapp
npm install --legacy-peer-deps

# 2. Set environment variables
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
# NEXT_PUBLIC_VAPID_PUBLIC_KEY (same as VAPID_PUBLIC_KEY)

# 3. Apply Supabase migrations
psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_init.sql        # owner-provided
psql "$SUPABASE_DB_URL" -f supabase/migrations/0002_qa_replies.sql  # this repo

# 4. Generate VAPID keys
npx web-push generate-vapid-keys

# 5. Deploy push Edge Function (optional)
supabase functions deploy send-push

# 6. Run the dev server
npm run dev
# → http://localhost:3000
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run `next lint` |
| `npm run generate-icons` | Regenerate `public/icons/*.png` from the SVG template |

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS v3** + **shadcn/ui** (primitives in `components/ui/*`)
- **Supabase** via `@supabase/ssr` — Postgres + Auth + Realtime + Storage
- **Phone OTP** auth (Supabase + MSG91/Twilio configured server-side)
- **PWA**: hand-written `public/sw.js` + `manifest.json` (no `next-pwa`)
- **Forms**: `react-hook-form` + `zod`
- **Dates**: `date-fns` + `date-fns-tz`, all times in `Asia/Kolkata`
- **Icons**: `lucide-react`
- **QR**: `qrcode` (generate) + `html5-qrcode` (scan)
- **Push**: Web Push API + VAPID (in-app `/api/push/send` and Edge Function)

## Features (what's built)

### Public
- Premium landing hero with `bg-paniit-gradient`, dot-grid overlay, gold gradient text on "Technology", 6-feature grid, CTA section, footer
- Phone-OTP login (locked `+91`, 6-digit code with tabular-nums)
- 3-step onboarding wizard (role/company → IIT details → interests/asks/offers)

### Agenda
- Sticky time-strip header, track filter chips, "My agenda" bookmarks toggle
- Live capacity meter (green/amber/red, realtime via Supabase channel)
- Session detail page: speakers grid, bookmark, check-in (10-min open window), live **Q&A discussion**

### Live Q&A
- Sort tabs (Top / Recent / My questions / Answered)
- Anonymous posting with deterministic pseudonym (`Attendee #347`)
- Reply threads with vertical guide line; **verified checkmark** on speaker/organizer replies (auto-flagged by trigger)
- Moderator menu (pin / mark answered / dismiss / restore)
- Optimistic upvotes; realtime updates to questions, replies, upvotes

### Network
- Searchable directory (debounced) with filter sheet: roles, IIT campus, interests, year range, "available for meetings"
- Attendee profile with asks (gold) / offers (navy outline) / interests, LinkedIn / Twitter, "Speaking at" list

### Meetings
- `SlotPicker` over 15-min blocks 08:00–21:00 IST with soft/hard conflict classification
- Inbox / Sent / Calendar tabs
- Accept via `/api/meetings/accept` → `accept_meeting` RPC with fallback to in-app implementation
- Counter-propose alternates, decline, suggested alternatives on conflict
- 1:1 chat (realtime, read receipts via `read_at`)

### Map
- Two-floor toggle, hand-coded SVG with `map_x` / `map_y` positioning
- Tap a hall → bottom sheet with today's sessions
- Search highlights matching halls in gold

### QR
- `/me/qr` — full-screen QR badge (token-encoded) **and** scanner via `html5-qrcode`
- Scan → upserts bidirectional `connections` row + navigates to profile

### Office Hours
- Profile toggle (`/me` for VC/Alumni roles)
- `/attendees/office-hours` lists currently-available people; booking re-uses the normal meeting flow

### Sponsors
- Tiered listing (Title → Platinum → Gold → Silver → Partner)
- Detail page with attendee offer, copyable promo code, "find on map" link

### Admin (`/admin`)
- Role-gated to `organizer`/`admin`
- Live stats (registered / check-ins / meetings / accepted)
- Announcement composer (priority, audience) — high/urgent priorities also trigger push
- Top sessions by check-in, hot unanswered questions across sessions

### Recap (`/recap`)
- People you met (avatar grid linked to profiles)
- Sessions attended, questions asked/answered
- `/recap/export?format=vcf|csv` downloads contacts as vCard or CSV

### Push
- VAPID-keyed Web Push
- `/api/push/subscribe` saves the `PushSubscription` to `profiles.push_subscription`
- `/api/push/send` (admin-only) sends to a user list
- `supabase/functions/send-push` Edge Function for backend-triggered pushes (10-min bookmark reminders, meeting events, official-reply alerts)
- `public/sw.js` handles incoming notifications + click → navigate

### PWA
- `manifest.json`, hand-written `public/sw.js` (network-first with safe-origin guard)
- Generated 192/512/maskable icons via `scripts/generate-icons.js`
- Installable on iOS Safari ("Add to Home Screen") and Android Chrome (PWA prompt)

## Design system

- Premium navy / white / gold palette, paniit.org-inspired
- Inter (sans) + Source Serif 4 (display)
- Track colors mapped in `tailwind.config.ts` (`track.ai`, `track.deeptech`, etc.)
- Gradient utility: `.bg-paniit-gradient`
- shadcn HSL variables in `app/globals.css`, tuned to the palette

## File structure

```
app/
  (public)/login           ← phone OTP form
  (public)/onboard         ← 3-step wizard
  (authed)/layout.tsx      ← profile gate, TopBar + BottomNav
  (authed)/agenda          ← list, detail, Q&A discussion
  (authed)/attendees       ← directory, profile, office-hours
  (authed)/meetings        ← inbox/sent/calendar, 1:1 chat
  (authed)/map             ← SVG floor map with venue sheets
  (authed)/me              ← profile, QR, push & office-hours toggles
  (authed)/sponsors        ← tiered list + detail with offer code
  (authed)/admin           ← role-gated dashboard + announcement composer
  (authed)/recap           ← post-event summary + contact export
  api/
    auth/signout
    meetings/{accept, suggest-alternates}
    push/{subscribe, send}
components/
  ui/                      ← shadcn primitives
  features/                ← top-bar, bottom-nav, session-card, slot-picker,
                             my-qr, qr-scanner, push-prompt, schedule-meeting-
                             button, office-hours-toggle, qa/
lib/
  supabase/                ← client.ts, server.ts, middleware.ts, types.ts
  utils.ts, constants.ts, date.ts, slots.ts
public/
  manifest.json, sw.js, icons/
scripts/
  generate-icons.js        ← `npm run generate-icons`
supabase/
  migrations/0001_init.sql   ← owner-provided
  migrations/0002_qa_replies.sql
  functions/send-push        ← Deno Edge Function
middleware.ts              ← refreshes session + gates (authed) routes
vercel.json                ← framework config + security headers
```

## Deploying to Vercel

1. Connect the GitHub repo at vercel.com/new.
2. Add env vars (see `.env.local.example`) — including `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
3. `vercel.json` already pins:
   - Install command: `npm install --legacy-peer-deps`
   - Build region: `bom1` (Mumbai)
   - Strict security headers (HSTS, no-frame, no-sniff, permissions-policy)
4. Deploy. The middleware reads Supabase URL/anon at build and runtime.

## Adding more shadcn primitives

```bash
npx shadcn@latest add <component>
```

See `DECISIONS.md` for engineering judgement calls per phase.
