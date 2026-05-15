"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Check, Clock4, Loader2, MessageCircle, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { formatInTimeZone } from "date-fns-tz";
import { SUMMIT_TZ } from "@/lib/constants";
import { rangeIST } from "@/lib/date";
import {
  buildAvailabilitySlots,
  classifySlot,
  slotHourIST,
  type Slot,
} from "@/lib/slots";
import { createClient } from "@/lib/supabase/client";
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

type Tab = "by-me" | "by-others";
type AvailStatus = "available" | "booked" | "blocked";

interface AvailabilityRow {
  slot_start: string;
  slot_end: string;
  status: AvailStatus;
}

export function MeetingsView({
  userId,
  meetings,
  bookmarks,
}: {
  userId: string | null;
  meetings: MeetingRow[];
  bookmarks: { id: string; title: string; start_at: string; end_at: string }[];
}) {
  const [tab, setTab] = useState<Tab>("by-me");
  const [availOpen, setAvailOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const byMe = useMemo(
    () => meetings.filter((m) => m.requester_id === userId),
    [meetings, userId]
  );
  const byOthers = useMemo(
    () => meetings.filter((m) => m.invitee_id === userId),
    [meetings, userId]
  );
  const accepted = useMemo(
    () => meetings.filter((m) => m.status === "accepted"),
    [meetings]
  );

  const myAcceptedWindows: Slot[] = useMemo(
    () =>
      accepted.flatMap((m) => {
        const s = asSlot(m.accepted_slot);
        return s ? [s] : [];
      }),
    [accepted]
  );

  const myBookmarkWindows = useMemo(
    () =>
      bookmarks
        .filter((b) => typeof b.start_at === "string" && typeof b.end_at === "string")
        .map((b) => ({ start: b.start_at, end: b.end_at })),
    [bookmarks]
  );

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
            description: "Try a different proposed slot.",
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
    <>
      <MeetingsGraph meetings={accepted} />

      {/* Availability button */}
      <button
        type="button"
        onClick={() => setAvailOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl border border-brand-100 bg-white px-5 py-4 text-left transition-colors hover:border-brand-200 hover:bg-brand-50/40"
      >
        <div className="flex items-center gap-3">
          <span className="inline-grid size-10 place-items-center rounded-full bg-brand-50 text-brand-800">
            <Clock4 className="size-[18px]" strokeWidth={1.8} />
          </span>
          <div>
            <div className="text-sm font-semibold text-brand-950">
              My availability
            </div>
            <div className="text-[12px] text-brand-900/70">
              Pick 30-min blocks on 16 May 2026
            </div>
          </div>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-800/75">
          Open
        </span>
      </button>

      {/* Sub-tabs */}
      <div className="inline-flex w-full rounded-full border border-brand-100 bg-white p-1 text-[13px] font-medium">
        <SubTabButton active={tab === "by-me"} onClick={() => setTab("by-me")}>
          Scheduled by me
        </SubTabButton>
        <SubTabButton active={tab === "by-others"} onClick={() => setTab("by-others")}>
          Scheduled by others
        </SubTabButton>
      </div>

      {/* List */}
      {tab === "by-me" ? (
        byMe.length === 0 ? (
          <EmptyMsg
            title="No meetings yet"
            body="Open an attendee profile and tap Schedule Meeting to send a request."
          />
        ) : (
          <ul className="space-y-3">
            {byMe.map((m) => (
              <SentRow key={m.id} m={m} />
            ))}
          </ul>
        )
      ) : null}

      {tab === "by-others" ? (
        byOthers.length === 0 ? (
          <EmptyMsg
            title="No requests yet"
            body="When someone asks to meet, it'll show up here."
          />
        ) : (
          <ul className="space-y-3">
            {byOthers.map((m) => (
              <InboxRow
                key={m.id}
                m={m}
                pendingId={pendingId}
                myBookmarkWindows={myBookmarkWindows}
                myAcceptedWindows={myAcceptedWindows}
                onAccept={accept}
                onDecline={decline}
              />
            ))}
          </ul>
        )
      ) : null}

      {userId ? (
        <AvailabilitySheet
          open={availOpen}
          onOpenChange={setAvailOpen}
          userId={userId}
          acceptedWindows={myAcceptedWindows}
        />
      ) : null}
    </>
  );
}

function SubTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex-1 rounded-full px-4 py-1.5 transition-colors",
        active
          ? "bg-brand-800 text-white"
          : "text-brand-800/70 hover:text-brand-900"
      )}
    >
      {children}
    </button>
  );
}

