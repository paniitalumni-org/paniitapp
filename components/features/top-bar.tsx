import Link from "next/link";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { rethrowIfRedirect } from "@/lib/redirect";
import { initials } from "@/lib/utils";
import { NotificationsBell } from "./notifications-bell";
import { QrConnect } from "./qr-connect";

function firstName(full: string | null | undefined): string {
  if (!full) return "there";
  return full.trim().split(/\s+/)[0];
}

export async function TopBar() {
  let name: string | null = null;
  let photoUrl: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, photo_url")
        .eq("id", user.id)
        .maybeSingle();
      name = (data?.full_name as string | null) ?? null;
      photoUrl = (data?.photo_url as string | null) ?? null;
    }
  } catch (err) {
    rethrowIfRedirect(err);
  }

  return (
    <TooltipProvider delayDuration={300}>
      <header className="safe-top sticky top-0 z-40 border-b border-brand-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            href="/me"
            className="group flex min-w-0 items-center gap-2.5 rounded-full pr-2 transition-colors hover:bg-brand-50/60"
          >
            <Avatar className="size-9 shrink-0 ring-1 ring-brand-100">
              {photoUrl ? (
                <AvatarImage src={photoUrl} alt={name ?? "Profile"} />
              ) : null}
              <AvatarFallback className="bg-brand-50 text-[12px] font-semibold text-brand-800">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-800/70">
                Hello
              </p>
              <p className="truncate text-sm font-semibold text-brand-900">
                {firstName(name)}{" "}
                <span className="inline-block align-[-1px]" aria-hidden>
                  👋
                </span>
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <QrConnect />
            <NotificationsBell />
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
