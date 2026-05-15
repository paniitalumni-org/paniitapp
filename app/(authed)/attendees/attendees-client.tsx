"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { IIT_CAMPUSES, INTERESTS, ROLES } from "@/lib/constants";
import { cn, initials } from "@/lib/utils";

export interface AttendeeRow {
  id: string;
  full_name: string | null;
  designation: string | null;
  company: string | null;
  role: string | null;
  iit_campus: string | null;
  graduation_year: number | null;
  interests: string[] | null;
  avatar_url: string | null;
  available_for_meetings: boolean | null;
  office_hours_enabled: boolean | null;
}

interface Filters {
  q: string;
  roles: string[];
  campuses: string[];
  yearMin: number;
  yearMax: number;
  interests: string[];
  availableOnly: boolean;
}

const PAGE_SIZE = 50;
const YEAR_MIN = 1970;
const YEAR_MAX = 2025;

function shortCampus(name: string | null): string | null {
  if (!name) return null;
  if (name.startsWith("IIT ")) return `IIT ${name.slice(4, 8)}`;
  return name;
}

function campusBatch(p: AttendeeRow): string | null {
  const c = shortCampus(p.iit_campus);
  if (!c) return null;
  if (!p.graduation_year) return c;
  const yy = String(p.graduation_year).slice(-2);
  return `${c} '${yy}`;
}

