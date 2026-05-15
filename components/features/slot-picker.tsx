"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  buildAvailabilitySlots,
  classifySlot,
  slotLabel,
  type Slot,
  type SlotConflict,
} from "@/lib/slots";
import { cn } from "@/lib/utils";

interface ConflictWindow {
  start: string;
  end: string;
}

interface Props {
  inviteeId: string;
  selected: Slot[];
  onChange: (next: Slot[]) => void;
  max?: number;
}

export function SlotPicker({ inviteeId, selected, onChange, max = 3 }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const slots = useMemo(() => buildAvailabilitySlots(), []);
  const [bookmarked, setBookmarked] = useState<ConflictWindow[]>([]);
  const [accepted, setAccepted] = useState<ConflictWindow[]>([]);
  const [availableStarts, setAvailableStarts] = useState<Set<string> | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [bm, mt] = await Promise.all([
        supabase
          .from("session_bookmarks")
          .select("sessions(start_at, end_at)")
          .eq("user_id", user.id),
        supabase
          .from("meetings")
          .select("accepted_slot, status, requester_id, invitee_id")
          .or(`requester_id.eq.${user.id},invitee_id.eq.${user.id}`)
          .eq("status", "accepted"),
      ]);

      const bms = (bm.data as { sessions: { start_at: string; end_at: string } | null }[] | null) ?? [];
      setBookmarked(
        bms
          .map((r) => r.sessions)
          .filter((s): s is { start_at: string; end_at: string } => !!s)
          .map((s) => ({ start: s.start_at, end: s.end_at }))
      );

      const mts = (mt.data as { accepted_slot: { start: string; end: string } | null }[] | null) ?? [];
      setAccepted(
        mts
          .map((m) => m.accepted_slot)
          .filter((s): s is { start: string; end: string } => !!s)
      );
    })();
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("availability_slots")
        .select("slot_start")
        .eq("user_id", inviteeId)
        .eq("status", "available");

      setAvailableStarts(
        new Set(
          ((data as { slot_start: string }[] | null) ?? []).map((r) =>
            new Date(r.slot_start).toISOString()
          )
        )
      );
    })();
  }, [inviteeId, supabase]);

  function isPicked(s: Slot): boolean {
    return selected.some((p) => p.start === s.start);
  }

  function toggle(s: Slot) {
    if (!availableStarts?.has(s.start)) return;
    if (isPicked(s)) {
      onChange(selected.filter((p) => p.start !== s.start));
      return;
    }
    let next = [...selected, s];
    if (next.length > max) next = next.slice(next.length - max);
    onChange(next);
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const hour = slotLabel(s).split(":")[0];
      const period = slotLabel(s).slice(-2);
      const key = `${hour} ${period}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries());
  }, [slots]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
        <LegendDot color="bg-white border border-slate-300" /> Available
        <LegendDot color="bg-slate-100 border border-slate-200" /> Not available
        <LegendDot color="bg-amber-100 border border-amber-400" /> Conflicts with bookmark
        <LegendDot color="bg-iit-100 border border-iit-400" /> Conflicts with meeting
        <LegendDot color="bg-brand-800" /> Selected
      </div>

      <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
        {grouped.map(([hour, items]) => (
          <div key={hour}>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wider tabular-nums text-slate-500">
              {hour}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {items.map((s) => {
                const c = classifySlot(s, bookmarked, accepted);
                const inviteeAvailable = availableStarts?.has(s.start) ?? false;
                const picked = isPicked(s);
                const disabled = !inviteeAvailable || (c === "hard" && !picked);
                return (
                  <button
                    key={s.start}
                    type="button"
                    onClick={() => toggle(s)}
                    disabled={disabled}
                    aria-pressed={picked}
                    className={cn(
                      "h-9 rounded-md border text-[11px] font-medium tabular-nums transition-colors",
                      inviteeAvailable
                        ? conflictStyles(c, picked)
                        : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    )}
                  >
                    {slotLabel(s)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-500">
        Pick up to {max} available slots. The other person picks one to accept.
      </div>
    </div>
  );
}

function LegendDot({ color }: { color: string }) {
  return <span className={cn("inline-block h-3 w-3 rounded", color)} />;
}

function conflictStyles(c: SlotConflict, picked: boolean): string {
  if (picked) return "bg-brand-800 text-white border-brand-800";
  switch (c) {
    case "free":
      return "bg-white text-slate-700 border-slate-300 hover:bg-slate-50";
    case "soft":
      return "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100";
    case "hard":
      return "bg-iit-50 text-iit-700 border-iit-200 opacity-60 cursor-not-allowed";
  }
}
