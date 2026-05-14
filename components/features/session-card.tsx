import Link from "next/link";
import { MapPin, Sparkles } from "lucide-react";
import { BookmarkButton } from "./bookmark-button";
import { TRACK_COLOR_BG, TRACK_LABELS } from "@/lib/constants";
import { rangeIST } from "@/lib/date";
import { cn } from "@/lib/utils";

export interface SessionCardData {
  id: string;
  title: string;
  track: string | null;
  starts_at: string;
  ends_at: string;
  is_featured?: boolean | null;
  capacity?: number | null;
  current_checkins?: number | null;
  venues?: { name: string; floor: number | null } | null;
}

export function SessionCard({
  session,
  bookmarked,
  asLink = true,
}: {
  session: SessionCardData;
  bookmarked?: boolean;
  asLink?: boolean;
}) {
  const track = (session.track ?? "general") as keyof typeof TRACK_COLOR_BG;
  const stripeClass = TRACK_COLOR_BG[track] ?? TRACK_COLOR_BG.general;
  const pct =
    session.capacity && session.current_checkins != null
      ? Math.min(100, Math.round((session.current_checkins / session.capacity) * 100))
      : null;
  const venue = session.venues?.name;

  const Inner = (
    <div className="relative overflow-hidden rounded-xl border border-navy-100 bg-white transition hover:border-navy-300 hover:shadow-sm">
      <div className={cn("absolute inset-y-0 left-0 w-1", stripeClass)} aria-hidden />
      <div className="px-4 py-3.5 pl-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium tabular-nums text-navy-600">
            {rangeIST(session.starts_at, session.ends_at)}
          </span>
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-medium text-navy-700">
              {TRACK_LABELS[track] ?? track}
            </span>
            {bookmarked !== undefined ? (
              <BookmarkButton sessionId={session.id} initial={!!bookmarked} />
            ) : null}
          </div>
        </div>
        <div className="mt-1 flex items-start gap-2">
          <h3 className="text-[15px] font-semibold leading-snug text-navy-900">{session.title}</h3>
          {session.is_featured ? (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-gold-200 bg-gold-50 px-1.5 py-0.5 text-[10px] font-semibold text-gold-700">
              <Sparkles className="h-2.5 w-2.5" />
              Featured
            </span>
          ) : null}
        </div>
        {venue ? (
          <div className="mt-1.5 flex items-center gap-1 text-xs text-navy-500">
            <MapPin className="h-3 w-3" />
            {venue}
            {session.venues?.floor != null ? ` · Floor ${session.venues.floor}` : ""}
          </div>
        ) : null}
        {pct != null && session.capacity ? (
          <div className="mt-2.5 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-navy-100">
              <div
                className={cn(
                  "h-full transition-all",
                  pct >= 85 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] tabular-nums text-navy-500">
              {session.current_checkins ?? 0}/{session.capacity}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );

  if (!asLink) return Inner;
  return (
    <Link href={`/agenda/${session.id}`} className="block">
      {Inner}
    </Link>
  );
}
