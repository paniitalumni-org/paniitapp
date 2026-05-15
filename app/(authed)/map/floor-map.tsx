"use client";

import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { rangeIST } from "@/lib/date";
import { cn } from "@/lib/utils";

export interface VenueRow {
  id: string;
  name: string;
  // venues.floor is text in the DB (e.g. "ground", "1st").
  // map_floor is integer if you want a sortable/orderable floor.
  floor: string | null;
  map_floor: number | null;
  map_x: number | null;
  map_y: number | null;
  capacity: number | null;
}

export interface SessionAtVenue {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  venue_id: string | null;
  track: string | null;
}

const CANVAS_W = 600;
const CANVAS_H = 400;
const HALL_W = 130;
const HALL_H = 70;
const PADDING = 24;

function layoutVenues(venues: VenueRow[]): { v: VenueRow; x: number; y: number; w: number; h: number }[] {
  // Use provided map_x/map_y when present (0–100 normalized), otherwise fall back to a grid.
  const withCoords = venues.filter((v) => v.map_x != null && v.map_y != null);
  const useGrid = withCoords.length < venues.length;

  if (!useGrid) {
    return venues.map((v) => ({
      v,
      x: Math.round(((v.map_x ?? 50) / 100) * (CANVAS_W - HALL_W - PADDING * 2)) + PADDING,
      y: Math.round(((v.map_y ?? 50) / 100) * (CANVAS_H - HALL_H - PADDING * 2)) + PADDING,
      w: HALL_W,
      h: HALL_H,
    }));
  }

  const cols = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(venues.length))));
  const gapX = 16;
  const gapY = 20;
  return venues.map((v, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    return {
      v,
      x: PADDING + c * (HALL_W + gapX),
      y: PADDING + r * (HALL_H + gapY),
      w: HALL_W,
      h: HALL_H,
    };
  });
}

export function FloorMap({
  venues,
  sessions,
}: {
  venues: VenueRow[];
  sessions: SessionAtVenue[];
}) {
  const floors = useMemo(() => {
    const set = new Set<number>();
    venues.forEach((v) => {
      if (v.map_floor != null) set.add(v.map_floor);
      else if (v.floor != null) set.add(/^\d+$/.test(v.floor) ? Number(v.floor) : 0);
      else set.add(0);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [venues]);

  const [floor, setFloor] = useState<number>(floors[0] ?? 0);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<VenueRow | null>(null);

  const floorVenues = useMemo(() => {
    return venues.filter((v) => {
      const f = v.map_floor != null
        ? v.map_floor
        : v.floor != null && /^\d+$/.test(v.floor)
        ? Number(v.floor)
        : 0;
      return f === floor;
    });
  }, [venues, floor]);

  const matchedIds = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return new Set<string>();
    return new Set(
      floorVenues.filter((v) => v.name.toLowerCase().includes(term)).map((v) => v.id)
    );
  }, [search, floorVenues]);

  const positioned = useMemo(() => layoutVenues(floorVenues), [floorVenues]);

  const venueSessions = useMemo(() => {
    if (!selected) return [];
    return sessions
      .filter((s) => s.venue_id === selected.id)
      .sort((a, b) => a.start_at.localeCompare(b.start_at));
  }, [selected, sessions]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border border-slate-300 bg-white p-1">
          {floors.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFloor(f)}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                f === floor
                  ? "bg-brand-800 text-white"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              {f === 0 ? "Ground Floor" : f === 1 ? "1st Floor" : `Floor ${f}`}
            </button>
          ))}
        </div>
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a hall..."
            className="pl-9"
            aria-label="Find a hall"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <svg
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          className="block w-full"
          role="img"
          aria-label={`Floor ${floor} map`}
        >
          <rect
            x={4}
            y={4}
            width={CANVAS_W - 8}
            height={CANVAS_H - 8}
            rx={12}
            className="fill-slate-50 stroke-slate-300"
            strokeWidth={1.5}
          />
          {positioned.map(({ v, x, y, w, h }) => {
            const highlighted = matchedIds.has(v.id);
            return (
              <g
                key={v.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(v)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelected(v);
                }}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx={8}
                  className={cn(
                    "transition-colors",
                    highlighted
                      ? "fill-brand-100 stroke-brand-800"
                      : "fill-white stroke-slate-300 hover:fill-slate-100"
                  )}
                  strokeWidth={highlighted ? 2 : 1.25}
                />
                <text
                  x={x + w / 2}
                  y={y + h / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={cn(
                    "select-none text-[12px] font-medium",
                    highlighted ? "fill-brand-900" : "fill-slate-700"
                  )}
                >
                  {v.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          {floor === 0 ? "Ground floor" : `Floor ${floor}`} · {floorVenues.length} venue
          {floorVenues.length === 1 ? "" : "s"}
        </h2>
        <ul className="space-y-2">
          {floorVenues.map((v) => {
            const highlighted = matchedIds.has(v.id);
            return (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => setSelected(v)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors",
                    highlighted
                      ? "border-brand-800 bg-brand-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-brand-900">{v.name}</span>
                  </span>
                  {v.capacity ? (
                    <span className="text-xs tabular-nums text-slate-500">
                      Capacity {v.capacity}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="bottom">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>
                  {selected.floor ?? `Floor ${selected.map_floor ?? 0}`}
                  {selected.capacity ? ` · Capacity ${selected.capacity}` : ""}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-2 px-6 pb-6 pt-2">
                {venueSessions.length === 0 ? (
                  <p className="text-sm text-slate-500">No sessions in this venue.</p>
                ) : (
                  <ul className="space-y-2">
                    {venueSessions.map((s) => (
                      <li
                        key={s.id}
                        className="rounded-md border border-slate-200 bg-white p-3"
                      >
                        <div className="text-xs font-medium tabular-nums text-slate-900">
                          {rangeIST(s.start_at, s.end_at)}
                        </div>
                        <div className="mt-0.5 text-sm font-semibold text-brand-900">
                          {s.title}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
