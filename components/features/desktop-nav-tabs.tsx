"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/home", label: "Home" },
  { href: "/agenda", label: "Agenda" },
  { href: "/attendees", label: "Networking" },
  { href: "/exhibitors", label: "Exhibitors" },
  { href: "/meetings", label: "Meetings" },
] as const;

export function DesktopNavTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="hidden lg:flex lg:items-center lg:gap-1">
      {TABS.map(({ href, label }) => {
        const active =
          pathname === href ||
          (href !== "/home" && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors",
              active
                ? "bg-brand-50 text-brand-900"
                : "text-brand-800/70 hover:bg-brand-50/60 hover:text-brand-900"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
