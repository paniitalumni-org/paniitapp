"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.");

export type SignInResult =
  | { error: "invalid_email"; message: string }
  | { error: "not_registered" }
  | { error: "session_failed"; message: string }
  | { error: "config" };

// Treat these Supabase-side error signals as "this email is not on the list."
// generateLink({ type: "magiclink", email }) errors when no auth.users row matches.
function isUserNotFound(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("user not found") ||
    m.includes("no user found") ||
    m.includes("unable to find user") ||
    m.includes("user does not exist") ||
    m.includes("signups not allowed") // belt+braces in case generateLink type changes
  );
}

export async function signIn(_prev: unknown, formData: FormData): Promise<SignInResult> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return { error: "config" };
  }

  const raw = formData.get("email");
  const parsed = EmailSchema.safeParse(typeof raw === "string" ? raw : "");
  if (!parsed.success) {
    return { error: "invalid_email", message: parsed.error.issues[0]?.message ?? "Invalid email." };
  }
  const email = parsed.data;

  const admin = createServiceRoleClient();

  // The registered-attendee check happens via Supabase auth.users — the seed
  // for 0001_init.sql is expected to have created an auth.users row per attendee
  // with their registered email. generateLink({type:'magiclink'}) errors for
  // emails not in auth.users, which is exactly the "not on the list" signal.
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkErr) {
    if (isUserNotFound(linkErr.message)) return { error: "not_registered" };
    return { error: "session_failed", message: linkErr.message };
  }

  const otp = link?.properties?.email_otp;
  if (!otp) {
    return { error: "session_failed", message: "Could not start session." };
  }

  const ssr = await createClient();
  const { data: verified, error: verifyErr } = await ssr.auth.verifyOtp({
    email,
    token: otp,
    type: "email",
  });

  if (verifyErr || !verified.session) {
    return { error: "session_failed", message: verifyErr?.message ?? "Could not start session." };
  }

  redirect("/agenda");
}
