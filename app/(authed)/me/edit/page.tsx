import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rethrowIfRedirect } from "@/lib/redirect";
import { EditProfileForm } from "./edit-form";

export const dynamic = "force-dynamic";

interface InitialProfile {
  full_name: string;
  designation: string;
  company: string;
  iit_campus: string;
  graduation_year: number | null;
  branch: string;
  bio: string;
  linkedin_url: string;
  twitter_url: string;
  asks: string[] | null;
  offers: string[] | null;
  interests: string[] | null;
}

export default async function MeEditPage() {
  const initial: InitialProfile = {
    full_name: "",
    designation: "",
    company: "",
    iit_campus: "",
    graduation_year: null,
    branch: "",
    bio: "",
    linkedin_url: "",
    twitter_url: "",
    asks: null,
    offers: null,
    interests: null,
  };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/");

    const { data } = await supabase
      .from("profiles")
      .select(
        "full_name, designation, company, iit_campus, graduation_year, branch, bio, linkedin_url, twitter_url, asks, offers, interests"
      )
      .eq("id", user.id)
      .maybeSingle();
    if (data) {
      const d = data as Partial<InitialProfile>;
      Object.assign(initial, {
        full_name: d.full_name ?? "",
        designation: d.designation ?? "",
        company: d.company ?? "",
        iit_campus: d.iit_campus ?? "",
        graduation_year: d.graduation_year ?? null,
        branch: d.branch ?? "",
        bio: d.bio ?? "",
        linkedin_url: d.linkedin_url ?? "",
        twitter_url: d.twitter_url ?? "",
        asks: d.asks ?? null,
        offers: d.offers ?? null,
        interests: d.interests ?? null,
      });
    }
  } catch (err) {
    rethrowIfRedirect(err);
  }

  return (
    <div className="px-4 pb-10 pt-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Edit profile</h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Other attendees see this when they find you in the Network.
        </p>
      </header>
      <EditProfileForm initial={initial} />
    </div>
  );
}
