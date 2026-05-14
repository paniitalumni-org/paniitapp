"use client";

import { useMemo, useState } from "react";
import { Bookmark, Filter } from "lucide-react";
import { SessionCard, type SessionCardData } from "@/components/features/session-card";
import { hourIST } from "@/lib/date";
import { cn } from "@/lib/utils";

const TRACK_FILTERS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All" },
  { value: "keynote", label: "Keynote" },
  { value: "ai", label: "AI" },
  { value: "deeptech", label: "Deep Tech" },
  { value: "policy", label: "Policy" },
  { value: "founders", label: "Founders" },
  { value: "investor", label: "Investors" },
  { value: "climate", label: "Climate" },
  { value: "fintech", label: "Fintech" },
];

export function AgendaList({
  sessions,
  bookmarks,
  track: initialTrack,
  mineOnly: initialMine,
}: {
  sessions: SessionCardData[];
  bookmarks: string[];
  track: string;
  mineOnly: boolean;
}) {
  const [track, setTrack] = useState(initialTrack);
  const [mineOnly, setMineOnly] = useState(initialMine);
  const bookmarkSet = useMemo(() => new Set(bookmarks), [bookmarks]);

  const hours = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => set.add(hourIST(s.starts_at)));
    return Array.from(set).sort();
  }, [sessions]);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (track !== "all" && (s.track ?? "general") !== track) return false;
      if (mineOnly && !bookmarkSet.has(s.id)) return false;
      return true;
    });
  }, [sessions, track, mineOnly, bookmarkSet]);

  const byHour = useMemo(() => {
    const m = new Map<string, SessionCardData[]>();
    filtered.forEach((s) => {
      const h = hourIST(s.starts_at);
      if (!m.has(h)) m.set(h, []);
      m.get(h)!.push(s);
    });
    return m;
  }, [filtered]);

  return (
    <>
      {/* Sticky time strip */}
      <div className="sticky top-14 z-20 -mx-4 mb-3 border-b border-navy-100 bg-white/95 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {hours.map((h) => (
            <span
              key={h}
              className="rounded-md bg-navy-50 px-2 py-0.5 text-[11px] font-medium tabular-nums text-navy-700"
            >
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* Filter chips */}
      <div className="-mx-4 mb-3 flex items-center gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
        {TRACK_FILTERS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTrack(t.value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              track === t.value
                ? "border-navy-800 bg-navy-800 text-white"
                : "border-navy-200 bg-white text-navy-700 hover:border-navy-400"
            )}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setMineOnly((v) => !v)}
          className={cn(
            "shrink-0 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition",
            mineOnly
              ? "border-gold-300 bg-gold-50 text-gold-700"
              : "border-navy-200 bg-white text-navy-700 hover:border-navy-400"
          )}
        >
          <Bookmark className={cn("h-3 w-3", mineOnly && "fill-gold-500")} />
          My agenda
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-navy-200 bg-white p-8 text-center">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-navy-50 text-navy-700">
            <Filter className="h-4 w-4" />
          </div>
          <p className="mt-3 text-sm text-navy-500">
            No sessions match this filter. Try a different track or turn off &ldquo;My agenda&rdquo;.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(byHour.entries()).map(([hour, items]) => (
            <section key={hour}>
              <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-navy-500">
                <span className="h-px flex-1 bg-navy-100" />
                <span className="tabular-nums">{hour} IST</span>
                <span className="h-px flex-1 bg-navy-100" />
              </div>
              <ul className="space-y-3">
                {items.map((s) => (
                  <li key={s.id}>
                    <SessionCard session={s} bookmarked={bookmarkSet.has(s.id)} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
