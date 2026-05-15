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

  const { data: profile, error: lookupErr } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (lookupErr) {
    return { error: "session_failed", message: lookupErr.message };
  }
  if (!profile) {
    return { error: "not_registered" };
  }

  // generateLink does NOT send the email; it returns the OTP we can verify server-side
  // so the user never receives a magic link.
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkErr || !link?.properties?.email_otp) {
    return { error: "session_failed", message: linkErr?.message ?? "Could not generate session." };
  }

  const ssr = await createClient();
  const { data: verified, error: verifyErr } = await ssr.auth.verifyOtp({
    email,
    token: link.properties.email_otp,
    type: "email",
  });

  if (verifyErr || !verified.session) {
    return { error: "session_failed", message: verifyErr?.message ?? "Could not start session." };
  }

  redirect("/agenda");
}
