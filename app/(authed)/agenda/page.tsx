import { CalendarOff, MapPin, Sparkles } from "lucide-react";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/features/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { rangeIST, hourIST } from "@/lib/date";
import { TRACK_COLOR_BG, TRACK_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SessionRow {
  id: string;
  title: string;
  track: string | null;
  starts_at: string;
  ends_at: string;
  is_featured: boolean | null;
  capacity: number | null;
  current_checkins: number | null;
  venues?: { name: string; floor: number | null } | null;
}

export const dynamic = "force-dynamic";

export default function AgendaPage() {
  return (
    <div className="px-4 pb-10 pt-4">
      <header className="mb-4">
        <h1 className="font-serif text-2xl font-bold text-navy-900">Agenda</h1>
        <p className="text-sm text-navy-500">May 16, 2026 · Taj Yeshwantpur · IST</p>
      </header>
      <Suspense fallback={<AgendaSkeleton />}>
        <AgendaList />
      </Suspense>
    </div>
  );
}

function AgendaSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

async function AgendaList() {
  let sessions: SessionRow[] = [];
  let error: string | null = null;
  try {
    const supabase = await createClient();
    const { data, error: dbErr } = await supabase
      .from("sessions")
      .select("id, title, track, starts_at, ends_at, is_featured, capacity, current_checkins, venues(name, floor)")
      .order("starts_at", { ascending: true });
    if (dbErr) error = dbErr.message;
    sessions = (data as SessionRow[] | null) ?? [];
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  if (error || sessions.length === 0) {
    return (
      <EmptyState
        icon={CalendarOff}
        title="Agenda coming soon"
        description={
          error
            ? "We can't reach the schedule right now. Once the Supabase env is set, sessions will appear here."
            : "Sessions will appear here once organizers publish them. Featured talks first."
        }
      />
    );
  }

  const byHour = sessions.reduce<Map<string, SessionRow[]>>((acc, s) => {
    const h = hourIST(s.starts_at);
    if (!acc.has(h)) acc.set(h, []);
    acc.get(h)!.push(s);
    return acc;
  }, new Map());

  return (
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
              <SessionCard key={s.id} session={s} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SessionCard({ session }: { session: SessionRow }) {
  const track = (session.track ?? "general") as keyof typeof TRACK_COLOR_BG;
  const stripeClass = TRACK_COLOR_BG[track] ?? TRACK_COLOR_BG.general;
  const pct =
    session.capacity && session.current_checkins != null
      ? Math.min(100, Math.round((session.current_checkins / session.capacity) * 100))
      : null;
  const venue = session.venues?.name;

  return (
    <li className="relative overflow-hidden rounded-xl border border-navy-100 bg-white transition hover:border-navy-300 hover:shadow-sm">
      <div className={cn("absolute inset-y-0 left-0 w-1", stripeClass)} aria-hidden />
      <div className="pl-4 pr-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium tabular-nums text-navy-600">
            {rangeIST(session.starts_at, session.ends_at)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-medium text-navy-700">
            {TRACK_LABELS[track] ?? track}
          </span>
        </div>
        <div className="mt-1 flex items-start gap-2">
          <h3 className="text-[15px] font-semibold leading-snug text-navy-900">
            {session.title}
          </h3>
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
    </li>
  );
}
