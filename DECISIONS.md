# DECISIONS

Running log of non-obvious choices made while implementing the build spec.

## 2026-05-15 · Phase 1

### Email-only sign-in: `generateLink` + server-side `verifyOtp`
The spec offered two candidate patterns: (a) `auth.admin.generateLink` then exchange the token server-side, or (b) hand-mint a JWT signed with Supabase's JWT secret and set the auth cookies directly.

We chose (a) because:
- `generateLink({ type: "magiclink" })` does **not** send an email — it returns the action link + raw OTP. The user never receives a magic link, satisfying the "type email, get signed in" UX.
- `verifyOtp({ type: "email", token: properties.email_otp, email })` on a Supabase SSR server client cleanly sets the session cookies via `@supabase/ssr`'s cookie handlers.
- We avoid hand-rolling JWT minting, which would diverge from Supabase token-format changes.

Cost: the `auth.users` row must already exist for the registered email. If `0001_init.sql` only seeded `profiles` without backfilling `auth.users`, sign-in will fail with `session_failed`. Follow-up: add an `admin.createUser` fallback path keyed on profile.id if we hit this in practice.

### Why `app/page.tsx` IS the sign-in (no `/login` route)
Spec demands `/` be the sign-in page. The page + client form live at the root; the server action is in `app/actions/sign-in.ts`. Already-authed users get bounced to `/agenda` server-side and via middleware.

### Cookie expiry
Supabase's access-token TTL is project-level (default 1h, refreshed). The spec wants 8h. We did **not** override this in code; the right knob is the Supabase dashboard → Authentication → JWT expiry.

### `profiles.email` partial unique index
`supabase/migrations/0002_email_unique.sql` — unique on `lower(email) where email is not null`. Makes the sign-in lookup deterministic.

### Inter only, no serif
Stripped Source_Serif_4 from layout. `tailwind.config.ts` declares only `font-sans` (Inter). Headings use `font-semibold tracking-tight`.

### Color tokens
`navy-*` and `gold-*` palettes removed. Replaced with `brand-*` (`#1B1464`) and `iit-*` (`#DD002B`). Slate is the only neutral.

### Bottom nav
5 tabs: Agenda · Network · Meetings · Map · Me. Sponsors lives off the Me tab.

### Onboarding wizard removed
Profiles are pre-seeded. Deleted `(public)/onboard/*`. Me tab is the editing surface.

## 2026-05-16 · Phase 2

### Network tab URL = `/attendees`
The spec uses `Network` for the nav label but `/attendees/*` for routes (the directory page is `app/(authed)/attendees/page.tsx`, profile is `[id]/page.tsx`). The BottomNav points to `/attendees`; the user-visible label stays "Network". A label is free to differ from the URL.

### Agenda realtime: `router.refresh()` on Supabase channel events
Cheaper than re-querying in client state and lets server components own the `sessions → venues` join shape. We subscribe to `session_checkins` only to *trigger* a 600ms-debounced router refresh, not to hydrate data client-side.

### Agenda filtering happens server-side in memory, not in SQL
The `?track=…&mine=1` filters run on the already-loaded `sessions` array rather than as Postgres `where` clauses. Rationale: there are ~24 sessions; the cost of one full fetch + bookmark fetch is lower than maintaining two query branches, and the My-Agenda toggle is essentially free.

### Capacity meter thresholds
`<60%` green, `<85%` amber, `≥85%` IIT red — per the spec. We treat `capacity = 0` (or null) as "no meter", which avoids divide-by-zero and lets non-capped sessions (workshops, drop-ins) render cleanly.

### Check-in window: 10 min before → 30 min after end
Spec says "10 min before start to 30 min after end". We hide the button entirely outside that window if the user hasn't checked in yet; if they're already checked in, we keep the "Checked in" pill visible regardless of time so they have feedback.

### Attendees search: client-side debounce, server-side `or(name.ilike, company.ilike)`
300ms debounce on input → re-key on filter object → server query with pagination. Supabase's `.or()` is sensitive to comma-injection, so we strip `% _ ,` from the input before composing the query.

### Attendees filter: `available_for_meetings OR office_hours_enabled`
The seed schema may have either or both. We OR them to avoid false negatives until the schema is clarified. If only one column exists, the other's clause is a no-op against missing data.

### Year range slider: two sliders, not one dual-handle
Native dual-handle is non-trivial; two single sliders (From / To) give the same UX with zero dependencies and clamp each side against the other.

### Floor map: SVG positioned by `venue.map_x` / `map_y`
Normalized 0–100. If any venue lacks coords we fall back to a 2-column grid for the whole floor — keeps the spatial story consistent rather than mixing free-positioned with grid-positioned.

### Floor count is data-driven
Two floors are mentioned in the spec, but the toggle just lists every distinct `floor` value present in the venues table. Adding a third floor later requires no UI change.
