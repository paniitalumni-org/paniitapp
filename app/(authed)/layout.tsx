import { redirect } from "next/navigation";
import { TopBar } from "@/components/features/top-bar";
import { HomeAwareMain, HomeOnlyBottomNav } from "@/components/features/home-only-nav";
import { createClient } from "@/lib/supabase/server";
import { rethrowIfRedirect } from "@/lib/redirect";

export const dynamic = "force-dynamic";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/");
  } catch (err) {
    rethrowIfRedirect(err);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar />
      <HomeAwareMain>{children}</HomeAwareMain>
      <HomeOnlyBottomNav />
    </div>
  );
}
