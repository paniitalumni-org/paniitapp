import Link from "next/link";
import { MapPin } from "lucide-react";
import { BookmarkButton } from "./bookmark-button";
import { TRACK_LABELS } from "@/lib/constants";
import { rangeIST } from "@/lib/date";

export interface SessionCardData {
  id: string;
  title: string;
  description: string | null;
  track: string;
  start_at: string;
  end_at: string;
  is_featured: boolean | null;
  capacity: number | null;
  current_checkins: number | null;
  venues: { name: string | null } | null;
}

const TRACK_COLORS: Record<string, string> = {
  ai: "#7C3AED",
  deeptech: "#06B6D4",
  policy: "#10B981",
  investor: "#1B1464",
  workshop: "#EC4899",
  founders: "#F97316",
  climate: "#22C55E",
  fintech: "#3B82F6",
  keynote: "#1B1464",
  general: "#64748B",
};

export function trackColor(track: string): string {
  return TRACK_COLORS[track] ?? "#64748B";
}

function capacityState(used: number, total: number) {
  const ratio = total > 0 ? used / total : 0;
  if (ratio >= 0.85) return { fill: "bg-iit-500", label: "Almost full" };
  if (ratio >= 0.6) return { fill: "bg-amber-500", label: "Filling up" };
  return { fill: "bg-emerald-500", label: "Seats available" };
}

export function SessionCard({
  session,
  bookmarked,
}: {
  session: SessionCardData;
  bookmarked: boolean;
}) {
  const capacity = session.capacity ?? 0;
  const used = session.current_checkins ?? 0;
  const showCapacity = capacity > 0;
  const cap = showCapacity ? capacityState(used, capacity) : null;
  const pct = showCapacity ? Math.min(100, Math.round((used / capacity) * 100)) : 0;

  return (
    <Link
      href={`/agenda/${session.id}`}
      className="relative block overflow-hidden rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium tabular-nums text-slate-900">
              {rangeIST(session.start_at, session.end_at)}
            </span>
            {session.is_featured ? (
              <span className="rounded-[4px] border border-iit-100 bg-iit-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-iit-600">
                Featured
              </span>
            ) : null}
          </div>
          <h3 className="mt-1 text-base font-semibold leading-snug text-brand-900">
            {session.title}
          </h3>
          {session.description ? (
            <p className="mt-1 text-xs leading-5 text-slate-500 line-clamp-2">
              {session.description}
            </p>
          ) : null}
        </div>
        <BookmarkButton sessionId={session.id} initial={bookmarked} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
        {session.venues?.name ? (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3 text-slate-400" />
            {session.venues.name}
          </span>
        ) : null}
        <span className="rounded-[4px] border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
          {TRACK_LABELS[session.track] ?? session.track}
        </span>
      </div>

      {showCapacity && cap ? (
        <div className="mt-3">
          <div className="h-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full ${cap.fill} transition-all`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] tabular-nums text-slate-500">
            <span>{cap.label}</span>
            <span>
              {used.toLocaleString()} / {capacity.toLocaleString()}
            </span>
          </div>
        </div>
      ) : null}
    </Link>
  );
}
