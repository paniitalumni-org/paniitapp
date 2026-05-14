import { redirect } from "next/navigation";
import { TopBar } from "@/components/features/top-bar";
import { BottomNav } from "@/components/features/bottom-nav";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.onboarded) redirect("/onboard");
  } catch {
    // env not configured; allow render so layout is reviewable
  }

  return (
    <div className="min-h-screen bg-navy-50/40">
      <TopBar />
      <main className="mx-auto w-full max-w-2xl pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
