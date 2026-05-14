# PAN IIT Bangalore Summit 2026 — Event PWA

Mobile-first event app for the **PAN IIT Bangalore Summit 2026** — *Sovereignty in
Technology* — May 16, 2026 at Taj Yeshwantpur, Bengaluru.

Built with Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase
(Auth, Postgres, Realtime, Storage), shipped as an installable PWA.

> Phase 1 status: **complete** — foundation, premium landing, phone-OTP auth,
> 3-step onboarding, authed shell with bottom-nav tabs, PWA manifest +
> hand-written service worker + generated icons.

---

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/paniitalumni-org/paniitapp.git
cd paniitapp
npm install

# 2. Set environment variables
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY

# 3. Apply the Supabase migration
#    (supabase/migrations/0001_init.sql is provided by the project owner)
# psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_init.sql

# 4. Run the dev server
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
- **QR**: `qrcode` (generate) + `html5-qrcode` (scan) — wired in Phase 3
- **Push**: Web Push API + VAPID — wired in Phase 4

## Design system

- Premium navy / white / gold palette, paniit.org-inspired.
- Inter (sans) + Source Serif 4 (display).
- Track colors mapped in `tailwind.config.ts` (`track.ai`, `track.deeptech`, etc.).
- Gradient utility: `.bg-paniit-gradient`.
- shadcn HSL variables in `app/globals.css`, all tuned to the palette.

## File structure (Phase 1)

```
app/
  (public)/login           ← phone OTP form
  (public)/onboard         ← 3-step wizard
  (authed)/layout.tsx      ← profile gate, TopBar + BottomNav
  (authed)/agenda          ← seeded sessions list
  (authed)/attendees       ← placeholder (Phase 2)
  (authed)/meetings        ← placeholder (Phase 3)
  (authed)/map             ← venue list (Phase 2 adds floor SVG)
  (authed)/me              ← profile + sign-out
  (authed)/sponsors        ← seeded sponsors (Phase 4 adds detail)
  api/auth/signout         ← POST → supabase.signOut + redirect
components/
  ui/                      ← shadcn primitives
  features/                ← top-bar, bottom-nav, empty-state, …
lib/
  supabase/                ← client.ts, server.ts, middleware.ts, types.ts
  utils.ts, constants.ts, date.ts
public/
  manifest.json, sw.js, icons/
scripts/
  generate-icons.js        ← `npm run generate-icons`
supabase/
  migrations/              ← 0001_init.sql lives here (provided)
middleware.ts              ← refreshes session + gates (authed) routes
```

## Adding more shadcn primitives

```bash
npx shadcn@latest add <component>
```

## Deploying to Vercel

1. Connect the GitHub repo.
2. Add env vars (see `.env.local.example`).
3. Deploy. The middleware needs the Supabase URL/anon key at build *and* runtime.

## Phase roadmap

- **Phase 1** ✓ Foundation, landing, auth, onboarding
- **Phase 2** Core content (Agenda detail, Attendees, Map)
- **Phase 3** Meeting scheduler + 1:1 chat + QR badge swap
- **Phase 4** Live Q&A discussion + push notifications + sponsors detail
- **Phase 5** Office Hours, Admin, Recap
- **Phase 6** Pre-launch polish & deploy

See `DECISIONS.md` for engineering judgement calls.
