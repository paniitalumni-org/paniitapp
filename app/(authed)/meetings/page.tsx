import { CalendarClock } from "lucide-react";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/features/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { MeetingsTabs } from "./meetings-tabs";

export const dynamic = "force-dynamic";

export default function MeetingsPage() {
  return (
    <div className="px-4 pb-10 pt-4">
      <header className="mb-3">
        <h1 className="font-serif text-2xl font-bold text-navy-900">Meetings</h1>
        <p className="text-sm text-navy-500">Requests, sent, calendar.</p>
      </header>
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <Loader />
      </Suspense>
    </div>
  );
}

async function Loader() {
  let envOk = true;
  let userId: string | null = null;
  let inbox: MeetingRow[] = [];
  let sent: MeetingRow[] = [];
  let accepted: MeetingRow[] = [];
  let bookmarkedSessions: BookmarkedSession[] = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
    if (userId) {
      const select =
        "id, requester_id, invitee_id, message, location, proposed_slots, status, scheduled_start, scheduled_end, created_at, requester:profiles!meetings_requester_id_fkey(id, full_name, avatar_url, designation, company), invitee:profiles!meetings_invitee_id_fkey(id, full_name, avatar_url, designation, company)";
      const { data: inboxData } = await supabase
        .from("meetings")
        .select(select)
        .eq("invitee_id", userId)
        .in("status", ["pending", "rescheduled"])
        .order("created_at", { ascending: false });
      inbox = ((inboxData as unknown) as MeetingRow[]) ?? [];
      const { data: sentData } = await supabase
        .from("meetings")
        .select(select)
        .eq("requester_id", userId)
        .order("created_at", { ascending: false });
      sent = ((sentData as unknown) as MeetingRow[]) ?? [];
      const { data: acceptedData } = await supabase
        .from("meetings")
        .select(select)
        .or(`requester_id.eq.${userId},invitee_id.eq.${userId}`)
        .eq("status", "accepted")
        .order("scheduled_start", { ascending: true });
      accepted = ((acceptedData as unknown) as MeetingRow[]) ?? [];

      const { data: bms } = await supabase
        .from("session_bookmarks")
        .select("sessions(id, title, starts_at, ends_at)")
        .eq("user_id", userId);
      bookmarkedSessions = (
        ((bms ?? []) as unknown) as Array<{ sessions: BookmarkedSession | null }>
      )
        .map((b) => b.sessions)
        .filter((b): b is BookmarkedSession => !!b);
    }
  } catch {
    envOk = false;
  }

  if (!envOk || !userId) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Sign in to see your meetings"
        description="Once you're signed in, requests, sent invites and your calendar show up here."
      />
    );
  }

  return (
    <MeetingsTabs
      userId={userId}
      inbox={inbox}
      sent={sent}
      accepted={accepted}
      bookmarkedSessions={bookmarkedSessions}
    />
  );
}

export interface ProfileLite {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  designation: string | null;
  company: string | null;
}

export interface MeetingRow {
  id: string;
  requester_id: string;
  invitee_id: string;
  message: string | null;
  location: string | null;
  proposed_slots: Array<{ start: string; end: string }> | null;
  status: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  created_at: string;
  requester: ProfileLite | null;
  invitee: ProfileLite | null;
}

export interface BookmarkedSession {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
}
