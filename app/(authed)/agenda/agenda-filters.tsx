"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const TRACKS = [
  { id: "all", label: "All" },
  { id: "keynote", label: "Keynote" },
  { id: "ai", label: "AI" },
  { id: "deeptech", label: "Deep Tech" },
  { id: "policy", label: "Policy" },
  { id: "founders", label: "Founders" },
  { id: "investor", label: "Investors" },
  { id: "climate", label: "Climate" },
  { id: "fintech", label: "Fintech" },
] as const;

export function AgendaFilters() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const activeTrack = sp.get("track") ?? "all";
  const mineOnly = sp.get("mine") === "1";

  function buildHref(patch: { track?: string; mine?: string }): string {
    const next = new URLSearchParams(sp.toString());
    if (patch.track !== undefined) {
      if (patch.track === "all") next.delete("track");
      else next.set("track", patch.track);
    }
    if (patch.mine !== undefined) {
      if (patch.mine === "0") next.delete("mine");
      else next.set("mine", patch.mine);
    }
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 no-scrollbar">
      <Link
        href={buildHref({ mine: mineOnly ? "0" : "1" })}
        scroll={false}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
          mineOnly
            ? "border-brand-800 bg-brand-800 text-white"
            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        )}
        aria-pressed={mineOnly}
      >
        {mineOnly ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
        My Agenda
      </Link>
      <div className="h-5 w-px shrink-0 bg-slate-200" aria-hidden />
      {TRACKS.map((t) => {
        const active = activeTrack === t.id;
        return (
          <Link
            key={t.id}
            href={buildHref({ track: t.id })}
            scroll={false}
            className={cn(
              "inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-brand-800 bg-brand-800 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            )}
            aria-current={active ? "page" : undefined}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
