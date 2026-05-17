"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { GatePassDialog } from "./gatepass-dialog";

// Floating "show my gate pass" entry-point. Stacks just above the ChatFab
// (which is pinned at bottom-[88px] / lg:bottom-8) so both float on the
// right edge without overlap. Hidden on /chat routes so chat threads stay
// uncluttered, matching the ChatFab's own hide-on-chat rule.
export function GatePassFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/chat")) return null;

  return (
    <>
      <div
        className={cn(
          "fixed right-4 z-30 flex items-center gap-2",
          // ChatFab sits at bottom-[88px] (mobile) / lg:bottom-8 (desktop);
          // stack this ~64px higher so the two FABs read as a column.
          "bottom-[156px] lg:bottom-28 lg:right-8"
        )}
      >
        {/* Always-visible label so people know what this button is for. */}
        <span className="rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-black shadow-[0_4px_14px_-4px_rgba(13,9,48,0.25)] ring-1 ring-brand-100">
          Gate pass QR
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Show my gate pass"
          className="inline-grid size-12 place-items-center rounded-full border border-brand-100 bg-white text-brand-900 shadow-[0_14px_32px_-12px_rgba(13,9,48,0.45)] transition-all hover:scale-[1.03] hover:bg-brand-50"
        >
          <QrCode className="size-[22px]" strokeWidth={1.6} />
        </button>
      </div>
      <GatePassDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
