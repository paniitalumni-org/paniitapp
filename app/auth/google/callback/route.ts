import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_NONCE_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  clearGoogleOAuthCookies,
  googleRedirectUri,
  redirectWithGoogleAuthError,
  safeNext,
} from "@/lib/auth/google-oauth";
import { syncProfileForUser } from "@/lib/auth/sync-profile";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  id_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const errorParam = url.searchParams.get("error");
  if (errorParam) {
    return redirectWithGoogleAuthError(req, errorParam, true);
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return redirectWithGoogleAuthError(req, "missing_code", true);
  }

  const state = url.searchParams.get("state");
  const cookies = parseCookies(req.headers.get("cookie") ?? "");
  if (!state || state !== cookies[GOOGLE_OAUTH_STATE_COOKIE]) {
    return redirectWithGoogleAuthError(req, "invalid_google_state", true);
  }

  const nonce = cookies[GOOGLE_OAUTH_NONCE_COOKIE];
  if (!nonce) {
    return redirectWithGoogleAuthError(req, "missing_google_nonce", true);
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return redirectWithGoogleAuthError(req, "google_oauth_config_missing", true);
  }

  const tokenResponse = await exchangeCodeForTokens(req, code);
  if (!tokenResponse.id_token) {
    return redirectWithGoogleAuthError(
      req,
      tokenResponse.error_description || tokenResponse.error || "missing_google_id_token",
      true
    );
  }

  const supabase = await createClient();
  const { data, error: signInError } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: tokenResponse.id_token,
    access_token: tokenResponse.access_token,
    nonce,
  });
  if (signInError) {
    return redirectWithGoogleAuthError(req, signInError.message, true);
  }

  const user = data.user;
  if (!user?.email) {
    await supabase.auth.signOut();
    return redirectWithGoogleAuthError(req, "no_email_from_provider", true);
  }

  const { profileIncomplete } = await syncProfileForUser(user);
  const next = safeNext(cookies[GOOGLE_OAUTH_NEXT_COOKIE]);
  const target = profileIncomplete
    ? `/onboarding?next=${encodeURIComponent(next)}`
    : next;
  const response = NextResponse.redirect(new URL(target, url.origin));
  clearGoogleOAuthCookies(response);
  return response;
}

async function exchangeCodeForTokens(
  req: Request,
  code: string
): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: googleRedirectUri(req),
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const payload = (await response.json()) as GoogleTokenResponse;
  if (!response.ok && !payload.error) {
    return { error: `google_token_exchange_failed_${response.status}` };
  }
  return payload;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const separator = part.indexOf("=");
      if (separator === -1) return acc;
      const name = decodeURIComponent(part.slice(0, separator));
      const value = decodeURIComponent(part.slice(separator + 1));
      acc[name] = value;
      return acc;
    }, {});
}
