"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Inbox,
  Loader2,
  MapPin,
  MessageCircle,
  Send,
  X,
  Clock,
  CalendarClock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { SlotPicker, type BusyBlock } from "@/components/features/slot-picker";
import { rangeIST, timeIST } from "@/lib/date";
import { cn, initials } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { TimeBlock } from "@/lib/slots";
import type {
  BookmarkedSession,
  MeetingRow,
  ProfileLite,
} from "./page";

export function MeetingsTabs({
  userId,
  inbox,
  sent,
  accepted,
  bookmarkedSessions,
}: {
  userId: string;
  inbox: MeetingRow[];
  sent: MeetingRow[];
  accepted: MeetingRow[];
  bookmarkedSessions: BookmarkedSession[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const ch = supabase
      .channel("meetings-self")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetings" },
        () => router.refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, router]);

  const busyBlocks: BusyBlock[] = useMemo(() => {
    const sessions: BusyBlock[] = bookmarkedSessions.map((s) => ({
      start: s.starts_at,
      end: s.ends_at,
      kind: "session" as const,
    }));
    const meetings: BusyBlock[] = accepted
      .filter((m) => m.scheduled_start && m.scheduled_end)
      .map((m) => ({
        start: m.scheduled_start!,
        end: m.scheduled_end!,
        kind: "meeting" as const,
      }));
    return [...sessions, ...meetings];
  }, [bookmarkedSessions, accepted]);

  return (
    <Tabs defaultValue="inbox">
      <TabsList className="w-full">
        <TabsTrigger value="inbox" className="flex-1">
          <Inbox className="h-3.5 w-3.5" />
          Inbox
          {inbox.length > 0 ? (
            <span className="ml-1 rounded-full bg-gold-400 px-1.5 text-[10px] font-bold text-navy-900">
              {inbox.length}
            </span>
          ) : null}
        </TabsTrigger>
        <TabsTrigger value="sent" className="flex-1">
          <Send className="h-3.5 w-3.5" />
          Sent
        </TabsTrigger>
        <TabsTrigger value="calendar" className="flex-1">
          <CalendarClock className="h-3.5 w-3.5" />
          Calendar
        </TabsTrigger>
      </TabsList>
      <TabsContent value="inbox">
        <InboxList
          meetings={inbox}
          userId={userId}
          busy={busyBlocks}
          onMutate={() => router.refresh()}
          toast={toast}
        />
      </TabsContent>
      <TabsContent value="sent">
        <SentList meetings={sent} />
      </TabsContent>
      <TabsContent value="calendar">
        <CalendarView accepted={accepted} bookmarked={bookmarkedSessions} userId={userId} />
      </TabsContent>
    </Tabs>
  );
}

