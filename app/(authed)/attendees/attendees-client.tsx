"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn, initials } from "@/lib/utils";
import { IIT_CAMPUSES, INTERESTS, ROLES } from "@/lib/constants";

interface Row {
  id: string;
  full_name: string | null;
  role: string | null;
  company: string | null;
  designation: string | null;
  iit_campus: string | null;
  graduation_year: number | null;
  interests: string[] | null;
  avatar_url: string | null;
  office_hours_enabled: boolean | null;
}

const PAGE = 30;

export function AttendeesClient({ initial }: { initial: Row[] }) {
  const [query, setQuery] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [campuses, setCampuses] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [yearRange, setYearRange] = useState<[number, number]>([1990, 2026]);
  const [visible, setVisible] = useState(PAGE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initial.filter((p) => {
      if (q) {
        const hay = [p.full_name, p.company, p.designation].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (roles.length && !roles.includes(p.role ?? "")) return false;
      if (campuses.length && !campuses.includes(p.iit_campus ?? "")) return false;
      if (interests.length) {
        const hasAny = (p.interests ?? []).some((i) => interests.includes(i));
        if (!hasAny) return false;
      }
      if (p.graduation_year != null) {
        if (p.graduation_year < yearRange[0] || p.graduation_year > yearRange[1]) return false;
      }
      if (availableOnly && !p.office_hours_enabled) return false;
      return true;
    });
  }, [initial, query, roles, campuses, interests, availableOnly, yearRange]);

  const totalActiveFilters =
    roles.length + campuses.length + interests.length + (availableOnly ? 1 : 0);

  return (
    <>
      <div className="sticky top-14 z-20 -mx-4 mb-3 border-b border-navy-100 bg-white/95 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
            <Input
              type="search"
              placeholder="Search by name or company"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 pl-8"
              aria-label="Search attendees"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Filters" className="relative">
                <Filter className="h-4 w-4" />
                {totalActiveFilters > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-white">
                    {totalActiveFilters}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="px-0">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 px-6 pb-6">
                <FilterGroup
                  label="Role"
                  options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
                  selected={roles}
                  onToggle={(v) =>
                    setRoles((prev) =>
                      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
                    )
                  }
                />
                <FilterGroup
                  label="IIT campus"
                  options={IIT_CAMPUSES.map((c) => ({ value: c, label: c }))}
                  selected={campuses}
                  onToggle={(v) =>
                    setCampuses((prev) =>
                      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
                    )
                  }
                />
                <FilterGroup
                  label="Interests"
                  options={INTERESTS.map((i) => ({ value: i, label: i }))}
                  selected={interests}
                  onToggle={(v) =>
                    setInterests((prev) =>
                      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
                    )
                  }
                />
                <div>
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
                    Graduation year
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={yearRange[0]}
                      min={1960}
                      max={2026}
                      onChange={(e) =>
                        setYearRange(([, hi]) => [Math.max(1960, +e.target.value || 0), hi])
                      }
                      className="h-9 w-24 tabular-nums"
                    />
                    <span className="text-navy-400">–</span>
                    <Input
                      type="number"
                      value={yearRange[1]}
                      min={1960}
                      max={2026}
                      onChange={(e) =>
                        setYearRange(([lo]) => [lo, Math.min(2026, +e.target.value || 0)])
                      }
                      className="h-9 w-24 tabular-nums"
                    />
                  </div>
                </div>
                <label className="flex items-center justify-between rounded-lg border border-navy-100 bg-navy-50/40 px-3 py-2 text-sm text-navy-800">
                  Available for meetings only
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={(e) => setAvailableOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-navy-300 text-navy-800"
                  />
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRoles([]);
                      setCampuses([]);
                      setInterests([]);
                      setAvailableOnly(false);
                      setYearRange([1990, 2026]);
                    }}
                    className="flex-1"
                  >
                    <X className="h-4 w-4" />
                    Clear all
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <p className="mb-3 text-xs text-navy-500">
        {filtered.length} {filtered.length === 1 ? "person" : "people"}
      </p>

      <ul className="space-y-2">
        {filtered.slice(0, visible).map((p) => (
          <li key={p.id}>
            <Link
              href={`/attendees/${p.id}`}
              className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white p-3 transition hover:border-navy-300 hover:shadow-sm"
            >
              <Avatar className="h-11 w-11">
                {p.avatar_url ? <AvatarImage src={p.avatar_url} alt={p.full_name ?? ""} /> : null}
                <AvatarFallback>{initials(p.full_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate text-sm font-semibold text-navy-900">
                    {p.full_name ?? "Attendee"}
                  </h3>
                  {p.role ? (
                    <span
                      className={cn(
                        "inline-flex shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                        p.role === "vc"
                          ? "bg-gold-50 text-gold-700"
                          : p.role === "speaker"
                          ? "bg-navy-800 text-white"
                          : "bg-navy-50 text-navy-700"
                      )}
                    >
                      {ROLES.find((r) => r.value === p.role)?.label ?? p.role}
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-xs text-navy-500">
                  {[p.designation, p.company].filter(Boolean).join(" · ")}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {p.iit_campus ? (
                    <span className="rounded-full bg-navy-50 px-1.5 py-0.5 text-[10px] font-medium text-navy-700">
                      {p.iit_campus.replace("IIT ", "")} {p.graduation_year ?? ""}
                    </span>
                  ) : null}
                  {(p.interests ?? []).slice(0, 2).map((i) => (
                    <span
                      key={i}
                      className="rounded-full bg-gold-50 px-1.5 py-0.5 text-[10px] font-medium text-gold-700"
                    >
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length > visible ? (
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => setVisible((v) => v + PAGE)}>
            Load more
          </Button>
        </div>
      ) : null}
    </>
  );
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onToggle(o.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                on
                  ? "border-navy-800 bg-navy-800 text-white"
                  : "border-navy-200 bg-white text-navy-700 hover:border-navy-400"
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
