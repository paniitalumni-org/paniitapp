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
//   3. allow-list check against public.attendee_allowlist
//   4. upsert profile row with id = auth.uid(), copying email + allow-list fields
//   5. redirect to next (default /agenda)
//
// If the email isn't on the allow-list, sign the user out and redirect to /?error=not_registered.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/agenda";
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(errorParam)}`, url.origin));
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

  // Allow-list check via service role (bypasses RLS).
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
    // env not configured — fall through; the upsert below will fail loudly.
  }

  if (!allowRow) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/?error=not_registered", url.origin));
  }

  // Upsert the profile keyed on auth.uid(). COALESCE-style: never clobber a
  // value the user may have edited in /me/edit with a stale allow-list value.
  try {
    const admin = createServiceRoleClient();
    const { data: existing } = await admin
      .from("profiles")
      .select(
        "id, email, full_name, role, iit_campus, graduation_year, branch, company, designation, interests"
      )
      .eq("id", user.id)
      .maybeSingle();

    // profiles.full_name and profiles.role are NOT NULL — fall back to safe defaults.
    const fallbackName =
      allowRow.full_name ||
      (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
      email.split("@")[0];
    const fallbackRole = allowRow.role || "alumni";

    const merged = {
      id: user.id,
      email,
      full_name: existing?.full_name ?? fallbackName,
      role: existing?.role ?? fallbackRole,
      iit_campus: existing?.iit_campus ?? allowRow.iit_campus ?? null,
      graduation_year: existing?.graduation_year ?? allowRow.graduation_year ?? null,
      branch: existing?.branch ?? allowRow.branch ?? null,
      company: existing?.company ?? allowRow.company ?? null,
      designation: existing?.designation ?? allowRow.designation ?? null,
      interests: existing?.interests ?? allowRow.interests ?? null,
    };

    await admin.from("profiles").upsert(merged, { onConflict: "id" });
  } catch {
    // Profile upsert failed — log on server, but still let them in.
    // Their RLS-bound rows just won't render until a profile row exists.
    console.warn("[auth/callback] profile upsert failed for", email);
  }

  const safeNext = next.startsWith("/") ? next : "/agenda";
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
