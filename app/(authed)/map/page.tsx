import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/features/empty-state";
import { FloorMap, type VenueRow, type SessionAtVenue } from "./floor-map";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  let venues: VenueRow[] = [];
  let sessions: SessionAtVenue[] = [];
  let errored = false;

  try {
    const supabase = await createClient();
    const [v, s] = await Promise.all([
      supabase
        .from("venues")
        .select("id, name, floor, map_x, map_y, capacity")
        .order("floor", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("sessions")
        .select("id, title, starts_at, ends_at, venue_id, track")
        .order("starts_at", { ascending: true }),
    ]);
    venues = (v.data as VenueRow[] | null) ?? [];
    sessions = (s.data as SessionAtVenue[] | null) ?? [];
  } catch {
    errored = true;
  }

  return (
    <div className="px-4 pb-10 pt-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Map</h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Taj Yeshwantpur, Bengaluru · Ground &amp; first floors
        </p>
      </header>

      {errored || venues.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No venues yet"
          description="The interactive floor plan appears here once venues are seeded."
        />
      ) : (
        <FloorMap venues={venues} sessions={sessions} />
      )}
    </div>
  );
}
