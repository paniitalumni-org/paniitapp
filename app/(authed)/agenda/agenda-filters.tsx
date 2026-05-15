"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { Bookmark, BookmarkCheck, Sparkles } from "lucide-react";
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
  const recommendedOnly = sp.get("recommended") === "1";

  function buildHref(patch: {
    track?: string;
    mine?: string;
    recommended?: string;
  }): string {
    const next = new URLSearchParams(sp.toString());
    if (patch.track !== undefined) {
      if (patch.track === "all") next.delete("track");
      else next.set("track", patch.track);
    }
    if (patch.mine !== undefined) {
      if (patch.mine === "0") next.delete("mine");
      else next.set("mine", patch.mine);
    }
    if (patch.recommended !== undefined) {
      if (patch.recommended === "0") next.delete("recommended");
      else next.set("recommended", patch.recommended);
    }
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={buildHref({ mine: mineOnly ? "0" : "1" })}
          scroll={false}
          aria-pressed={mineOnly}
          className={cn(
            "flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-[13px] font-semibold transition-colors",
            mineOnly
              ? "border-brand-800 bg-brand-800 text-white"
              : "border-brand-100 bg-white text-brand-900 hover:bg-brand-50/40"
          )}
        >
          {mineOnly ? (
            <BookmarkCheck className="size-4" strokeWidth={1.7} />
          ) : (
            <Bookmark className="size-4" strokeWidth={1.7} />
          )}
          My Agenda
        </Link>
        <Link
          href={buildHref({ recommended: recommendedOnly ? "0" : "1" })}
          scroll={false}
          aria-pressed={recommendedOnly}
          className={cn(
            "flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-[13px] font-semibold transition-colors",
            recommendedOnly
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-brand-100 bg-white text-brand-900 hover:bg-brand-50/40"
          )}
        >
          <Sparkles className="size-4" strokeWidth={1.7} />
          Recommended
        </Link>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-800/75">
          Track
        </p>
        <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-1 no-scrollbar lg:mx-0 lg:flex-wrap lg:px-0 lg:pb-0">
          {TRACKS.map((t) => {
            const active = activeTrack === t.id;
            return (
              <Link
                key={t.id}
                href={buildHref({ track: t.id })}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-md border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                  active
                    ? "border-brand-800 bg-brand-800 text-white"
                    : "border-brand-100 bg-white text-brand-900 hover:bg-brand-50/40"
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
