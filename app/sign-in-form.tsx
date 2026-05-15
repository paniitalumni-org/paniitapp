"use client";

import { useEffect, useState, useTransition } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { signIn, type SignInResult } from "./actions/sign-in";
import { createClient } from "@/lib/supabase/client";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 w-full rounded-md bg-brand-800 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-900 disabled:opacity-60"
    >
      {pending ? "Signing in..." : "Continue with email"}
    </button>
  );
}

function errorMessage(state: SignInResult | null): string | null {
  if (!state) return null;
  switch (state.error) {
    case "invalid_email":
      return state.message;
    case "not_registered":
      return "This email isn't on the registered attendee list. Please contact summit@paniit.org for help.";
    case "session_failed":
      return state.message || "Could not start your session. Please try again.";
    case "config":
      return "The app is misconfigured. Please contact the organizers.";
    default:
      return null;
  }
}

export function SignInForm() {
  const [state, action] = useActionState<SignInResult | null, FormData>(signIn, null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [googlePending, startGoogle] = useTransition();

  // Surface server-redirect errors that come back via /?error=...
  useEffect(() => {
    if (typeof window === "undefined") return;
    const err = new URLSearchParams(window.location.search).get("error");
    if (err) setOauthError(decodeURIComponent(err));
  }, []);

  function handleGoogle() {
    setOauthError(null);
    startGoogle(async () => {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/agenda`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) setOauthError(error.message);
    });
  }

  const message = errorMessage(state) || oauthError;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googlePending}
        className="inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-md border border-slate-300 bg-white px-5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 disabled:opacity-60"
      >
        {googlePending ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        or
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form action={action} className="space-y-3">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-800 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <SubmitButton />
      </form>

      {message ? (
        <p className="text-sm text-iit-500" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.12-1.44.34-2.11V7.04H2.18A11 11 0 0 0 1 12c0 1.78.43 3.47 1.18 4.96l3.66-2.85z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
