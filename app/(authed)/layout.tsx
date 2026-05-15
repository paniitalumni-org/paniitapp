import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
    <SidebarProvider defaultOpen className="min-h-screen">
      <TopBar />
      <div className="flex w-full">
        <SideNav isAdmin={isAdmin} />
        <SidebarInset className="bg-slate-50">
          <main className="mx-auto w-full max-w-3xl px-4 pb-24 sm:px-6 lg:max-w-4xl lg:px-8 lg:pb-10 xl:max-w-5xl">
            {children}
          </main>
        </SidebarInset>
      </div>
      <BottomNav />
    </SidebarProvider>
  );
}
