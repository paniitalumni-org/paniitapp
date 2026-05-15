"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, type SignInResult } from "./actions/sign-in";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 w-full rounded-md bg-brand-800 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-900 disabled:opacity-60"
    >
      {pending ? "Signing in..." : "Continue"}
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
  const message = errorMessage(state);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-xs font-medium text-slate-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          required
          placeholder="you@example.com"
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-800 focus:ring-2 focus:ring-brand-100"
        />
        {message ? (
          <p className="mt-2 text-sm text-iit-500" role="alert">
            {message}
          </p>
        ) : null}
      </div>
      <SubmitButton />
    </form>
  );
}
