import { NextResponse } from "next/server";
import { safeNext } from "@/lib/auth/google-oauth";
import { syncProfileForUser } from "@/lib/auth/sync-profile";
import { createClient } from "@/lib/supabase/server";

// Legacy Supabase-hosted OAuth callback. The sign-in UI now uses the
// app-owned Google code flow, but keeping this route makes older links safe.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next") || "/home");
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

  try {
    const { profileIncomplete } = await syncProfileForUser(user);
    const target = profileIncomplete
      ? `/onboarding?next=${encodeURIComponent(next)}`
      : next;
    return NextResponse.redirect(new URL(target, url.origin));
  } catch (err) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(
        `/?error=${encodeURIComponent(
          err instanceof Error ? err.message : "profile_sync_failed"
        )}`,
        url.origin
      )
    );
  }
}
