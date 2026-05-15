import { createClient } from "@/lib/supabase/server";
import { AttendeesClient, type AttendeeRow } from "./attendees-client";

export const dynamic = "force-dynamic";

export default async function AttendeesPage() {
  let rows: AttendeeRow[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, full_name, designation, company, role, iit_campus, graduation_year, interests, avatar_url, available_for_meetings, office_hours_enabled"
      )
      .order("full_name", { ascending: true, nullsFirst: false })
      .range(0, 49);
    rows = (data as AttendeeRow[] | null) ?? [];
  } catch {
    rows = [];
  }

  return (
    <div className="px-4 pb-10 pt-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Network</h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Search 2,000+ attendees by IIT campus, role, company, and interests.
        </p>
      </header>
      <AttendeesClient initialRows={rows} />
    </div>
  );
}
