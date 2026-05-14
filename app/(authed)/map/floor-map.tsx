"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TRACK_COLOR_BG, TRACK_LABELS } from "@/lib/constants";
import { rangeIST } from "@/lib/date";
import { cn } from "@/lib/utils";

interface VenueRow {
  id: string;
  name: string;
  floor: number | null;
  map_x: number | null;
  map_y: number | null;
  map_floor: number | null;
}

interface SessionAtVenue {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  venue_id: string | null;
  track: string | null;
}

const VIEW_W = 360;
const VIEW_H = 480;

export function FloorMap({
  venues,
  sessions,
}: {
  venues: VenueRow[];
  sessions: SessionAtVenue[];
}) {
  const [floor, setFloor] = useState<number>(1);
  const [openVenue, setOpenVenue] = useState<VenueRow | null>(null);
  const [query, setQuery] = useState("");

  const venuesOnFloor = useMemo(
    () => venues.filter((v) => (v.map_floor ?? v.floor ?? 1) === floor),
    [venues, floor]
  );
  const queryMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return new Set<string>();
    return new Set(
      venues
        .filter((v) => v.name.toLowerCase().includes(q))
        .map((v) => v.id)
    );
  }, [venues, query]);

  return (
    <>
      {/* Search + floor toggle */}
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <Input
            type="search"
            placeholder="Find a hall…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 pl-8"
          />
        </div>
        <div className="inline-flex rounded-lg bg-navy-50 p-1">
          {[1, 2].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFloor(f)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition",
                floor === f
                  ? "bg-white text-navy-900 shadow"
                  : "text-navy-500 hover:text-navy-700"
              )}
            >
              F{f}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-navy-100 bg-white p-2">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Floor ${floor} map`}
        >
          {/* Floor outline */}
          <rect
            x={8}
            y={8}
            width={VIEW_W - 16}
            height={VIEW_H - 16}
            rx={18}
            fill="#f0f4fa"
            stroke="#bccfe4"
            strokeWidth={1.5}
          />
          {/* Decorative gridlines */}
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={`g${i}`}
              x1={8}
              x2={VIEW_W - 8}
              y1={8 + (i + 1) * ((VIEW_H - 16) / 9)}
              y2={8 + (i + 1) * ((VIEW_H - 16) / 9)}
              stroke="#dde6f1"
              strokeWidth={0.5}
            />
          ))}
          {/* Venue cells — using map_x/map_y as percentages, with fallback grid */}
          {venuesOnFloor.map((v, idx) => {
            const cols = 2;
            const fallbackX = 0.1 + (idx % cols) * 0.45;
            const fallbackY = 0.08 + Math.floor(idx / cols) * 0.18;
            const px = ((v.map_x ?? fallbackX) as number) * (VIEW_W - 16) + 8;
            const py = ((v.map_y ?? fallbackY) as number) * (VIEW_H - 16) + 8;
            const w = 140;
            const h = 70;
            const highlight = queryMatch.has(v.id);
            return (
              <g
                key={v.id}
                role="button"
                tabIndex={0}
                onClick={() => setOpenVenue(v)}
                onKeyDown={(e) => e.key === "Enter" && setOpenVenue(v)}
                className="cursor-pointer focus:outline-none"
              >
                <rect
                  x={px}
                  y={py}
                  width={w}
                  height={h}
                  rx={10}
                  fill={highlight ? "#fdf9ed" : "#ffffff"}
                  stroke={highlight ? "#e7b139" : "#1e3a5f"}
                  strokeWidth={highlight ? 2 : 1}
                />
                <text
                  x={px + w / 2}
                  y={py + h / 2 + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#1e3a5f"
                  pointerEvents="none"
                >
                  {v.name.length > 18 ? v.name.slice(0, 16) + "…" : v.name}
                </text>
              </g>
            );
          })}
          {/* Legend */}
          <g transform={`translate(16, ${VIEW_H - 28})`}>
            <rect width={100} height={20} rx={10} fill="#1e3a5f" opacity={0.92} />
            <text x={50} y={14} textAnchor="middle" fontSize="10" fill="#fff" fontWeight={600}>
              Floor {floor} · {venuesOnFloor.length} halls
            </text>
          </g>
        </svg>
      </div>

      <Sheet open={!!openVenue} onOpenChange={(o) => !o && setOpenVenue(null)}>
        <SheetContent side="bottom" className="px-0">
          {openVenue ? (
            <>
              <SheetHeader>
                <SheetTitle>
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-navy-50 text-navy-700">
                      <MapPin className="h-4 w-4" />
                    </span>
                    {openVenue.name}
                  </div>
                </SheetTitle>
                <p className="text-xs text-navy-500">
                  Floor {openVenue.map_floor ?? openVenue.floor ?? 1}
                </p>
              </SheetHeader>
              <div className="px-6 pb-6">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
                  Today at this venue
                </h3>
                <VenueSessions
                  venueId={openVenue.id}
                  sessions={sessions.filter((s) => s.venue_id === openVenue.id)}
                />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function VenueSessions({
  venueId,
  sessions,
}: {
  venueId: string;
  sessions: SessionAtVenue[];
}) {
  if (sessions.length === 0) {
    return <p className="text-sm text-navy-500">No sessions scheduled here today.</p>;
  }
  return (
    <ul className="space-y-2">
      {sessions.map((s) => {
        const track = (s.track ?? "general") as keyof typeof TRACK_COLOR_BG;
        return (
          <li key={s.id}>
            <Link
              href={`/agenda/${s.id}`}
              className="block rounded-lg border border-navy-100 bg-white p-3 transition hover:border-navy-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between text-xs text-navy-500">
                <span className="tabular-nums">{rangeIST(s.starts_at, s.ends_at)}</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white",
                    TRACK_COLOR_BG[track]
                  )}
                >
                  {TRACK_LABELS[track] ?? track}
                </span>
              </div>
              <div className="mt-1 text-sm font-semibold text-navy-900">{s.title}</div>
            </Link>
          </li>
        );
      })}
      {/* anchor venueId for ssr-safety */}
      <input type="hidden" value={venueId} readOnly />
    </ul>
  );
}
