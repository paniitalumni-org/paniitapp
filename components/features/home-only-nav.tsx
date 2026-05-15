"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./bottom-nav";

export function HomeOnlyBottomNav() {
  const pathname = usePathname();
  if (pathname !== "/home") return null;
  return <BottomNav />;
}

export function HomeAwareMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/home";

  return (
    <main
      className={
        isHome
          ? "mx-auto w-full max-w-screen-2xl px-4 pb-28 sm:px-6 lg:px-8 lg:pb-12"
          : "mx-auto w-full max-w-screen-2xl px-4 pb-12 sm:px-6 lg:px-8"
      }
    >
      {children}
    </main>
  );
}
