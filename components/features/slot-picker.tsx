"use client";

import { useMemo } from "react";
import { summitSlots, overlaps, type TimeBlock } from "@/lib/slots";
import { timeIST } from "@/lib/date";
import { cn } from "@/lib/utils";

export interface BusyBlock extends TimeBlock {
  kind: "session" | "meeting";
}

export function SlotPicker({
  value,
  onChange,
  busy = [],
  max = 3,
}: {
  value: TimeBlock[];
  onChange: (next: TimeBlock[]) => void;
  busy?: BusyBlock[];
  max?: number;
}) {
  const slots = useMemo(() => summitSlots(), []);

  function statusFor(slot: TimeBlock): "hard" | "soft" | "free" {
    let worst: "hard" | "soft" | "free" = "free";
    for (const b of busy) {
      if (!overlaps(slot, b)) continue;
      if (b.kind === "meeting") return "hard";
      if (b.kind === "session") worst = "soft";
    }
    return worst;
  }

  function isPicked(slot: TimeBlock): boolean {
    return value.some((s) => s.start === slot.start);
  }

  function toggle(slot: TimeBlock) {
    if (isPicked(slot)) {
      onChange(value.filter((s) => s.start !== slot.start));
    } else {
      if (value.length >= max) {
        // Replace oldest pick.
        const next = [...value.slice(1), slot];
        onChange(next);
      } else {
        onChange([...value, slot]);
      }
    }
  }

  // Group slots by hour for a compact rendering
  const byHour = useMemo(() => {
    const m = new Map<string, TimeBlock[]>();
    slots.forEach((s) => {
      const h = timeIST(s.start).split(" ")[0].split(":")[0] + " " + timeIST(s.start).split(" ")[1];
      if (!m.has(h)) m.set(h, []);
      m.get(h)!.push(s);
    });
    return m;
  }, [slots]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-[11px]">
        <Legend color="border-navy-300 bg-white" label="Free" />
        <Legend color="border-amber-400 bg-amber-50" label="Soft conflict (session)" />
        <Legend color="border-red-400 bg-red-50" label="Hard conflict (meeting)" />
        <span className="ml-auto text-navy-500">
          {value.length}/{max} picked
        </span>
      </div>

      <div className="space-y-3">
        {Array.from(byHour.entries()).map(([hour, items]) => (
          <div key={hour}>
            <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-navy-500 tabular-nums">
              {hour}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {items.map((s) => {
                const st = statusFor(s);
                const picked = isPicked(s);
                return (
                  <button
                    type="button"
                    key={s.start}
                    onClick={() => toggle(s)}
                    aria-pressed={picked}
                    className={cn(
                      "rounded-md border px-1 py-1.5 text-[11px] font-medium tabular-nums transition",
                      picked
                        ? "border-navy-800 bg-navy-800 text-white"
                        : st === "hard"
                        ? "border-red-300 bg-red-50 text-red-700"
                        : st === "soft"
                        ? "border-amber-300 bg-amber-50 text-amber-700"
                        : "border-navy-200 bg-white text-navy-700 hover:border-navy-400"
                    )}
                  >
                    {timeIST(s.start).replace(" AM", "").replace(" PM", "")}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("inline-block h-2.5 w-2.5 rounded-sm border", color)} />
      {label}
    </span>
  );
}
