"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const TRACKS = [
  { id: "all", label: "All sessions" },
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
    <div className="flex flex-col gap-4">
      {/* Mobile + tablet: horizontal scroll */}
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 no-scrollbar lg:hidden">
        <Link
          href={buildHref({ mine: mineOnly ? "0" : "1" })}
          scroll={false}
          aria-pressed={mineOnly}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            mineOnly
              ? "border-brand-800 bg-brand-800 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          )}
        >
          {mineOnly ? <BookmarkCheck className="size-3.5" /> : <Bookmark className="size-3.5" />}
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
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-brand-800 bg-brand-800 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              {t.label === "All sessions" ? "All" : t.label}
            </Link>
          );
        })}
      </div>

      {/* Desktop: vertical list */}
      <div className="hidden lg:flex lg:flex-col lg:gap-5">
        <Link
          href={buildHref({ mine: mineOnly ? "0" : "1" })}
          scroll={false}
          aria-pressed={mineOnly}
          className={cn(
            "inline-flex items-center justify-between rounded-md border px-3 py-2.5 text-sm font-medium transition-colors",
            mineOnly
              ? "border-brand-800 bg-brand-50 text-brand-800"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          )}
        >
          <span className="inline-flex items-center gap-2">
            {mineOnly ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
            My Agenda
          </span>
          {mineOnly ? (
            <span className="text-[10px] uppercase tracking-wider text-brand-800">On</span>
          ) : null}
        </Link>

        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Track
          </div>
          <div className="flex flex-col gap-1">
            {TRACKS.map((t) => {
              const active = activeTrack === t.id;
              return (
                <Link
                  key={t.id}
                  href={buildHref({ track: t.id })}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-brand-50 font-medium text-brand-800"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span>{t.label}</span>
                  {active ? (
                    <span className="size-1.5 rounded-full bg-brand-800" aria-hidden />
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
