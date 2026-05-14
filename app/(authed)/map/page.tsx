import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/features/empty-state";

interface VenueRow {
  id: string;
  name: string;
  floor: number | null;
}

export const dynamic = "force-dynamic";

export default async function MapPage() {
  let venues: VenueRow[] = [];
  let error: string | null = null;
  try {
    const supabase = await createClient();
    const { data, error: dbErr } = await supabase
      .from("venues")
      .select("id, name, floor")
      .order("floor", { ascending: true })
      .order("name", { ascending: true });
    if (dbErr) error = dbErr.message;
    venues = (data as VenueRow[] | null) ?? [];
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <div className="px-4 pb-10 pt-4">
      <header className="mb-4">
        <h1 className="font-serif text-2xl font-bold text-navy-900">Map</h1>
        <p className="text-sm text-navy-500">Taj Yeshwantpur · 2 floors</p>
      </header>

      {error || venues.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Interactive map arrives in Phase 2"
          description="The hand-drawn floor map with tap-to-see-what's-on will appear here. For now, venue list below."
        />
      ) : (
        <div className="space-y-4">
          {[1, 2].map((floor) => {
            const here = venues.filter((v) => (v.floor ?? 1) === floor);
            if (here.length === 0) return null;
            return (
              <section key={floor}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
                  Floor {floor}
                </h2>
                <ul className="space-y-2">
                  {here.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center gap-2.5 rounded-lg border border-navy-100 bg-white px-3 py-2.5"
                    >
                      <div className="grid h-8 w-8 place-items-center rounded-md bg-navy-50 text-navy-700">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="text-sm font-medium text-navy-900">{v.name}</div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
