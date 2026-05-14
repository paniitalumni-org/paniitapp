"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Users, CalendarClock, Map as MapIcon, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/attendees", label: "Network", icon: Users },
  { href: "/meetings", label: "Meetings", icon: CalendarClock },
  { href: "/map", label: "Map", icon: MapIcon },
  { href: "/me", label: "Me", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-navy-100 bg-white/95 backdrop-blur">
      <ul className="mx-auto flex h-16 w-full max-w-2xl items-stretch justify-between px-2">
        {tabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-label={t.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition",
                  active ? "text-navy-800" : "text-navy-400 hover:text-navy-600"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.25]")} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
