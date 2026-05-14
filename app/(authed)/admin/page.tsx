import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, MessagesSquare, Megaphone, ShieldAlert, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { rethrowIfRedirect } from "@/lib/redirect";
import { AnnouncementComposer } from "./announcement-composer";

export const dynamic = "force-dynamic";

interface Stat {
  label: string;
  value: number | string;
  hint?: string;
}

export default async function AdminPage() {
  let role: string | null = null;
  let envOk = true;
  let stats: Stat[] = [];
  let topSessions: Array<{ id: string; title: string; current_checkins: number | null }> = [];
  let topQuestions: Array<{
    id: string;
    body: string;
    upvotes: number | null;
    session: { title: string } | null;
  }> = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const { data: meRow } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = meRow?.role ?? null;
    if (role !== "organizer" && role !== "admin") {
      return (
        <div className="px-4 pb-10 pt-10 text-center">
          <ShieldAlert className="mx-auto h-6 w-6 text-navy-400" />
          <h1 className="mt-2 font-serif text-xl font-bold text-navy-900">Admins only</h1>
          <p className="mt-1 text-sm text-navy-500">
            This dashboard is restricted to event organizers.
          </p>
          <Link href="/agenda" className="mt-4 inline-block text-sm font-medium text-navy-700">
            Back to agenda →
          </Link>
        </div>
      );
    }

    const [
      profilesCount,
      checkinsCount,
      meetingsCount,
      meetingsAcceptedCount,
      sessionsTop,
      questionsTop,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("onboarded", true),
      supabase.from("session_checkins").select("session_id", { count: "exact", head: true }),
      supabase.from("meetings").select("id", { count: "exact", head: true }),
      supabase
        .from("meetings")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted"),
      supabase
        .from("sessions")
        .select("id, title, current_checkins")
        .order("current_checkins", { ascending: false })
        .limit(5),
      supabase
        .from("session_questions")
        .select("id, body, upvotes, session:sessions(title)")
        .or("status.eq.open,status.is.null")
        .order("upvotes", { ascending: false })
        .limit(5),
    ]);

    stats = [
      { label: "Registered", value: profilesCount.count ?? 0 },
      { label: "Check-ins", value: checkinsCount.count ?? 0 },
      { label: "Meetings", value: meetingsCount.count ?? 0 },
      { label: "Accepted", value: meetingsAcceptedCount.count ?? 0 },
    ];
    topSessions =
      (sessionsTop.data as Array<{ id: string; title: string; current_checkins: number | null }>) ??
      [];
    topQuestions =
      ((questionsTop.data as unknown) as Array<{
        id: string;
        body: string;
        upvotes: number | null;
        session: { title: string } | null;
      }>) ?? [];
  } catch (err) {
    rethrowIfRedirect(err);
    envOk = false;
  }

  return (
    <div className="px-4 pb-10 pt-4">
      <header className="mb-4">
        <h1 className="font-serif text-2xl font-bold text-navy-900">Admin</h1>
        <p className="text-sm text-navy-500">Event control — live stats, broadcasts, moderation.</p>
      </header>

      {!envOk ? (
        <p className="text-sm text-navy-500">Supabase not configured yet.</p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-navy-100 bg-white p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-500">
                  {s.label}
                </div>
                <div className="mt-1 font-serif text-2xl font-bold tabular-nums text-navy-900">
                  {s.value}
                </div>
              </div>
            ))}
          </section>

          <section className="mt-6">
            <h2 className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
              <Megaphone className="h-3.5 w-3.5" />
              Broadcast an announcement
            </h2>
            <AnnouncementComposer />
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-navy-100 bg-white p-4">
              <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
                <Users className="h-3.5 w-3.5" />
                Top sessions by check-in
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {topSessions.length === 0 ? (
                  <li className="text-navy-400">No check-ins yet.</li>
                ) : (
                  topSessions.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-2 border-b border-navy-50 pb-1.5 last:border-0"
                    >
                      <span className="truncate text-navy-900">{s.title}</span>
                      <span className="tabular-nums text-navy-500">{s.current_checkins ?? 0}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="rounded-xl border border-navy-100 bg-white p-4">
              <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
                <MessagesSquare className="h-3.5 w-3.5" />
                Hot unanswered questions
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {topQuestions.length === 0 ? (
                  <li className="text-navy-400">No open questions.</li>
                ) : (
                  topQuestions.map((q) => (
                    <li
                      key={q.id}
                      className="border-b border-navy-50 pb-1.5 last:border-0"
                    >
                      <p className="text-navy-900">{q.body}</p>
                      <p className="text-xs text-navy-500">
                        {q.session?.title} · {q.upvotes ?? 0} upvotes
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-navy-100 bg-white p-4">
            <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
              <CalendarClock className="h-3.5 w-3.5" />
              Quick links
            </h3>
            <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
              <li>
                <Link href="/agenda" className="font-medium text-navy-700 hover:text-navy-900">
                  Manage agenda →
                </Link>
              </li>
              <li>
                <Link href="/attendees/office-hours" className="font-medium text-navy-700 hover:text-navy-900">
                  Office hours roster →
                </Link>
              </li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
