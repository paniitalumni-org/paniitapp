import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth callback: Supabase redirects here after Google completes.
// We exchange the `code` for a session (cookies are set by @supabase/ssr),
// then bounce to `next` (defaults to /agenda).
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
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error.message)}`, url.origin)
    );
  }

  // Safety: only redirect to relative paths on this origin.
  const safeNext = next.startsWith("/") ? next : "/agenda";
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
