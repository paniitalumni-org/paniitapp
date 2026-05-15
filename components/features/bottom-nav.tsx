"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CalendarDays,
  UsersRound,
  Store,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/attendees", label: "Networking", icon: UsersRound },
  { href: "/exhibitors", label: "Exhibitors", icon: Store },
  { href: "/meetings", label: "Meetings", icon: CalendarClock },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-brand-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 lg:hidden"
    >
      <ul className="mx-auto grid h-16 w-full max-w-2xl grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/home" && pathname.startsWith(`${href}/`));
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-1 transition-colors",
                  active ? "text-brand-800" : "text-brand-800/45 hover:text-brand-800"
                )}
              >
                <Icon
                  className="h-[18px] w-[18px]"
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span className="text-[10.5px] font-medium leading-none tracking-tight">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
