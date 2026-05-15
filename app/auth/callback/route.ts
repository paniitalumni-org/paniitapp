import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

interface AllowlistRow {
  email: string;
  full_name: string | null;
  role: string | null;
  iit_campus: string | null;
  graduation_year: number | null;
  branch: string | null;
  company: string | null;
  designation: string | null;
  interests: string[] | null;
}

// OAuth callback. Supabase redirects here after Google completes.
// Flow:
//   1. exchangeCodeForSession → sets auth cookies
//   2. fetch the auth user (email + id)
//   3. (allow-list check is paused — every Google sign-in is accepted; users
//      complete the onboarding form before they can use the app)
//   4. upsert profile row with id = auth.uid(), seeding what we know from
//      Google metadata and any allow-list row that happens to match
//   5. redirect to /onboarding when the profile is incomplete, otherwise to
//      `next` (default /home)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/home";
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(errorParam)}`, url.origin)
    );
  }
  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", url.origin));
  }

  const supabase = await createClient();
  const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeErr) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(exchangeErr.message)}`, url.origin)
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/?error=no_email_from_provider", url.origin));
  }

  const email = user.email.toLowerCase().trim();

  // Best-effort allow-list lookup so any pre-filled registration data still
  // seeds the profile. Missing row is fine — sign-in is open right now.
  let allowRow: AllowlistRow | null = null;
  try {
    const admin = createServiceRoleClient();
    const { data } = await admin
      .from("attendee_allowlist")
      .select(
        "email, full_name, role, iit_campus, graduation_year, branch, company, designation, interests"
      )
      .ilike("email", email)
      .maybeSingle();
    allowRow = (data as AllowlistRow | null) ?? null;
  } catch {
    /* env not configured / table missing — fall through */
  }

  // Upsert the profile keyed on auth.uid(). COALESCE-style: never clobber a
  // value the user may have edited later.
  let profileIncomplete = true;
  try {
    const admin = createServiceRoleClient();
    const { data: existing } = await admin
      .from("profiles")
      .select(
        "id, email, full_name, role, iit_campus, graduation_year, branch, company, designation, interests, bio"
      )
      .eq("id", user.id)
      .maybeSingle();

    const metaName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? (user.user_metadata.name as string)
          : null;
    const fallbackName = allowRow?.full_name || metaName || email.split("@")[0];
    const fallbackRole = allowRow?.role || "alumni";

    const merged = {
      id: user.id,
      email,
      full_name: existing?.full_name ?? fallbackName,
      role: existing?.role ?? fallbackRole,
      iit_campus: existing?.iit_campus ?? allowRow?.iit_campus ?? null,
      graduation_year: existing?.graduation_year ?? allowRow?.graduation_year ?? null,
      branch: existing?.branch ?? allowRow?.branch ?? null,
      company: existing?.company ?? allowRow?.company ?? null,
      designation: existing?.designation ?? allowRow?.designation ?? null,
      interests: existing?.interests ?? allowRow?.interests ?? null,
    };

    await admin.from("profiles").upsert(merged, { onConflict: "id" });

    // Completeness now only gates on the three mandatory onboarding fields:
    // full name, designation, and organisation (company). Everything else
    // is optional and can be filled in later via /me/edit.
    const fullName = merged.full_name?.trim();
    const designation = (existing?.designation ?? merged.designation)?.trim();
    const company = (existing?.company ?? merged.company)?.trim();

    profileIncomplete = !fullName || !designation || !company;
  } catch {
    console.warn("[auth/callback] profile upsert failed for", email);
  }

  const safeNext = next.startsWith("/") ? next : "/home";
  const target = profileIncomplete
    ? `/onboarding?next=${encodeURIComponent(safeNext)}`
    : safeNext;
  return NextResponse.redirect(new URL(target, url.origin));
}
