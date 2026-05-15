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
  Coffee,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const PRIMARY = [
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/attendees", label: "Network", icon: Users },
  { href: "/meetings", label: "Meetings", icon: CalendarClock },
  { href: "/map", label: "Venue map", icon: MapIcon },
  { href: "/me", label: "Profile", icon: User },
] as const;

const DISCOVER = [
  { href: "/sponsors", label: "Sponsors", icon: Award },
  { href: "/attendees/office-hours", label: "Office hours", icon: Coffee },
  { href: "/recap", label: "Recap", icon: FileText },
] as const;

const ORGANISERS = [{ href: "/admin", label: "Admin dashboard", icon: Shield }] as const;

export function SideNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Sidebar collapsible="icon" variant="inset" className="top-14 h-[calc(100svh-3.5rem)]">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {PRIMARY.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Discover</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {DISCOVER.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Organisers</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ORGANISERS.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 pb-2 text-[11px] leading-5 text-slate-400 group-data-[collapsible=icon]:hidden">
          PAN IIT Bangalore Summit
          <br />
          May 16, 2026 · Taj Yeshwantpur
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
