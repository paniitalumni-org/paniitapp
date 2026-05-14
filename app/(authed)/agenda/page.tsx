import { CalendarOff } from "lucide-react";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/features/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AgendaList } from "./agenda-list";
import { AgendaRealtime } from "./agenda-realtime";

export const dynamic = "force-dynamic";

export default function AgendaPage({
  searchParams,
}: {
  searchParams?: Promise<{ track?: string; mine?: string }>;
}) {
  return (
    <div className="px-4 pb-10 pt-4">
      <header className="mb-3">
        <h1 className="font-serif text-2xl font-bold text-navy-900">Agenda</h1>
        <p className="text-sm text-navy-500">May 16, 2026 · Taj Yeshwantpur · IST</p>
      </header>
      <Suspense fallback={<AgendaSkeleton />}>
        <AgendaServer searchParams={searchParams} />
      </Suspense>
      <AgendaRealtime />
    </div>
  );
}

function AgendaSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

async function AgendaServer({
  searchParams,
}: {
  searchParams?: Promise<{ track?: string; mine?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  let sessions: import("@/components/features/session-card").SessionCardData[] = [];
  let bookmarks = new Set<string>();
  let error: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error: dbErr } = await supabase
      .from("sessions")
      .select(
        "id, title, track, starts_at, ends_at, is_featured, capacity, current_checkins, venues(name, floor)"
      )
      .order("starts_at", { ascending: true });
    if (dbErr) error = dbErr.message;
    sessions = ((data as unknown) as typeof sessions) ?? [];

    if (user) {
      const { data: bms } = await supabase
        .from("session_bookmarks")
        .select("session_id")
        .eq("user_id", user.id);
      bookmarks = new Set((bms ?? []).map((r: { session_id: string }) => r.session_id));
    }
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
            ? "We can't reach the schedule right now. Once Supabase is configured, sessions will appear here."
            : "Sessions will appear here once organizers publish them."
        }
      />
    );
  }

  return (
    <AgendaList
      sessions={sessions}
      bookmarks={Array.from(bookmarks)}
      track={sp.track ?? "all"}
      mineOnly={sp.mine === "1"}
    />
  );
}
