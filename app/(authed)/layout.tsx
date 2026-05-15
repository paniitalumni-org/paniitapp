import { redirect } from "next/navigation";
import { TopBar } from "@/components/features/top-bar";
import { BottomNav } from "@/components/features/bottom-nav";
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
      <main className="mx-auto w-full max-w-2xl pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
