import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/features/empty-state";
import { FloorMap } from "./floor-map";

interface VenueRow {
  id: string;
  name: string;
  floor: number | null;
  map_x: number | null;
  map_y: number | null;
  map_floor: number | null;
}

interface SessionAtVenue {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  venue_id: string | null;
  track: string | null;
}

export const dynamic = "force-dynamic";

export default async function MapPage() {
  let venues: VenueRow[] = [];
  let sessions: SessionAtVenue[] = [];
  let envOk = true;
  try {
    const supabase = await createClient();
    const { data: vs } = await supabase
      .from("venues")
      .select("id, name, floor, map_x, map_y, map_floor")
      .order("floor", { ascending: true })
      .order("name", { ascending: true });
    venues = (vs as VenueRow[] | null) ?? [];

    const { data: ss } = await supabase
      .from("sessions")
      .select("id, title, starts_at, ends_at, venue_id, track")
      .order("starts_at", { ascending: true });
    sessions = (ss as SessionAtVenue[] | null) ?? [];
  } catch {
    envOk = false;
  }

  return (
    <div className="px-4 pb-10 pt-4">
      <header className="mb-3">
        <h1 className="font-serif text-2xl font-bold text-navy-900">Map</h1>
        <p className="text-sm text-navy-500">Taj Yeshwantpur · 2 floors</p>
      </header>

      {!envOk || venues.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Map loading"
          description="The interactive floor plan appears here once venues are seeded."
        />
      ) : (
        <FloorMap venues={venues} sessions={sessions} />
      )}
    </div>
  );
}
