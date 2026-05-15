"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const UrlOrEmpty = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), {
    message: "Must be a URL starting with http:// or https://",
  });

const ProfileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(120),
  designation: z.string().trim().max(120),
  company: z.string().trim().max(120),
  iit_campus: z.string().trim().max(80),
  graduation_year: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{4}$/.test(v), { message: "Year must be 4 digits" }),
  branch: z.string().trim().max(120),
  bio: z.string().trim().max(2000),
  linkedin_url: UrlOrEmpty,
  asks: z.string().trim().max(500),
  offers: z.string().trim().max(500),
});

export type UpdateProfileResult =
  | { ok: true }
  | { error: "unauth" }
  | { error: "invalid"; message: string }
  | { error: "db"; message: string };

export async function updateProfile(
  _prev: unknown,
  formData: FormData
): Promise<UpdateProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauth" };

  const raw = Object.fromEntries(
    [
      "full_name",
      "designation",
      "company",
      "iit_campus",
      "graduation_year",
      "branch",
      "bio",
      "linkedin_url",
      "asks",
      "offers",
    ].map((k) => [k, (formData.get(k) ?? "").toString()])
  );

  const parsed = ProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "invalid", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const update = {
    full_name: parsed.data.full_name,
    designation: parsed.data.designation || null,
    company: parsed.data.company || null,
    iit_campus: parsed.data.iit_campus || null,
    graduation_year: parsed.data.graduation_year ? Number(parsed.data.graduation_year) : null,
    branch: parsed.data.branch || null,
    bio: parsed.data.bio || null,
    linkedin_url: parsed.data.linkedin_url || null,
    asks: parsed.data.asks || null,
    offers: parsed.data.offers || null,
  };

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return { error: "db", message: error.message };

  revalidatePath("/me");
  redirect("/me");
}
