import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarCheck, Download, MessagesSquare, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { rethrowIfRedirect } from "@/lib/redirect";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { rangeIST } from "@/lib/date";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ProfileLite {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  company: string | null;
}

interface SessionLite {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
}

export default async function RecapPage() {
  let envOk = true;
  let userId: string | null = null;
  let connections: ProfileLite[] = [];
  let meetings: number = 0;
  let attended: SessionLite[] = [];
  let asked: Array<{ id: string; body: string; upvotes: number | null; status: string | null }> = [];
  let answered: Array<{ id: string; body: string; question_id: string }> = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    userId = user.id;

    const { data: cons } = await supabase
      .from("connections")
      .select("user_a, user_b")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);
    const otherIds = (cons ?? []).map((c: { user_a: string; user_b: string }) =>
      c.user_a === userId ? c.user_b : c.user_a
    );
    if (otherIds.length > 0) {
      const { data: ppl } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, company")
        .in("id", otherIds);
      connections = (ppl as ProfileLite[] | null) ?? [];
    }

    const { count: mc } = await supabase
      .from("meetings")
      .select("id", { count: "exact", head: true })
      .or(`requester_id.eq.${userId},invitee_id.eq.${userId}`)
      .eq("status", "accepted");
    meetings = mc ?? 0;

    const { data: ats } = await supabase
      .from("session_checkins")
      .select("session:sessions(id, title, starts_at, ends_at)")
      .eq("user_id", userId);
    attended = (
      (ats as unknown as Array<{ session: SessionLite | null }> | null) ?? []
    )
      .map((r) => r.session)
      .filter((s): s is SessionLite => !!s)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

    const { data: qs } = await supabase
      .from("session_questions")
      .select("id, body, upvotes, status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    asked = qs ?? [];

    const { data: rs } = await supabase
      .from("question_replies")
      .select("id, body, question_id")
      .eq("user_id", userId);
    answered = rs ?? [];
  } catch (err) {
    rethrowIfRedirect(err);
    envOk = false;
  }

  if (!envOk || !userId) {
    return (
      <div className="px-4 pt-4">
        <p className="text-sm text-navy-500">Recap appears after May 16 once data is available.</p>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="bg-paniit-gradient px-4 pb-6 pt-4 text-white">
        <Link
          href="/me"
          className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Me
        </Link>
        <h1 className="mt-3 font-serif text-2xl font-bold">Your summit recap</h1>
        <p className="text-sm text-white/80">May 16, 2026 · Taj Yeshwantpur</p>
      </div>

      <section className="-mt-3 mx-4 grid grid-cols-3 gap-2 rounded-xl border border-navy-100 bg-white p-3 shadow-sm">
        <Stat icon={Users} label="People met" value={connections.length} />
        <Stat icon={CalendarCheck} label="Meetings" value={meetings} />
        <Stat icon={MessagesSquare} label="Questions" value={asked.length + answered.length} />
      </section>

      {connections.length > 0 ? (
        <section className="mt-6 px-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
              People you met
            </h2>
            <a
              href="/recap/export?format=vcf"
              className="inline-flex items-center gap-1 text-xs font-medium text-navy-700 hover:text-navy-900"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </a>
          </div>
          <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {connections.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/attendees/${p.id}`}
                  className="block rounded-lg border border-navy-100 bg-white p-2 text-center transition hover:border-navy-300"
                >
                  <Avatar className="mx-auto h-12 w-12">
                    {p.avatar_url ? <AvatarImage src={p.avatar_url} alt={p.full_name ?? ""} /> : null}
                    <AvatarFallback>{initials(p.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="mt-1 truncate text-[11px] font-medium text-navy-900">
                    {p.full_name ?? "Attendee"}
                  </div>
                  <div className="truncate text-[10px] text-navy-500">{p.company ?? ""}</div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button asChild variant="outline">
              <a href="/recap/export?format=vcf">
                <Download className="h-4 w-4" />
                .vcf
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/recap/export?format=csv">
                <Download className="h-4 w-4" />
                .csv
              </a>
            </Button>
          </div>
        </section>
      ) : null}

      {attended.length > 0 ? (
        <section className="mt-6 px-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
            Sessions attended
          </h2>
          <ul className="space-y-2">
            {attended.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/agenda/${s.id}`}
                  className="block rounded-lg border border-navy-100 bg-white p-3 transition hover:border-navy-300"
                >
                  <div className="text-xs tabular-nums text-navy-500">
                    {rangeIST(s.starts_at, s.ends_at)}
                  </div>
                  <div className="text-sm font-semibold text-navy-900">{s.title}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {asked.length > 0 ? (
        <section className="mt-6 px-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
            Questions you asked
          </h2>
          <ul className="space-y-2">
            {asked.map((q) => (
              <li
                key={q.id}
                className="rounded-lg border border-navy-100 bg-white p-3 text-sm text-navy-900"
              >
                {q.body}
                <div className="mt-1 text-xs text-navy-500">
                  {q.upvotes ?? 0} upvotes · {q.status === "answered" ? "Answered" : "Open"}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-navy-50 text-navy-700">
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-1 font-serif text-xl font-bold tabular-nums text-navy-900">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-navy-500">{label}</div>
    </div>
  );
}
