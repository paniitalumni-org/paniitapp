import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rethrowIfRedirect } from "@/lib/redirect";
import { EditProfileForm } from "./edit-form";

export const dynamic = "force-dynamic";

export default async function MeEditPage() {
  let initial = {
    full_name: "",
    designation: "",
    company: "",
    iit_campus: "",
    graduation_year: null as number | null,
    branch: "",
    bio: "",
    linkedin_url: "",
    asks: "",
    offers: "",
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
        "full_name, designation, company, iit_campus, graduation_year, branch, bio, linkedin_url, asks, offers"
      )
      .eq("id", user.id)
      .maybeSingle();
    if (data) initial = { ...initial, ...data };
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
