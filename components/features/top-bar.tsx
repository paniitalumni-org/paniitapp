import Link from "next/link";
import { NotificationsBell } from "./notifications-bell";

export function TopBar({ title }: { title?: string }) {
  return (
    <header className="safe-top sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4">
        <Link href="/agenda" className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded-sm bg-iit-500">
            <span className="text-[9px] font-bold leading-none tracking-tight text-white">
              iit
            </span>
          </div>
          {title ? (
            <div className="text-sm font-semibold tracking-tight text-brand-800">
              {title}
            </div>
          ) : (
            <div className="text-sm font-semibold tracking-tight text-brand-800">
              PAN IIT 2026
            </div>
          )}
        </Link>
        <NotificationsBell />
      </div>
    </header>
  );
}
