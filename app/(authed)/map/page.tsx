import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/features/empty-state";

interface VenueRow {
  id: string;
  name: string;
  floor: number | null;
  capacity: number | null;
}

export const dynamic = "force-dynamic";

export default async function MapPage() {
  let venues: VenueRow[] = [];
  let errored = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("venues")
      .select("id, name, floor, capacity")
      .order("floor", { ascending: true })
      .order("name", { ascending: true });
    if (error) errored = true;
    venues = (data as VenueRow[] | null) ?? [];
  } catch {
    errored = true;
  }

  const grouped = venues.reduce<Map<number, VenueRow[]>>((acc, v) => {
    const floor = v.floor ?? 0;
    if (!acc.has(floor)) acc.set(floor, []);
    acc.get(floor)!.push(v);
    return acc;
  }, new Map());

  return (
    <div className="px-4 pb-10 pt-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Map</h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Taj Yeshwantpur · Ground &amp; First floor
        </p>
      </header>

      {errored || venues.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No venues yet"
          description="The interactive floor plan appears here once venues are seeded."
        />
      ) : (
        Array.from(grouped.entries()).map(([floor, items]) => (
          <section key={floor}>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
              {floor === 0 ? "Ground Floor" : `${floor === 1 ? "1st" : `${floor}th`} Floor`}
            </h2>
            <ul className="space-y-2">
              {items.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-brand-900">{v.name}</span>
                  </div>
                  {v.capacity ? (
                    <span className="text-xs tabular-nums text-slate-500">
                      Capacity {v.capacity}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
