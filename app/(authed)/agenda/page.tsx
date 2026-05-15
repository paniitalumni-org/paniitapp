import { CalendarOff } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  SessionCard,
  sessionInterestPool,
  type SessionCardData,
} from "@/components/features/session-card";
import {
  PageWithFilters,
  FiltersCard,
} from "@/components/features/page-with-filters";
import { AgendaFilters } from "./agenda-filters";
import { AgendaRealtime } from "@/components/features/agenda-realtime";
import { SUMMIT_TZ } from "@/lib/constants";
import Link from "next/link";

export const dynamic = "force-dynamic";

function hourKey(iso: string): string {
  return formatInTimeZone(new Date(iso), SUMMIT_TZ, "HH:00");
}

function hourLabel(key: string): string {
  const [h] = key.split(":");
  const hour = Number(h);
  const period = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:00 ${period}`;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams?: Promise<{ track?: string; mine?: string; recommended?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const track = sp.track ?? "all";
  const mineOnly = sp.mine === "1";
  const recommendedOnly = sp.recommended === "1";

  let sessions: SessionCardData[] = [];
  let bookmarkSet = new Set<string>();
  let userInterests: string[] = [];
  let errored = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const withInterests = await supabase
      .from("sessions")
      .select(
        "id, title, description, track, start_at, end_at, is_featured, capacity, current_checkins, venues(name), interests"
      )
      .order("start_at", { ascending: true });
    if (withInterests.error) {
      // sessions.interests may not exist if migration 0007 hasn't run yet.
      const fallback = await supabase
        .from("sessions")
        .select(
          "id, title, description, track, start_at, end_at, is_featured, capacity, current_checkins, venues(name)"
        )
        .order("start_at", { ascending: true });
      if (fallback.error) errored = true;
      sessions = (fallback.data as unknown as SessionCardData[] | null) ?? [];
    } else {
      sessions = (withInterests.data as unknown as SessionCardData[] | null) ?? [];
    }

    if (user) {
      const [bmRes, profRes] = await Promise.all([
        supabase
          .from("session_bookmarks")
          .select("session_id")
          .eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("interests")
          .eq("id", user.id)
          .maybeSingle(),
      ]);
      bookmarkSet = new Set(
        (bmRes.data as { session_id: string }[] | null)?.map((b) => b.session_id) ?? []
      );
      userInterests =
        ((profRes.data as { interests: string[] | null } | null)?.interests) ?? [];
    }
  } catch {
    errored = true;
  }

  const userInterestSet = new Set(userInterests);
  const isRecommended = (s: SessionCardData): boolean => {
    if (userInterestSet.size === 0) return false;
    const pool = sessionInterestPool(s);
    return pool.some((i) => userInterestSet.has(i));
  };

  const filtered = sessions.filter((s) => {
    if (track !== "all" && s.track !== track) return false;
    if (mineOnly && !bookmarkSet.has(s.id)) return false;
    if (recommendedOnly && !isRecommended(s)) return false;
    return true;
  });

  const matchCount = filtered.reduce((acc, s) => (isRecommended(s) ? acc + 1 : acc), 0);

  const grouped = filtered.reduce<Map<string, SessionCardData[]>>((acc, s) => {
    const k = hourKey(s.start_at);
    if (!acc.has(k)) acc.set(k, []);
    acc.get(k)!.push(s);
    return acc;
  }, new Map());
  const hourKeys = Array.from(grouped.keys()).sort();

  return (
    <PageWithFilters
      header={
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900 lg:text-3xl">
            Agenda
          </h1>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            May 16, 2026 · Taj Yeshwantpur, Bengaluru · all times IST
          </p>
        </div>
      }
      filters={
        <FiltersCard>
          <AgendaFilters />
        </FiltersCard>
      }
    >
      {userInterests.length === 0 ? (
        <div className="mb-4 rounded-lg border border-brand-100 bg-brand-50/40 p-3">
          <p className="text-[12px] leading-5 text-brand-900">
            Pick your areas of interest in{" "}
            <Link
              href="/me/edit"
              className="font-semibold text-brand-800 underline-offset-2 hover:underline"
            >
              your profile
            </Link>{" "}
            to highlight matching sessions and people across the summit.
          </p>
        </div>
      ) : matchCount > 0 ? (
        <div className="mb-4 rounded-lg border border-brand-100 bg-white p-3">
          <p className="text-[12px] leading-5 text-brand-900">
            <span className="font-semibold text-brand-950">{matchCount} session{matchCount === 1 ? "" : "s"}</span>{" "}
            line up with your interests. Look for the{" "}
            <span className="rounded-[3px] border border-emerald-300 bg-white px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              Recommended
            </span>{" "}
            tag below.
          </p>
        </div>
      ) : null}

      {hourKeys.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarOff />
            </EmptyMedia>
            <EmptyTitle>
              {recommendedOnly
                ? "Nothing recommended yet"
                : mineOnly
                ? "Nothing bookmarked yet"
                : errored
                ? "Can't load schedule"
                : "No sessions"}
            </EmptyTitle>
            <EmptyDescription>
              {recommendedOnly
                ? "Add more interests in your profile to surface matching sessions."
                : mineOnly
                ? "Bookmark sessions to build your personal agenda."
                : errored
                ? "We can't reach the schedule right now."
                : "Sessions will appear here once organizers publish them."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-6">
          {hourKeys.map((k) => (
            <section key={k} id={`h-${k.replace(":", "")}`}>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wider tabular-nums text-slate-500">
                {hourLabel(k)}
              </div>
              <ul className="flex flex-col gap-3">
                {grouped.get(k)!.map((s) => (
                  <li key={s.id}>
                    <SessionCard
                      session={s}
                      bookmarked={bookmarkSet.has(s.id)}
                      userInterests={userInterests}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <AgendaRealtime />
    </PageWithFilters>
  );
}
