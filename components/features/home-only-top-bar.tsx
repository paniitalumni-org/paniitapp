"use client";

import { usePathname } from "next/navigation";

export function HomeOnlyTopBar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname !== "/home") return null;
  return <>{children}</>;
}
