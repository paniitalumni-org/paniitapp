# Engineering decisions log

Captures any ambiguous calls so future contributors know why.

## Phase 1

- **Next.js 15.1.x pinned (not Next 16).** Spec called for Next 15. Latest
  `create-next-app` defaults to Next 16 with Tailwind v4 (CSS-first config); the
  provided Tailwind config uses v3 syntax (`extend.colors`). Pinning to
  `next@^15.1.6` + `tailwindcss@^3.4` keeps us aligned with the spec while still
  supporting stable React 19.
- **shadcn primitives authored directly** (not via `npx shadcn add`). The CLI is
  interactive and assumes network access; we wrote the standard primitive files
  (`button`, `input`, `label`, `textarea`, `card`, `dialog`, `sheet`, `tabs`,
  `toast`, `toaster`, `progress`, `avatar`, `separator`, `skeleton`) in the
  same style shadcn ships. `components.json` and `lib/utils.ts` remain
  CLI-compatible — `npx shadcn add <name>` will work for the rest.
- **Public pages tolerate missing Supabase env.** `app/page.tsx`,
  `app/(public)/login/page.tsx`, `app/(public)/onboard/page.tsx` and the
  authed layout each wrap the Supabase server-client call in a `try/catch`.
  This lets `npm run build` (and Vercel preview deploys without env vars set)
  succeed; the auth gate is still enforced at runtime through the middleware
  once env is set.
- **`select` elements instead of shadcn `<Select>` on onboarding.** Native
  selects are accessible, keyboard-friendly, and shorter than a
  Radix Select bound to a long list of 24 IIT campuses + 60 years. We can
  upgrade to a searchable shadcn combobox later if it matters.
- **Phone validation is India-only (E.164 with +91 prefix locked).** Matches the
  spec; relaxes the regex for any 10-digit number starting with 6–9.
- **PWA icons generated via `sharp`** from an inline SVG (navy gradient + serif
  "PI" monogram + gold accent bar). Easy to regenerate via
  `npm run generate-icons`. Replace with designed icons in Phase 6.
- **Service worker is hand-rolled** (per spec — no `next-pwa`). Network-first
  cache for same-origin GETs, never intercepts Supabase or HMR.
