import Image from "next/image";
import Link from "next/link";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationsBell } from "./notifications-bell";
import { QrConnect } from "./qr-connect";

export function TopBar({ title }: { title?: string }) {
  return (
    <TooltipProvider delayDuration={300}>
      <header className="safe-top sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/agenda" className="flex items-center gap-2.5">
            <Image
              src="/logo/paniit.png"
              alt="PAN IIT Alumni India"
              width={512}
              height={220}
              priority
              className="h-7 w-auto sm:h-8"
            />
            {title ? (
              <>
                <span className="hidden h-5 w-px bg-slate-300 sm:block" aria-hidden />
                <span className="hidden text-sm font-semibold tracking-tight text-brand-900 sm:block">
                  {title}
                </span>
              </>
            ) : null}
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
