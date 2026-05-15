"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Users, CalendarClock, Map as MapIcon, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/attendees", label: "Network", icon: Users },
  { href: "/meetings", label: "Meetings", icon: CalendarClock },
  { href: "/map", label: "Map", icon: MapIcon },
  { href: "/me", label: "Me", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white lg:hidden"
    >
      <ul className="mx-auto grid h-16 w-full max-w-2xl grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-1 transition-colors",
                  active ? "text-brand-800" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-medium leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
