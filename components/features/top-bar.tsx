import Image from "next/image";
import Link from "next/link";
import { NotificationsBell } from "./notifications-bell";

export function TopBar({ title }: { title?: string }) {
  return (
    <header className="safe-top sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/agenda" className="flex items-center gap-2.5">
          <Image
            src="/logo/paniit.png"
            alt="PAN IIT Alumni India"
            width={512}
            height={220}
            priority
            className="h-8 w-auto"
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
        <NotificationsBell />
      </div>
    </header>
  );
}