export function AttendeesClient({ initialRows }: { initialRows: AttendeeRow[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<AttendeeRow[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initialRows.length < PAGE_SIZE);
  const [filterOpen, setFilterOpen] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    q: "",
    roles: [],
    campuses: [],
    yearMin: YEAR_MIN,
    yearMax: YEAR_MAX,
    interests: [],
    availableOnly: false,
  });
  const [searchInput, setSearchInput] = useState("");

  // Debounce search input → filters.q
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, q: searchInput.trim() })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchPage = useCallback(
    async (offset: number, currentFilters: Filters): Promise<AttendeeRow[]> => {
      let q = supabase
        .from("profiles")
        .select(
          "id, full_name, designation, company, role, iit_campus, graduation_year, interests, avatar_url, available_for_meetings, office_hours_enabled"
        )
        .order("full_name", { ascending: true, nullsFirst: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (currentFilters.q) {
        const term = currentFilters.q.replace(/[%_,]/g, "");
        q = q.or(`full_name.ilike.%${term}%,company.ilike.%${term}%`);
      }
      if (currentFilters.roles.length > 0) {
        q = q.in("role", currentFilters.roles);
      }
      if (currentFilters.campuses.length > 0) {
        q = q.in("iit_campus", currentFilters.campuses);
      }
      if (currentFilters.yearMin > YEAR_MIN) {
        q = q.gte("graduation_year", currentFilters.yearMin);
      }
      if (currentFilters.yearMax < YEAR_MAX) {
        q = q.lte("graduation_year", currentFilters.yearMax);
      }
      if (currentFilters.interests.length > 0) {
        q = q.overlaps("interests", currentFilters.interests);
      }
      if (currentFilters.availableOnly) {
        q = q.or("available_for_meetings.eq.true,office_hours_enabled.eq.true");
      }

      const { data } = await q;
      return (data as AttendeeRow[] | null) ?? [];
    },
    [supabase]
  );

  // Re-fetch from start when filters change
  const filterKey = JSON.stringify(filters);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const page = await fetchPage(0, filters);
      if (cancelled) return;
      setRows(page);
      setDone(page.length < PAGE_SIZE);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, fetchPage]);

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || done || loading) return;
    const io = new IntersectionObserver(
      async (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setLoading(true);
        const page = await fetchPage(rows.length, filters);
        setRows((prev) => [...prev, ...page]);
        if (page.length < PAGE_SIZE) setDone(true);
        setLoading(false);
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rows.length, done, loading, filters, fetchPage]);

  const activeFilterCount =
    filters.roles.length +
    filters.campuses.length +
    filters.interests.length +
    (filters.yearMin > YEAR_MIN ? 1 : 0) +
    (filters.yearMax < YEAR_MAX ? 1 : 0) +
    (filters.availableOnly ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or company"
            className="h-10 pl-9"
            aria-label="Search attendees"
          />
        </div>
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-1.5 h-10">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 ? (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-800 px-1.5 text-[10px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Filter attendees</SheetTitle>
            </SheetHeader>
            <FilterPanel
              value={filters}
              onApply={(next) => {
                setFilters(next);
                setFilterOpen(false);
              }}
              onClear={() => {
                setFilters({
                  q: filters.q,
                  roles: [],
                  campuses: [],
                  yearMin: YEAR_MIN,
                  yearMax: YEAR_MAX,
                  interests: [],
                  availableOnly: false,
                });
                setFilterOpen(false);
              }}
            />
          </SheetContent>
        </Sheet>
      </div>

      {rows.length === 0 && !loading ? (
        <div className="px-4 py-12 text-center text-sm text-slate-500">
          No attendees match these filters.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((p) => {
            const batch = campusBatch(p);
            return (
              <li key={p.id}>
                <Link
                  href={`/attendees/${p.id}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300"
                >
                  <Avatar className="h-12 w-12 shrink-0">
                    {p.avatar_url ? (
                      <AvatarImage src={p.avatar_url} alt={p.full_name ?? ""} />
                    ) : null}
                    <AvatarFallback className="bg-brand-50 text-brand-800">
                      {initials(p.full_name ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold text-brand-900">
                        {p.full_name ?? "—"}
                      </div>
                      {p.role ? (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-700">
                          {p.role}
                        </span>
                      ) : null}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {[p.designation, p.company].filter(Boolean).join(" · ") || ""}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {batch ? (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-800">
                          {batch}
                        </span>
                      ) : null}
                      {p.interests?.slice(0, 2).map((i) => (
                        <span
                          key={i}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700"
                        >
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {!done ? (
        <div ref={sentinelRef} className="flex items-center justify-center py-6">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
        </div>
      ) : rows.length > 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">End of list</div>
      ) : null}
    </div>
  );
}

function FilterPanel({
  value,
  onApply,
  onClear,
}: {
  value: Filters;
  onApply: (next: Filters) => void;
  onClear: () => void;
}) {
  const [draft, setDraft] = useState<Filters>(value);

  useEffect(() => setDraft(value), [value]);

  function toggleArr(key: "roles" | "campuses" | "interests", v: string) {
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(v) ? d[key].filter((x) => x !== v) : [...d[key], v],
    }));
  }

  return (
    <div className="space-y-5 px-6 pb-6 pt-2">
      <div>
        <Label className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Role
        </Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ROLES.map((r) => {
            const active = draft.roles.includes(r.value);
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => toggleArr("roles", r.value)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-brand-800 bg-brand-800 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium uppercase tracking-wider text-slate-500">
          IIT campus
        </Label>
        <div className="mt-2 max-h-32 overflow-y-auto rounded-md border border-slate-200 p-2">
          <div className="flex flex-wrap gap-1.5">
            {IIT_CAMPUSES.map((c) => {
              const active = draft.campuses.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleArr("campuses", c)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    active
                      ? "border-brand-800 bg-brand-800 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {c.replace("IIT ", "")}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Graduation year
          </Label>
          <span className="text-xs tabular-nums text-slate-600">
            {draft.yearMin} – {draft.yearMax}
          </span>
        </div>
        <div className="mt-2 space-y-2">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">From</span>
            <input
              type="range"
              min={YEAR_MIN}
              max={YEAR_MAX}
              value={draft.yearMin}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  yearMin: Math.min(Number(e.target.value), d.yearMax),
                }))
              }
              className="w-full accent-brand-800"
            />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">To</span>
            <input
              type="range"
              min={YEAR_MIN}
              max={YEAR_MAX}
              value={draft.yearMax}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  yearMax: Math.max(Number(e.target.value), d.yearMin),
                }))
              }
              className="w-full accent-brand-800"
            />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Interests
        </Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {INTERESTS.map((i) => {
            const active = draft.interests.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleArr("interests", i)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "border-brand-800 bg-brand-800 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                {i}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2.5">
        <span className="text-sm font-medium text-slate-900">Available for meetings</span>
        <input
          type="checkbox"
          checked={draft.availableOnly}
          onChange={(e) =>
            setDraft((d) => ({ ...d, availableOnly: e.target.checked }))
          }
          className="h-4 w-4 accent-brand-800"
        />
      </label>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClear}>
          Clear
        </Button>
        <Button onClick={() => onApply(draft)}>Apply</Button>
      </div>
    </div>
  );
}
