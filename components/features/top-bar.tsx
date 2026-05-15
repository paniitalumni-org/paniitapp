import Link from "next/link";
import { Bell } from "lucide-react";

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
        <button
          type="button"
          aria-label="Notifications"
          className="inline-grid h-9 w-9 place-items-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}
