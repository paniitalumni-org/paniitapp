import { CalendarOff } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/features/empty-state";
import { SessionCard, type SessionCardData } from "@/components/features/session-card";
import { AgendaFilters } from "./agenda-filters";
import { AgendaRealtime } from "@/components/features/agenda-realtime";
import { SUMMIT_TZ } from "@/lib/constants";

export const dynamic = "force-dynamic";

function hourKey(iso: string): string {
  return formatInTimeZone(new Date(iso), SUMMIT_TZ, "HH:00");
}

function hourLabel(key: string): string {
  const [h] = key.split(":");
  const hour = Number(h);
  const period = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:00 ${period}`;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams?: Promise<{ track?: string; mine?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const track = sp.track ?? "all";
  const mineOnly = sp.mine === "1";

  let sessions: SessionCardData[] = [];
  let bookmarkSet = new Set<string>();
  let errored = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const query = supabase
      .from("sessions")
      .select(
        "id, title, description, track, starts_at, ends_at, is_featured, capacity, current_checkins, venues(name)"
      )
      .order("starts_at", { ascending: true });

    const { data, error } = await query;
    if (error) errored = true;
    sessions = (data as unknown as SessionCardData[] | null) ?? [];

    if (user) {
      const { data: bms } = await supabase
        .from("session_bookmarks")
        .select("session_id")
        .eq("user_id", user.id);
      bookmarkSet = new Set((bms as { session_id: string }[] | null)?.map((b) => b.session_id) ?? []);
    }
  } catch {
    errored = true;
  }

  const filtered = sessions.filter((s) => {
    if (track !== "all" && s.track !== track) return false;
    if (mineOnly && !bookmarkSet.has(s.id)) return false;
    return true;
  });

  const grouped = filtered.reduce<Map<string, SessionCardData[]>>((acc, s) => {
    const k = hourKey(s.starts_at);
    if (!acc.has(k)) acc.set(k, []);
    acc.get(k)!.push(s);
    return acc;
  }, new Map());
  const hourKeys = Array.from(grouped.keys()).sort();

  return (
    <div className="pb-10">
      <header className="px-4 pt-6">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Agenda</h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          May 16, 2026 · Taj Yeshwantpur, Bengaluru · all times IST
        </p>
      </header>

      <div className="sticky top-14 z-20 mt-4 border-y border-slate-200 bg-white px-4 py-2.5">
        <AgendaFilters />
      </div>

      {hourKeys.length === 0 ? (
        <div className="px-4 pt-8">
          <EmptyState
            icon={CalendarOff}
            title={mineOnly ? "Nothing bookmarked yet" : errored ? "Can't load schedule" : "No sessions"}
            description={
              mineOnly
                ? "Bookmark sessions to build your personal agenda."
                : errored
                ? "We can't reach the schedule right now."
                : "Sessions will appear here once organizers publish them."
            }
          />
        </div>
      ) : (
        <div className="px-4 pt-4">
          {hourKeys.map((k) => (
            <section key={k} id={`h-${k.replace(":", "")}`} className="mb-6">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wider tabular-nums text-slate-500">
                {hourLabel(k)}
              </div>
              <ul className="space-y-3">
                {grouped.get(k)!.map((s) => (
                  <li key={s.id}>
                    <SessionCard session={s} bookmarked={bookmarkSet.has(s.id)} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <AgendaRealtime />
    </div>
  );
}