function MeetingsGraph({ meetings }: { meetings: MeetingRow[] }) {
  // 2-hour buckets, 8am to 10pm = 7 buckets.
  const buckets = [
    { label: "8a", lo: 8, hi: 10 },
    { label: "10a", lo: 10, hi: 12 },
    { label: "12p", lo: 12, hi: 14 },
    { label: "2p", lo: 14, hi: 16 },
    { label: "4p", lo: 16, hi: 18 },
    { label: "6p", lo: 18, hi: 20 },
    { label: "8p", lo: 20, hi: 22 },
  ];
  const counts = buckets.map(() => 0);
  for (const m of meetings) {
    const s = asSlot(m.accepted_slot);
    if (!s) continue;
    const h = slotHourIST(s.start);
    const idx = buckets.findIndex((b) => h >= b.lo && h < b.hi);
    if (idx >= 0) counts[idx] += 1;
  }
  const max = Math.max(1, ...counts);
  const total = counts.reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-800/75">
          Day at a glance
        </h2>
        <span className="text-[11px] font-medium text-brand-900/70">
          {total} confirmed
        </span>
      </div>
      <div className="mt-3 flex items-end gap-1.5">
        {buckets.map((b, i) => (
          <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                "w-full rounded-md transition-all",
                counts[i] > 0 ? "bg-brand-800" : "bg-brand-100"
              )}
              style={{
                height: `${counts[i] > 0 ? 8 + (counts[i] / max) * 44 : 6}px`,
              }}
              aria-hidden
            />
            <span className="text-[10px] font-medium tabular-nums text-brand-800/70">
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InboxRow({
  m,
  pendingId,
  myBookmarkWindows,
  myAcceptedWindows,
  onAccept,
  onDecline,
}: {
  m: MeetingRow;
  pendingId: string | null;
  myBookmarkWindows: { start: string; end: string }[];
  myAcceptedWindows: Slot[];
  onAccept: (id: string, slot: Slot) => void;
  onDecline: (id: string) => void;
}) {
  return (
    <li className="rounded-2xl border border-brand-100 bg-white p-4">
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0 ring-1 ring-brand-100">
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
            className="text-sm font-semibold text-brand-950 hover:text-brand-800"
          >
            {m.requester?.full_name ?? "Attendee"}
          </Link>
          <div className="text-xs text-brand-900/70">
            {[m.requester?.designation, m.requester?.company].filter(Boolean).join(" · ")}
          </div>
        </div>
        <StatusPill status={m.status} />
      </div>

      {m.message ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-brand-900">
          {m.message}
        </p>
      ) : null}
      {m.location ? (
        <p className="mt-1 text-xs text-brand-800/75">Location: {m.location}</p>
      ) : null}

      {m.status === "pending" ? (
        <>
          <div className="mt-3 space-y-1.5">
            {asSlotArray(m.proposed_slots).map((s) => {
              const c = classifySlot(s, myBookmarkWindows, myAcceptedWindows);
              return (
                <div
                  key={s.start}
                  className="flex items-center justify-between gap-2 rounded-lg border border-brand-100 bg-white px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <SlotState state={c} />
                    <span className="text-sm tabular-nums text-brand-900">
                      {formatInTimeZone(new Date(s.start), SUMMIT_TZ, "h:mm a")} –{" "}
                      {formatInTimeZone(new Date(s.end), SUMMIT_TZ, "h:mm a")}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onAccept(m.id, s)}
                    disabled={pendingId === m.id || c === "hard"}
                    className="h-8 rounded-full px-3"
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
              onClick={() => onDecline(m.id)}
              disabled={pendingId === m.id}
              className="h-8 rounded-full px-3"
            >
              <X className="h-3.5 w-3.5" />
              Decline
            </Button>
          </div>
        </>
      ) : (
        (() => {
          const s = asSlot(m.accepted_slot);
          return s ? (
            <p className="mt-3 text-sm font-medium tabular-nums text-brand-900">
              {rangeIST(s.start, s.end)}
            </p>
          ) : null;
        })()
      )}
    </li>
  );
}

function SentRow({ m }: { m: MeetingRow }) {
  const s = asSlot(m.accepted_slot);
  return (
    <li className="rounded-2xl border border-brand-100 bg-white p-4">
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0 ring-1 ring-brand-100">
          {m.invitee?.photo_url ? (
            <AvatarImage src={m.invitee.photo_url} alt="" />
          ) : null}
          <AvatarFallback className="bg-brand-50 text-brand-800">
            {initials(m.invitee?.full_name ?? "?")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <Link
            href={`/attendees/${m.invitee?.id}`}
            className="text-sm font-semibold text-brand-950 hover:text-brand-800"
          >
            {m.invitee?.full_name ?? "Attendee"}
          </Link>
          <div className="text-xs text-brand-900/70">
            {[m.invitee?.designation, m.invitee?.company].filter(Boolean).join(" · ")}
          </div>
        </div>
        <StatusPill status={m.status} />
      </div>
      {s ? (
        <p className="mt-3 text-sm font-medium tabular-nums text-brand-900">
          {rangeIST(s.start, s.end)}
        </p>
      ) : null}
      {m.status === "accepted" ? (
        <div className="mt-3">
          <Link
            href={`/meetings/${m.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-800 hover:text-brand-900"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Open chat
          </Link>
        </div>
      ) : null}
    </li>
  );
}

function EmptyMsg({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-100 bg-white p-8 text-center">
      <h3 className="text-sm font-semibold text-brand-900">{title}</h3>
      <p className="mt-1 text-xs text-brand-900/70">{body}</p>
    </div>
  );
}

function SlotState({ state }: { state: "free" | "soft" | "hard" }) {
  const map = {
    free: { dot: "bg-brand-800", label: "Free" },
    soft: { dot: "bg-amber-500", label: "Soft conflict" },
    hard: { dot: "bg-iit-500", label: "Booked" },
  };
  const m = map[state];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-900/75">
      <span className={cn("size-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

function StatusPill({ status }: { status: MeetingRow["status"] }) {
  const style: Record<MeetingRow["status"], string> = {
    pending: "bg-amber-50 text-amber-700",
    accepted: "bg-emerald-50 text-emerald-700",
    declined: "bg-iit-50 text-iit-700",
    rescheduled: "bg-brand-50 text-brand-800",
    cancelled: "bg-brand-50 text-brand-800/70",
  };
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        style[status]
      )}
    >
      {status}
    </span>
  );
}

function AvailabilitySheet({
  open,
  onOpenChange,
  userId,
  acceptedWindows,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  acceptedWindows: Slot[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const grid = useMemo(() => buildAvailabilitySlots(), []);
  const [rows, setRows] = useState<AvailabilityRow[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  // Status lookup: my-declared status overrides system "booked" inferred from
  // accepted meetings. Default = unset (treat as not available).
  const lookup = useMemo(() => {
    const m = new Map<string, AvailStatus>();
    for (const r of rows ?? []) m.set(r.slot_start, r.status);
    return m;
  }, [rows]);

  const acceptedStarts = useMemo(() => {
    const s = new Set<string>();
    for (const a of acceptedWindows) s.add(a.start);
    return s;
  }, [acceptedWindows]);

  const fetchAvail = useCallback(async () => {
    const { data } = await supabase
      .from("availability_slots")
      .select("slot_start, slot_end, status")
      .eq("user_id", userId);
    setRows((data as AvailabilityRow[] | null) ?? []);
  }, [supabase, userId]);

  useEffect(() => {
    if (!open) return;
    setRows(null);
    void fetchAvail();
  }, [open, fetchAvail]);

  async function setStatus(slot: Slot, next: AvailStatus | null) {
    setPending(slot.start);
    try {
      if (next === null) {
        await supabase
          .from("availability_slots")
          .delete()
          .eq("user_id", userId)
          .eq("slot_start", slot.start);
      } else {
        await supabase.from("availability_slots").upsert(
          {
            user_id: userId,
            slot_start: slot.start,
            slot_end: slot.end,
            status: next,
          },
          { onConflict: "user_id,slot_start" }
        );
      }
      await fetchAvail();
    } finally {
      setPending(null);
    }
  }

  function effectiveStatus(slot: Slot): AvailStatus | null {
    if (acceptedStarts.has(slot.start)) return "booked";
    return lookup.get(slot.start) ?? null;
  }

  function cycle(slot: Slot) {
    const cur = effectiveStatus(slot);
    // booked is system-derived; user cannot override
    if (cur === "booked") return;
    const order: (AvailStatus | null)[] = [null, "available", "blocked"];
    const idx = order.indexOf(cur);
    const next = order[(idx + 1) % order.length];
    void setStatus(slot, next);
  }

  // Group slots into morning (8-12), afternoon (12-17), evening (17-22)
  const sections = [
    { label: "Morning", slots: grid.filter((s) => slotHourIST(s.start) < 12) },
    {
      label: "Afternoon",
      slots: grid.filter(
        (s) => slotHourIST(s.start) >= 12 && slotHourIST(s.start) < 17
      ),
    },
    { label: "Evening", slots: grid.filter((s) => slotHourIST(s.start) >= 17) },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>My availability</SheetTitle>
          <SheetDescription>
            Tap a slot to cycle: unset → available → blocked. Confirmed meetings are auto-booked.
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-6 pt-3">
          <Legend />
          {rows === null ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-brand-800/60" />
            </div>
          ) : (
            <div className="space-y-5">
              {sections.map((sec) => (
                <div key={sec.label}>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-800/75">
                    {sec.label}
                  </h3>
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                    {sec.slots.map((s) => {
                      const st = effectiveStatus(s);
                      const isPending = pending === s.start;
                      return (
                        <button
                          key={s.start}
                          type="button"
                          onClick={() => cycle(s)}
                          disabled={st === "booked" || isPending}
                          aria-label={`${formatInTimeZone(
                            new Date(s.start),
                            SUMMIT_TZ,
                            "h:mm a"
                          )} ${st ?? "unset"}`}
                          className={cn(
                            "relative rounded-lg border px-2 py-2 text-[12px] font-semibold tabular-nums transition-all",
                            st === "available" &&
                              "border-brand-800 bg-brand-800 text-white",
                            st === "booked" &&
                              "cursor-not-allowed border-emerald-500 bg-emerald-500 text-white",
                            st === "blocked" &&
                              "border-iit-500 bg-iit-500 text-white",
                            !st &&
                              "border-brand-100 bg-white text-brand-900/65 hover:border-brand-200 hover:bg-brand-50/50",
                            isPending && "opacity-60"
                          )}
                        >
                          {formatInTimeZone(new Date(s.start), SUMMIT_TZ, "h:mm a")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Legend() {
  return (
    <div className="mb-4 flex flex-wrap gap-3 text-[11px] font-medium text-brand-900/75">
      <Swatch className="bg-brand-800" label="Available" />
      <Swatch className="bg-emerald-500" label="Booked" />
      <Swatch className="bg-iit-500" label="Blocked" />
      <Swatch className="border border-brand-100 bg-white" label="Unset" />
    </div>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-sm", className)} />
      {label}
    </span>
  );
}

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
