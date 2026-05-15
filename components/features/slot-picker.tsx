"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  buildDaySlots,
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
  selected: Slot[];
  onChange: (next: Slot[]) => void;
  max?: number;
}

export function SlotPicker({ selected, onChange, max = 3 }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const slots = useMemo(() => buildDaySlots(), []);
  const [bookmarked, setBookmarked] = useState<ConflictWindow[]>([]);
  const [accepted, setAccepted] = useState<ConflictWindow[]>([]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [bm, mt] = await Promise.all([
        supabase
          .from("session_bookmarks")
          .select("sessions(starts_at, ends_at)")
          .eq("user_id", user.id),
        supabase
          .from("meetings")
          .select("scheduled_start, scheduled_end, status, requester_id, invitee_id")
          .or(`requester_id.eq.${user.id},invitee_id.eq.${user.id}`)
          .eq("status", "accepted"),
      ]);

      const bms = (bm.data as { sessions: { starts_at: string; ends_at: string } | null }[] | null) ?? [];
      setBookmarked(
        bms
          .map((r) => r.sessions)
          .filter((s): s is { starts_at: string; ends_at: string } => !!s)
          .map((s) => ({ start: s.starts_at, end: s.ends_at }))
      );

      const mts = (mt.data as {
        scheduled_start: string | null;
        scheduled_end: string | null;
      }[] | null) ?? [];
      setAccepted(
        mts
          .filter((m): m is { scheduled_start: string; scheduled_end: string } =>
            !!m.scheduled_start && !!m.scheduled_end
          )
          .map((m) => ({ start: m.scheduled_start, end: m.scheduled_end }))
      );
    })();
  }, [supabase]);

  function isPicked(s: Slot): boolean {
    return selected.some((p) => p.start === s.start);
  }

  function toggle(s: Slot) {
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
        <LegendDot color="bg-white border border-slate-300" /> Free
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
                const picked = isPicked(s);
                return (
                  <button
                    key={s.start}
                    type="button"
                    onClick={() => toggle(s)}
                    disabled={c === "hard" && !picked}
                    aria-pressed={picked}
                    className={cn(
                      "h-9 rounded-md border text-[11px] font-medium tabular-nums transition-colors",
                      conflictStyles(c, picked)
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
        Pick up to {max} slots. The other person picks one to accept.
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
