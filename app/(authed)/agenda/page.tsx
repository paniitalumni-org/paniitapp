import { CalendarOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/features/empty-state";
import { TRACK_LABELS } from "@/lib/constants";
import { rangeIST } from "@/lib/date";

interface SessionRow {
  id: string;
  title: string;
  description: string | null;
  track: string;
  starts_at: string;
  ends_at: string;
  is_featured: boolean | null;
  venues: { name: string | null } | null;
}

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  let sessions: SessionRow[] = [];
  let errored = false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sessions")
      .select(
        "id, title, description, track, starts_at, ends_at, is_featured, venues(name)"
      )
      .order("starts_at", { ascending: true });
    if (error) errored = true;
    sessions = (data as SessionRow[] | null) ?? [];
  } catch {
    errored = true;
  }

  return (
    <div className="px-4 pb-10 pt-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Agenda</h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          May 16, 2026 · Taj Yeshwantpur, Bengaluru · all times IST
        </p>
      </header>

      {errored || sessions.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title="No sessions yet"
          description={
            errored
              ? "We can't reach the schedule right now."
              : "Sessions will appear here once organizers publish them."
          }
        />
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
            >
              <div
                className="absolute left-0 top-0 h-full w-[3px]"
                style={{ backgroundColor: trackColor(s.track) }}
                aria-hidden
              />
              <div className="flex items-center gap-3 pl-2">
                <span className="text-xs font-medium tabular-nums text-slate-900">
                  {rangeIST(s.starts_at, s.ends_at)}
                </span>
                {s.is_featured ? (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-iit-500">
                    Featured
                  </span>
                ) : null}
              </div>
              <h2 className="mt-1 pl-2 text-base font-semibold leading-snug text-brand-900">
                {s.title}
              </h2>
              {s.description ? (
                <p className="mt-1 pl-2 text-xs leading-5 text-slate-500 line-clamp-2">
                  {s.description}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 pl-2 text-xs text-slate-600">
                {s.venues?.name ? <span>{s.venues.name}</span> : null}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                  {TRACK_LABELS[s.track] ?? s.track}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function trackColor(track: string): string {
  const map: Record<string, string> = {
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
  return map[track] ?? "#64748B";
}
