"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Users,
  CalendarClock,
  Map as MapIcon,
  User,
  Award,
  Shield,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY = [
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/attendees", label: "Network", icon: Users },
  { href: "/meetings", label: "Meetings", icon: CalendarClock },
  { href: "/map", label: "Venue map", icon: MapIcon },
  { href: "/me", label: "Profile", icon: User },
] as const;

const SECONDARY = [
  { href: "/sponsors", label: "Sponsors", icon: Award },
  { href: "/attendees/office-hours", label: "Office hours", icon: User },
  { href: "/recap", label: "Recap", icon: FileText },
];

const ADMIN = [{ href: "/admin", label: "Admin", icon: Shield }] as const;

export function SideNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:sticky lg:top-14 lg:flex lg:h-[calc(100vh-3.5rem)] lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <NavGroup>
          {PRIMARY.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </NavGroup>
        <Divider />
        <NavGroup label="More">
          {SECONDARY.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </NavGroup>
        {isAdmin ? (
          <>
            <Divider />
            <NavGroup label="Organisers">
              {ADMIN.map((item) => (
                <NavLink key={item.href} {...item} pathname={pathname} />
              ))}
            </NavGroup>
          </>
        ) : null}
      </nav>
      <div className="border-t border-slate-200 px-5 py-4 text-[11px] leading-5 text-slate-400">
        PAN IIT Bangalore Summit · May 16, 2026 · Taj Yeshwantpur
      </div>
    </aside>
  );
}

function NavGroup({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      {label ? (
        <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function Divider() {
  return <div className="my-4 h-px bg-slate-200" />;
}

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pathname: string;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-brand-50 font-medium text-brand-800"
          : "text-slate-700 hover:bg-slate-50 hover:text-brand-900"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-brand-800" : "text-slate-400 group-hover:text-slate-600"
        )}
      />
      {label}
    </Link>
  );
}
