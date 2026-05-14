import Link from "next/link";
import { Bell } from "lucide-react";

export function TopBar({ title }: { title?: string }) {
  return (
    <header className="safe-top sticky top-0 z-30 border-b border-navy-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4">
        <Link href="/agenda" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-navy-800 text-white">
            <span className="font-serif text-[11px] font-bold">PI</span>
          </div>
          <div className="leading-tight">
            {title ? (
              <div className="text-sm font-semibold text-navy-900">{title}</div>
            ) : (
              <>
                <div className="text-[13px] font-semibold text-navy-900">PAN IIT</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-navy-500">
                  Bangalore 2026
                </div>
              </>
            )}
          </div>
        </Link>
        <Link
          href="/me"
          aria-label="Notifications"
          className="inline-grid h-9 w-9 place-items-center rounded-full text-navy-700 transition hover:bg-navy-50"
        >
          <Bell className="h-[18px] w-[18px]" />
        </Link>
      </div>
    </header>
  );
}
