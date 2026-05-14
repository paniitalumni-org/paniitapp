# Engineering decisions log

Captures any ambiguous calls so future contributors know why.

## Phase 1

- **Next.js 15.x pinned (not Next 16).** Spec called for Next 15. Latest
  `create-next-app` defaults to Next 16 with Tailwind v4; the provided Tailwind
  config uses v3 syntax. Pinning to `next@^15.1.6` + `tailwindcss@^3.4` keeps
  us aligned with the spec while still supporting stable React 19.
- **shadcn primitives authored directly** (not via `npx shadcn add`). The CLI
  is interactive; we wrote the standard primitive files in the same style.
  `components.json` and `lib/utils.ts` remain CLI-compatible — adding more
  primitives later via `npx shadcn@latest add <name>` still works.
- **Public pages tolerate missing Supabase env.** Server pages wrap the
  Supabase call in `try/catch` so `npm run build` succeeds even when env vars
  aren't configured. The auth gate is still enforced at runtime through the
  middleware once env is set.
- **Phone validation is India-only.** Matches the spec; relaxes to any 10-digit
  number starting with 6–9 (or +91-prefixed equivalent).
- **PWA icons generated via `sharp`** from an inline SVG (navy gradient + serif
  "PI" monogram + gold accent bar). Regenerate via `npm run generate-icons`.
- **Service worker is hand-rolled** (per spec — no `next-pwa`). Network-first
  cache for same-origin GETs, never intercepts Supabase or HMR.

## Phase 2

- **Realtime updates use `router.refresh()`.** Cheaper than re-querying in
  client state and lets server components handle the join shapes. We use
  Supabase Realtime channels only for *triggering* refresh, not for hydrating
  data.
- **`SessionCard` is shared.** Used on Agenda, My Agenda filter, and Map
  venue-sheet. The capacity meter color thresholds (green<60, amber<85, red≥85)
  match the spec; the live counter is driven by `sessions.current_checkins`.
- **Floor map is hand-coded SVG**, not a library. Each venue is a `<rect>`
  positioned by `map_x` / `map_y` (0..1) with fallback to a 2-column grid.
  Two-floor toggle is a stateful segmented control. Search highlights matching
  venues in gold without filtering them out, so spatial context stays.

## Phase 3

- **`accept_meeting` is called via `supabase.rpc()`** and the API route falls
  back to an in-app implementation if the RPC isn't present. This keeps the
  app shippable even before the full backend migration is applied.
- **Slot picker treats picks as a rolling 3-FIFO.** Selecting a 4th slot
  evicts the oldest pick instead of erroring. Less friction.
- **Chat uses optimistic-free realtime.** We rely on Supabase Realtime to push
  the inserted row back in <300ms, which keeps the local state authoritative
  and avoids the "ghost message" failure mode.
- **QR token format is `paniit2026:<token>`.** Prefixing makes accidental
  scans of unrelated QR codes (Wi-Fi, payments, business cards) fail fast.
  Scanner also accepts the raw token for backward compatibility.

## Phase 4

- **0002_qa_replies.sql is idempotent** (uses `create table if not exists`,
  `drop policy if exists` before `create policy`, and guards
  `alter publication` with a `do $$ … $$` check). Safe to re-run.
- **Anonymous questions keep `user_id` set** internally for moderation. The
  display layer derives a deterministic pseudonym from the user id so the same
  anon poster shows the same `Attendee #347` across their session.
- **Push notification flow** goes via `app/api/push/send` (admin-gated, used
  from the in-app announcement composer) and the `supabase/functions/send-push`
  Edge Function for backend-triggered pushes (10-min bookmark reminders,
  meeting events, official-reply alerts). Both paths use the same
  `web-push` library.
- **Sponsor logos use `<img>` (lint-disabled).** They're already optimized at
  upload time, served via Supabase Storage CDN; running them through Next's
  Image Optimizer doubles cost for negligible gain.

## Phase 5

- **Office Hours is a profile toggle**, not a separate calendar. VCs/Alumni
  flip a switch in `/me`; the `/attendees/office-hours` filter just lists them.
  Booking re-uses the normal `ScheduleMeetingButton` — no parallel scheduler.
- **Admin dashboard is role-gated** at the page level (returns the "Admins
  only" screen for non-admins/organizers). Push broadcasts call the existing
  `/api/push/send` route, which double-checks the caller's role server-side.
- **Recap exports as vCard and CSV.** Two formats, one route handler
  (`/recap/export?format=vcf|csv`), `<a>` tags so the browser triggers download
  instead of fetching as a navigation.

## Phase 6

- **`vercel.json` uses `npm install --legacy-peer-deps`.** The pinned React 19
  + Next 15 + shadcn primitives can fight in npm's peer resolver depending on
  registry mirror; legacy-peer-deps keeps installs deterministic on Vercel.
- **`bom1` region** picked as the primary edge region (Mumbai) since 99% of
  the audience is in India.
- **Strict-Transport-Security, X-Frame-Options DENY, CSP-adjacent permissions
  policy** all set globally via `vercel.json`. Camera permission is scoped
  to `self` only for the QR scanner.