function InboxList({
  meetings,
  busy,
  onMutate,
  toast,
}: {
  meetings: MeetingRow[];
  userId: string;
  busy: BusyBlock[];
  onMutate: () => void;
  toast: ReturnType<typeof import("@/hooks/use-toast").useToast>["toast"];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [counterFor, setCounterFor] = useState<MeetingRow | null>(null);
  const [counterSlots, setCounterSlots] = useState<TimeBlock[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (meetings.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-navy-200 bg-white p-8 text-center">
        <Inbox className="mx-auto h-5 w-5 text-navy-400" />
        <p className="mt-2 text-sm font-medium text-navy-700">No requests yet</p>
        <p className="mt-1 text-xs text-navy-500">When attendees ask to meet, they show up here.</p>
      </div>
    );
  }

  async function accept(m: MeetingRow, slot: TimeBlock) {
    setPendingId(m.id);
    const res = await fetch("/api/meetings/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ meeting_id: m.id, slot }),
    });
    setPendingId(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (data.conflict) {
        toast({
          title: "That slot is no longer free",
          description: "Try one of the suggested alternatives.",
          variant: "destructive",
        });
        setCounterFor(m);
        setCounterSlots(data.suggestions ?? []);
        return;
      }
      toast({
        title: "Couldn't accept",
        description: data.error || "Try again.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Accepted", description: "Both calendars updated." });
    onMutate();
  }

  async function decline(m: MeetingRow) {
    setPendingId(m.id);
    const { error } = await supabase
      .from("meetings")
      .update({ status: "declined" })
      .eq("id", m.id);
    setPendingId(null);
    if (error)
      toast({ title: "Couldn't decline", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Declined" });
      onMutate();
    }
  }

  async function counter(m: MeetingRow, slots: TimeBlock[]) {
    setPendingId(m.id);
    const { error } = await supabase
      .from("meetings")
      .update({ proposed_slots: slots, status: "rescheduled" })
      .eq("id", m.id);
    setPendingId(null);
    if (error)
      toast({ title: "Couldn't propose", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Sent your times", description: "We pinged them with your alternates." });
      setCounterFor(null);
      onMutate();
    }
  }

  return (
    <>
      <ul className="space-y-3">
        {meetings.map((m) => {
          const other = m.requester;
          return (
            <li
              key={m.id}
              className="rounded-xl border border-navy-100 bg-white p-4 transition hover:border-navy-300"
            >
              <Header other={other} />
              {m.message ? (
                <p className="mt-2 text-sm leading-relaxed text-navy-800">{m.message}</p>
              ) : null}
              {m.location ? (
                <div className="mt-2 inline-flex items-center gap-1 text-xs text-navy-500">
                  <MapPin className="h-3 w-3" />
                  {m.location}
                </div>
              ) : null}
              <div className="mt-3 space-y-1.5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-navy-500">
                  Proposed times
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(m.proposed_slots ?? []).map((s, i) => {
                    const status = classifySlot(s, busy);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => accept(m, s)}
                        disabled={pendingId === m.id || status === "hard"}
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs font-medium tabular-nums transition",
                          status === "hard"
                            ? "border-red-300 bg-red-50 text-red-700 line-through"
                            : status === "soft"
                            ? "border-amber-300 bg-amber-50 text-amber-700"
                            : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        )}
                      >
                        {timeIST(s.start)}
                        {status === "hard" ? " ✕" : status === "soft" ? " ⚠" : " ✓"}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={pendingId === m.id}
                  onClick={() => {
                    setCounterFor(m);
                    setCounterSlots([]);
                  }}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Propose new times
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30"
                  disabled={pendingId === m.id}
                  onClick={() => decline(m)}
                >
                  {pendingId === m.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                  Decline
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <Sheet open={!!counterFor} onOpenChange={(o) => !o && setCounterFor(null)}>
        <SheetContent side="bottom" className="px-0">
          <SheetHeader>
            <SheetTitle>Propose new times</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 px-6 pb-6">
            <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-navy-100 bg-navy-50/40 p-2">
              <SlotPicker value={counterSlots} onChange={setCounterSlots} busy={busy} />
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={() => counterFor && counter(counterFor, counterSlots)}
              disabled={counterSlots.length === 0}
            >
              <Send className="h-4 w-4" />
              Send {counterSlots.length} alternate{counterSlots.length === 1 ? "" : "s"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function SentList({ meetings }: { meetings: MeetingRow[]; }) {
  if (meetings.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-navy-200 bg-white p-8 text-center">
        <Send className="mx-auto h-5 w-5 text-navy-400" />
        <p className="mt-2 text-sm font-medium text-navy-700">Nothing sent yet</p>
        <p className="mt-1 text-xs text-navy-500">
          Open someone&apos;s profile and tap &ldquo;Schedule Meeting&rdquo;.
        </p>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {meetings.map((m) => (
        <li
          key={m.id}
          className="rounded-xl border border-navy-100 bg-white p-4 transition hover:border-navy-300"
        >
          <Header other={m.invitee} />
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={m.status} />
            {m.scheduled_start ? (
              <span className="text-xs tabular-nums text-navy-500">
                {rangeIST(m.scheduled_start, m.scheduled_end!)}
              </span>
            ) : null}
            {m.status === "accepted" ? (
              <Link
                href={`/meetings/${m.id}`}
                className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-navy-700 hover:text-navy-900"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Chat
              </Link>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function CalendarView({
  accepted,
  bookmarked,
  userId,
}: {
  accepted: MeetingRow[];
  bookmarked: BookmarkedSession[];
  userId: string;
}) {
  // Combine into one timeline of 13 hours (08:00–21:00)
  const items = useMemo(() => {
    const meetings = accepted
      .filter((m) => m.scheduled_start && m.scheduled_end)
      .map((m) => ({
        kind: "meeting" as const,
        id: m.id,
        title:
          (m.requester_id === userId ? m.invitee?.full_name : m.requester?.full_name) ??
          "Meeting",
        start: m.scheduled_start!,
        end: m.scheduled_end!,
      }));
    const sessions = bookmarked.map((s) => ({
      kind: "session" as const,
      id: s.id,
      title: s.title,
      start: s.starts_at,
      end: s.ends_at,
    }));
    return [...meetings, ...sessions].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [accepted, bookmarked, userId]);

  if (items.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-navy-200 bg-white p-8 text-center">
        <CalendarClock className="mx-auto h-5 w-5 text-navy-400" />
        <p className="mt-2 text-sm font-medium text-navy-700">Your day is wide open</p>
        <p className="mt-1 text-xs text-navy-500">Bookmark sessions or accept meetings to fill it.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li
          key={`${it.kind}-${it.id}`}
          className={cn(
            "relative overflow-hidden rounded-lg border bg-white p-3",
            it.kind === "meeting" ? "border-navy-200" : "border-navy-100"
          )}
        >
          <div
            className={cn(
              "absolute inset-y-0 left-0 w-1",
              it.kind === "meeting" ? "bg-navy-800" : "bg-gold-400"
            )}
            aria-hidden
          />
          <div className="pl-2">
            <div className="text-[11px] uppercase tracking-[0.18em] text-navy-500">
              {it.kind === "meeting" ? "Meeting" : "Session"}
            </div>
            <div className="text-sm font-semibold text-navy-900">{it.title}</div>
            <div className="text-xs tabular-nums text-navy-500">{rangeIST(it.start, it.end)}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Header({ other }: { other: ProfileLite | null }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        {other?.avatar_url ? <AvatarImage src={other.avatar_url} alt={other.full_name ?? ""} /> : null}
        <AvatarFallback>{initials(other?.full_name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-navy-900">
          {other?.full_name ?? "Attendee"}
        </div>
        <div className="truncate text-xs text-navy-500">
          {[other?.designation, other?.company].filter(Boolean).join(" · ")}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "bg-amber-50 text-amber-700" },
    accepted: { label: "Accepted", cls: "bg-emerald-50 text-emerald-700" },
    declined: { label: "Declined", cls: "bg-red-50 text-red-700" },
    rescheduled: { label: "Rescheduled", cls: "bg-navy-50 text-navy-700" },
  };
  const s = map[status] ?? { label: status, cls: "bg-navy-50 text-navy-700" };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", s.cls)}>
      {s.label}
      {status === "accepted" ? <Check className="h-2.5 w-2.5" /> : null}
    </span>
  );
}

function classifySlot(
  slot: TimeBlock,
  busy: BusyBlock[]
): "free" | "soft" | "hard" {
  let worst: "free" | "soft" | "hard" = "free";
  for (const b of busy) {
    const sA = new Date(slot.start).getTime();
    const eA = new Date(slot.end).getTime();
    const sB = new Date(b.start).getTime();
    const eB = new Date(b.end).getTime();
    if (sA < eB && sB < eA) {
      if (b.kind === "meeting") return "hard";
      worst = "soft";
    }
  }
  return worst;
}
