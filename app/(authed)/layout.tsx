import { redirect } from "next/navigation";
import { TopBar } from "@/components/features/top-bar";
import { BottomNav } from "@/components/features/bottom-nav";
import { SideNav } from "@/components/features/side-nav";
import { createClient } from "@/lib/supabase/server";
import { rethrowIfRedirect } from "@/lib/redirect";

export const dynamic = "force-dynamic";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  let isAdmin = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/");
    const { data: me } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = me?.role === "organizer" || me?.role === "admin";
  } catch (err) {
    rethrowIfRedirect(err);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar />
      <div className="mx-auto flex w-full max-w-7xl">
        <SideNav isAdmin={isAdmin} />
        <main className="min-w-0 flex-1 pb-24 lg:pb-10">
          <div className="mx-auto w-full max-w-3xl">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
