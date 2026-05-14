import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatWindow } from "./chat-window";
import { rangeIST } from "@/lib/date";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface MeetingRow {
  id: string;
  requester_id: string;
  invitee_id: string;
  location: string | null;
  status: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  requester: { id: string; full_name: string | null; avatar_url: string | null } | null;
  invitee: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

export default async function MeetingChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let envOk = true;
  let userId: string | null = null;
  let meeting: MeetingRow | null = null;
  let conversationId: string | null = null;
  let initialMessages: Array<{
    id: string;
    sender_id: string;
    body: string;
    created_at: string;
    read_at: string | null;
  }> = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    userId = user.id;

    const { data: mRow } = await supabase
      .from("meetings")
      .select(
        "id, requester_id, invitee_id, location, status, scheduled_start, scheduled_end, requester:profiles!meetings_requester_id_fkey(id, full_name, avatar_url), invitee:profiles!meetings_invitee_id_fkey(id, full_name, avatar_url)"
      )
      .eq("id", id)
      .maybeSingle();
    meeting = (mRow as unknown) as MeetingRow | null;

    if (meeting) {
      // Auto-create conversation if accepted and missing
      if (meeting.status === "accepted") {
        const { data: convo } = await supabase
          .from("conversations")
          .upsert({ meeting_id: meeting.id }, { onConflict: "meeting_id" })
          .select("id")
          .maybeSingle();
        conversationId = convo?.id ?? null;
      } else {
        const { data: convo } = await supabase
          .from("conversations")
          .select("id")
          .eq("meeting_id", meeting.id)
          .maybeSingle();
        conversationId = convo?.id ?? null;
      }
      if (conversationId) {
        const { data: msgs } = await supabase
          .from("messages")
          .select("id, sender_id, body, created_at, read_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });
        initialMessages = msgs ?? [];
      }
    }
  } catch {
    envOk = false;
  }

  if (!meeting && envOk) notFound();
  if (!meeting || !userId) {
    return (
      <div className="px-4 pt-4">
        <Link
          href="/meetings"
          className="inline-flex items-center gap-1 text-sm text-navy-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Meetings
        </Link>
      </div>
    );
  }

  const other = meeting.requester_id === userId ? meeting.invitee : meeting.requester;

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col">
      <div className="border-b border-navy-100 bg-white px-4 py-3">
        <Link
          href="/meetings"
          className="inline-flex items-center gap-1 text-xs text-navy-500 hover:text-navy-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Meetings
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <Avatar>
            {other?.avatar_url ? <AvatarImage src={other.avatar_url} alt={other.full_name ?? ""} /> : null}
            <AvatarFallback>{initials(other?.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-semibold text-navy-900">{other?.full_name ?? "Attendee"}</div>
            {meeting.scheduled_start ? (
              <div className="flex items-center gap-2 text-xs text-navy-500">
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Calendar className="h-3 w-3" />
                  {rangeIST(meeting.scheduled_start, meeting.scheduled_end!)}
                </span>
                {meeting.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {meeting.location}
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="text-xs text-navy-500">Awaiting acceptance</div>
            )}
          </div>
        </div>
      </div>

      {conversationId ? (
        <ChatWindow
          conversationId={conversationId}
          userId={userId}
          initialMessages={initialMessages}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center bg-navy-50/30 p-6 text-center text-sm text-navy-500">
          Chat opens once the meeting is accepted.
        </div>
      )}
    </div>
  );
}
