import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./onboarding-wizard";

export const dynamic = "force-dynamic";

export default async function OnboardPage() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded, full_name, role, company, designation, iit_campus, graduation_year, branch, linkedin_url, interests, asks, offers")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.onboarded) redirect("/agenda");
    return <OnboardingWizard initial={profile ?? null} />;
  } catch {
    // env not configured yet; still render the wizard so it can be reviewed
    return <OnboardingWizard initial={null} />;
  }
}
