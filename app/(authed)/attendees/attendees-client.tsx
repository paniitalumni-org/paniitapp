"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
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
  photo_url: string | null;
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

function emptyFilters(): Filters {
  return {
    q: "",
    roles: [],
    campuses: [],
    yearMin: YEAR_MIN,
    yearMax: YEAR_MAX,
    interests: [],
    availableOnly: false,
  };
}

function countActive(f: Filters): number {
  return (
    f.roles.length +
    f.campuses.length +
    f.interests.length +
    (f.yearMin > YEAR_MIN ? 1 : 0) +
    (f.yearMax < YEAR_MAX ? 1 : 0) +
    (f.availableOnly ? 1 : 0)
  );
}

export function AttendeesClient({ initialRows }: { initialRows: AttendeeRow[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<AttendeeRow[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initialRows.length < PAGE_SIZE);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, q: searchInput.trim() })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchPage = useCallback(
    async (offset: number, currentFilters: Filters): Promise<AttendeeRow[]> => {
      let q = supabase
        .from("profiles")
        .select(
          "id, full_name, designation, company, role, iit_campus, graduation_year, interests, photo_url, available_for_meetings, office_hours_enabled"
        )
        .order("full_name", { ascending: true, nullsFirst: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (currentFilters.q) {
        const term = currentFilters.q.replace(/[%_,]/g, "");
        q = q.or(`full_name.ilike.%${term}%,company.ilike.%${term}%`);
      }
      if (currentFilters.roles.length > 0) q = q.in("role", currentFilters.roles);
      if (currentFilters.campuses.length > 0) q = q.in("iit_campus", currentFilters.campuses);
      if (currentFilters.yearMin > YEAR_MIN) q = q.gte("graduation_year", currentFilters.yearMin);
      if (currentFilters.yearMax < YEAR_MAX) q = q.lte("graduation_year", currentFilters.yearMax);
      if (currentFilters.interests.length > 0) q = q.overlaps("interests", currentFilters.interests);
      if (currentFilters.availableOnly)
        q = q.or("available_for_meetings.eq.true,office_hours_enabled.eq.true");

      const { data } = await q;
      return (data as AttendeeRow[] | null) ?? [];
    },
    [supabase]
  );

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

  const activeCount = countActive(filters);

  function clearAll() {
    setFilters(emptyFilters());
    setSearchInput("");
  }

  return (
    <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
      {/* Left column: search + filters */}
      <aside className="mb-5 flex flex-col gap-3 lg:mb-0 lg:sticky lg:top-[5.5rem] lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
        <div className="rounded-lg border border-slate-200 bg-white p-4 lg:p-5">
          <SearchInput value={searchInput} onChange={setSearchInput} />
          <div className="mt-3 lg:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="inline-flex items-center gap-2">
                    <SlidersHorizontal className="size-4" />
                    Filters
                  </span>
                  {activeCount > 0 ? (
                    <Badge className="bg-brand-800 text-white">{activeCount}</Badge>
                  ) : null}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filter attendees</SheetTitle>
                </SheetHeader>
                <div className="px-6 pb-6 pt-2">
                  <FilterFields value={filters} onChange={setFilters} />
                  <div className="mt-5 flex items-center justify-between">
                    <Button variant="ghost" onClick={clearAll}>
                      Clear all
                    </Button>
                    <Button onClick={() => setSheetOpen(false)}>Done</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Desktop: filters always visible */}
        <div className="hidden rounded-lg border border-slate-200 bg-white p-5 lg:block">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Filters
            </h2>
            {activeCount > 0 ? (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900"
              >
                <X className="size-3" />
                Clear ({activeCount})
              </button>
            ) : null}
          </div>
          <FilterFields value={filters} onChange={setFilters} />
        </div>
      </aside>

      {/* Right column: results */}
      <div className="min-w-0">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-slate-600">
            {loading ? "Searching…" : `${rows.length} ${rows.length === 1 ? "person" : "people"}`}
            {activeCount > 0 && !loading ? (
              <span className="ml-1 text-xs text-slate-400">(filtered)</span>
            ) : null}
          </h2>
        </div>

        {rows.length === 0 && !loading ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No matches</EmptyTitle>
              <EmptyDescription>Try widening your filters.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((p) => {
              const batch = campusBatch(p);
              return (
                <li key={p.id}>
                  <Link
                    href={`/attendees/${p.id}`}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300"
                  >
                    <Avatar className="size-12 shrink-0">
                      {p.photo_url ? (
                        <AvatarImage src={p.photo_url} alt={p.full_name ?? ""} />
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
                          <Badge variant="secondary" className="shrink-0 capitalize">
                            {p.role}
                          </Badge>
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
            {loading ? <Loader2 className="size-4 animate-spin text-slate-400" /> : null}
          </div>
        ) : rows.length > 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">End of list</div>
        ) : null}
      </div>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name or company"
        className="pl-9"
        aria-label="Search attendees"
      />
    </div>
  );
}

function FilterFields({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (next: Filters) => void;
}) {
  function toggleArr(key: "roles" | "campuses" | "interests", v: string) {
    const cur = value[key];
    onChange({
      ...value,
      [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v],
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <FilterGroup label="Role">
        <ChipGrid>
          {ROLES.map((r) => (
            <Chip
              key={r.value}
              active={value.roles.includes(r.value)}
              onClick={() => toggleArr("roles", r.value)}
            >
              {r.label}
            </Chip>
          ))}
        </ChipGrid>
      </FilterGroup>

      <FilterGroup label="IIT campus">
        <div className="max-h-44 overflow-y-auto rounded-md border border-slate-200 p-2">
          <ChipGrid>
            {IIT_CAMPUSES.map((c) => (
              <Chip
                key={c}
                active={value.campuses.includes(c)}
                onClick={() => toggleArr("campuses", c)}
              >
                {c.replace("IIT ", "")}
              </Chip>
            ))}
          </ChipGrid>
        </div>
      </FilterGroup>

      <FilterGroup label="Graduation year">
        <div className="text-xs tabular-nums text-slate-600">
          {value.yearMin} – {value.yearMax}
        </div>
        <div className="mt-1.5 flex flex-col gap-2">
          <RangeRow
            sub="From"
            min={YEAR_MIN}
            max={YEAR_MAX}
            value={value.yearMin}
            onChange={(v) => onChange({ ...value, yearMin: Math.min(v, value.yearMax) })}
          />
          <RangeRow
            sub="To"
            min={YEAR_MIN}
            max={YEAR_MAX}
            value={value.yearMax}
            onChange={(v) => onChange({ ...value, yearMax: Math.max(v, value.yearMin) })}
          />
        </div>
      </FilterGroup>

      <FilterGroup label="Interests">
        <div className="max-h-44 overflow-y-auto rounded-md border border-slate-200 p-2">
          <ChipGrid>
            {INTERESTS.map((i) => (
              <Chip
                key={i}
                active={value.interests.includes(i)}
                onClick={() => toggleArr("interests", i)}
              >
                {i}
              </Chip>
            ))}
          </ChipGrid>
        </div>
      </FilterGroup>

      <label className="flex cursor-pointer items-center justify-between rounded-md border border-slate-200 px-3 py-2.5">
        <span className="text-sm font-medium text-slate-900">Available for meetings</span>
        <input
          type="checkbox"
          checked={value.availableOnly}
          onChange={(e) => onChange({ ...value, availableOnly: e.target.checked })}
          className="size-4 accent-brand-800"
        />
      </label>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function ChipGrid({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function Chip({
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
        "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "border-brand-800 bg-brand-800 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

function RangeRow({
  sub,
  min,
  max,
  value,
  onChange,
}: {
  sub: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
        <span>{sub}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-800"
      />
    </div>
  );
}
