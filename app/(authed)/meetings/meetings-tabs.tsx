"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CalendarClock, Check, Loader2, MessageCircle, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatInTimeZone } from "date-fns-tz";
import { SUMMIT_TZ } from "@/lib/constants";
import { rangeIST } from "@/lib/date";
import { classifySlot, type Slot } from "@/lib/slots";
import { cn, initials } from "@/lib/utils";

interface MiniProfile {
  id: string;
  full_name: string | null;
  photo_url: string | null;
  designation: string | null;
  company: string | null;
}

export interface MeetingRow {
  id: string;
  requester_id: string;
  invitee_id: string;
  message: string | null;
  location: string | null;
  proposed_slots: Slot[] | null;
  accepted_slot: Slot | null;
  status: "pending" | "accepted" | "declined" | "rescheduled" | "cancelled";
  created_at: string;
  requester: MiniProfile | null;
  invitee: MiniProfile | null;
}

type Tab = "inbox" | "sent" | "calendar";

const TABS: { id: Tab; label: string }[] = [
  { id: "inbox", label: "Inbox" },
  { id: "sent", label: "Sent" },
  { id: "calendar", label: "Calendar" },
];

export function MeetingsTabs({
  userId,
  meetings,
  bookmarks,
  initialTab = "inbox",
}: {
  userId: string | null;
  meetings: MeetingRow[];
  bookmarks: { id: string; title: string; start_at: string; end_at: string }[];
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const router = useRouter();
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const inbox = useMemo(
    () =>
      meetings.filter(
        (m) => m.invitee_id === userId && m.status === "pending"
      ),
    [meetings, userId]
  );
  const sent = useMemo(
    () => meetings.filter((m) => m.requester_id === userId),
    [meetings, userId]
  );
  const accepted = useMemo(
    () => meetings.filter((m) => m.status === "accepted"),
    [meetings]
  );

  const myAcceptedWindows: Slot[] = accepted.flatMap((m) => {
    const s = asSlot(m.accepted_slot);
    return s ? [s] : [];
  });

  const myBookmarkWindows = bookmarks
    .filter((b) => typeof b.start_at === "string" && typeof b.end_at === "string")
    .map((b) => ({ start: b.start_at, end: b.end_at }));

  async function accept(meetingId: string, slot: Slot) {
    setPendingId(meetingId);
    startTransition(async () => {
      const res = await fetch("/api/meetings/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_id: meetingId, slot }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setPendingId(null);
      if (!res.ok) {
        if (data.error === "conflict") {
          toast({
            title: "That slot is no longer free",
            description: "Try one of the other proposed slots, or counter-propose.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Could not accept",
            description: data.error ?? "Try again.",
            variant: "destructive",
          });
        }
        return;
      }
      toast({ title: "Meeting accepted" });
      router.refresh();
    });
  }

  async function decline(meetingId: string) {
    setPendingId(meetingId);
    startTransition(async () => {
      const res = await fetch("/api/meetings/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_id: meetingId }),
      });
      setPendingId(null);
      if (!res.ok) {
        toast({ title: "Could not decline", variant: "destructive" });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex w-full rounded-md border border-slate-300 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors",
              tab === t.id ? "bg-brand-800 text-white" : "text-slate-700 hover:bg-slate-50"
            )}
            aria-pressed={tab === t.id}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "inbox" ? (
        inbox.length === 0 ? (
          <EmptyMsg
            title="No new requests"
            body="When someone asks to meet, it'll show up here."
          />
        ) : (
          <ul className="space-y-3">
            {inbox.map((m) => (
              <li key={m.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    {m.requester?.photo_url ? (
                      <AvatarImage src={m.requester.photo_url} alt="" />
                    ) : null}
                    <AvatarFallback className="bg-brand-50 text-brand-800">
                      {initials(m.requester?.full_name ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/attendees/${m.requester?.id}`}
                      className="text-sm font-semibold text-brand-900 hover:underline"
                    >
                      {m.requester?.full_name ?? "Attendee"}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {[m.requester?.designation, m.requester?.company].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
                {m.message ? (
                  <p className="mt-3 text-sm leading-6 text-slate-700">{m.message}</p>
                ) : null}
                {m.location ? (
                  <p className="mt-1 text-xs text-slate-500">Location: {m.location}</p>
                ) : null}

                <div className="mt-3 space-y-1.5">
                  {asSlotArray(m.proposed_slots).map((s) => {
                    const c = classifySlot(s, myBookmarkWindows, myAcceptedWindows);
                    return (
                      <div key={s.start} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <SlotState state={c} />
                          <span className="text-sm tabular-nums text-brand-900">
                            {formatInTimeZone(new Date(s.start), SUMMIT_TZ, "h:mm a")} –{" "}
                            {formatInTimeZone(new Date(s.end), SUMMIT_TZ, "h:mm a")}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => accept(m.id, s)}
                          disabled={pendingId === m.id || c === "hard"}
                        >
                          {pendingId === m.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Accept
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => decline(m.id)}
                    disabled={pendingId === m.id}
                  >
                    <X className="h-3.5 w-3.5" />
                    Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === "sent" ? (
        sent.length === 0 ? (
          <EmptyMsg title="No sent requests" body="Pick an attendee and request a meeting." />
        ) : (
          <ul className="space-y-3">
            {sent.map((m) => (
              <li key={m.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      {m.invitee?.photo_url ? (
                        <AvatarImage src={m.invitee.photo_url} alt="" />
                      ) : null}
                      <AvatarFallback className="bg-brand-50 text-brand-800">
                        {initials(m.invitee?.full_name ?? "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <Link
                        href={`/attendees/${m.invitee?.id}`}
                        className="text-sm font-semibold text-brand-900 hover:underline"
                      >
                        {m.invitee?.full_name ?? "Attendee"}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {[m.invitee?.designation, m.invitee?.company].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </div>
                  <StatusPill status={m.status} />
                </div>
                {(() => {
                  const s = asSlot(m.accepted_slot);
                  return s ? (
                    <div className="mt-3 text-sm tabular-nums text-slate-700">
                      {rangeIST(s.start, s.end)}
                    </div>
                  ) : null;
                })()}
                {m.status === "accepted" ? (
                  <div className="mt-3">
                    <Link
                      href={`/meetings/${m.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-800 hover:text-brand-900"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Open chat
                    </Link>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === "calendar" ? (
        <CalendarView accepted={accepted} bookmarks={bookmarks} userId={userId} />
      ) : null}
    </div>
  );
}

function EmptyMsg({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <CalendarClock className="mx-auto h-8 w-8 text-slate-300" strokeWidth={1.5} />
      <h3 className="mt-3 text-sm font-semibold text-brand-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{body}</p>
    </div>
  );
}

function SlotState({ state }: { state: "free" | "soft" | "hard" }) {
  if (state === "free") return <span className="text-emerald-600 text-xs">✓ free</span>;
  if (state === "soft") return <span className="text-amber-600 text-xs">⚠ soft</span>;
  return <span className="text-iit-500 text-xs">✕ busy</span>;
}

function StatusPill({ status }: { status: MeetingRow["status"] }) {
  const style: Record<MeetingRow["status"], string> = {
    pending: "bg-amber-50 text-amber-700",
    accepted: "bg-emerald-50 text-emerald-700",
    declined: "bg-iit-50 text-iit-700",
    rescheduled: "bg-brand-50 text-brand-800",
    cancelled: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
        style[status]
      )}
    >
      {status}
    </span>
  );
}

function CalendarView({
  accepted,
  bookmarks,
  userId,
}: {
  accepted: MeetingRow[];
  bookmarks: { id: string; title: string; start_at: string; end_at: string }[];
  userId: string | null;
}) {
  const events: { kind: "meeting" | "session"; start: string; end: string; title: string }[] = [
    ...accepted.flatMap((m) => {
      const s = asSlot(m.accepted_slot);
      if (!s) return [];
      return [
        {
          kind: "meeting" as const,
          start: s.start,
          end: s.end,
          title:
            (m.requester_id === userId ? m.invitee?.full_name : m.requester?.full_name) ??
            "Meeting",
        },
      ];
    }),
    ...bookmarks.map((b) => ({
      kind: "session" as const,
      start: b.start_at,
      end: b.end_at,
      title: b.title,
    })),
  ].sort((a, b) => a.start.localeCompare(b.start));

  if (events.length === 0) {
    return <EmptyMsg title="Your day is open" body="Accepted meetings and bookmarked sessions show up here." />;
  }

  return (
    <ul className="space-y-2">
      {events.map((e, i) => (
        <li
          key={`${i}-${e.start}`}
          className={cn(
            "flex items-center gap-3 rounded-lg border bg-white p-3",
            e.kind === "meeting" ? "border-brand-200" : "border-slate-200"
          )}
        >
          <div className="w-20 shrink-0 text-xs tabular-nums text-slate-500">
            {formatInTimeZone(new Date(e.start), SUMMIT_TZ, "h:mm a")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-brand-900 truncate">{e.title}</div>
            <div className="text-[11px] capitalize text-slate-500">{e.kind}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// jsonb columns come back as `unknown`-shaped objects. These guards keep us
// from crashing the page if a stored slot ever drifts from {start, end}.
function asSlot(v: unknown): Slot | null {
  if (
    v &&
    typeof v === "object" &&
    "start" in v &&
    "end" in v &&
    typeof (v as { start: unknown }).start === "string" &&
    typeof (v as { end: unknown }).end === "string"
  ) {
    return { start: (v as Slot).start, end: (v as Slot).end };
  }
  return null;
}

function asSlotArray(v: unknown): Slot[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((s) => {
    const out = asSlot(s);
    return out ? [out] : [];
  });
}
