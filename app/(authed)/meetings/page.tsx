import { createClient } from "@/lib/supabase/server";
import { MeetingsTabs, type MeetingRow } from "./meetings-tabs";

export const dynamic = "force-dynamic";

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const tab = (sp.tab as "inbox" | "sent" | "calendar") ?? "inbox";

  let userId: string | null = null;
  let meetings: MeetingRow[] = [];
  let bookmarks: { id: string; title: string; starts_at: string; ends_at: string }[] = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    if (user) {
      const { data: rows } = await supabase
        .from("meetings")
        .select(
          "id, requester_id, invitee_id, message, location, proposed_slots, scheduled_start, scheduled_end, status, created_at, requester:requester_id(id, full_name, avatar_url, designation, company), invitee:invitee_id(id, full_name, avatar_url, designation, company)"
        )
        .or(`requester_id.eq.${user.id},invitee_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      meetings = (rows as unknown as MeetingRow[] | null) ?? [];

      const { data: bm } = await supabase
        .from("session_bookmarks")
        .select("sessions(id, title, starts_at, ends_at)")
        .eq("user_id", user.id);
      bookmarks = ((bm as { sessions: { id: string; title: string; starts_at: string; ends_at: string } | null }[] | null) ?? [])
        .map((r) => r.sessions)
        .filter((s): s is { id: string; title: string; starts_at: string; ends_at: string } => !!s);
    }
  } catch {
    /* env not configured */
  }

  return (
    <div className="px-4 pb-10 pt-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Meetings</h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Schedule, accept, and chat with attendees during the summit.
        </p>
      </header>
      <MeetingsTabs
        userId={userId}
        meetings={meetings}
        bookmarks={bookmarks}
        initialTab={tab}
      />
    </div>
  );
}
