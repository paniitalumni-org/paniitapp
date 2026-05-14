import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { BookmarkButton } from "@/components/features/bookmark-button";
import { CheckInButton } from "./check-in-button";
import { QASection } from "@/components/features/qa/qa-section";
import { TRACK_COLOR_BG, TRACK_LABELS } from "@/lib/constants";
import { rangeIST, dayIST } from "@/lib/date";
import { cn, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface SessionRow {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  starts_at: string;
  ends_at: string;
  is_featured: boolean | null;
  capacity: number | null;
  current_checkins: number | null;
  venues: { name: string; floor: number | null } | null;
}

interface SpeakerLink {
  speaker: {
    id: string;
    full_name: string | null;
    designation: string | null;
    company: string | null;
    avatar_url: string | null;
  } | null;
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let session: SessionRow | null = null;
  let speakers: SpeakerLink[] = [];
  let bookmarked = false;
  let checkedIn = false;
  let userId: string | null = null;
  let envOk = true;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    const { data } = await supabase
      .from("sessions")
      .select(
        "id, title, description, track, starts_at, ends_at, is_featured, capacity, current_checkins, venues(name, floor)"
      )
      .eq("id", id)
      .maybeSingle();
    session = data as SessionRow | null;

    if (session) {
      const { data: sp } = await supabase
        .from("session_speakers")
        .select("speaker:profiles(id, full_name, designation, company, avatar_url)")
        .eq("session_id", id);
      speakers = (sp as unknown as SpeakerLink[]) ?? [];

      if (userId) {
        const { data: bm } = await supabase
          .from("session_bookmarks")
          .select("session_id")
          .eq("user_id", userId)
          .eq("session_id", id)
          .maybeSingle();
        bookmarked = !!bm;

        const { data: ci } = await supabase
          .from("session_checkins")
          .select("session_id")
          .eq("user_id", userId)
          .eq("session_id", id)
          .maybeSingle();
        checkedIn = !!ci;
      }
    }
  } catch {
    envOk = false;
  }

  if (!session && envOk) notFound();

  if (!session) {
    return (
      <div className="px-4 pt-4">
        <Link
          href="/agenda"
          className="inline-flex items-center gap-1 text-sm text-navy-500 hover:text-navy-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Agenda
        </Link>
        <div className="mt-6 rounded-xl border border-dashed border-navy-200 bg-white p-6 text-center text-sm text-navy-500">
          Session details will appear once Supabase is configured.
        </div>
      </div>
    );
  }

  const track = (session.track ?? "general") as keyof typeof TRACK_COLOR_BG;
  const stripe = TRACK_COLOR_BG[track] ?? TRACK_COLOR_BG.general;

  const now = Date.now();
  const startMs = new Date(session.starts_at).getTime();
  const endMs = new Date(session.ends_at).getTime();
  const checkInOpen = now >= startMs - 10 * 60 * 1000 && now <= endMs + 30 * 60 * 1000;

  return (
    <div className="pb-10">
      <div className="bg-paniit-gradient px-4 pb-6 pt-4 text-white">
        <Link
          href="/agenda"
          className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Agenda
        </Link>
        <div className="mt-4 flex items-center gap-2 text-xs text-white/80">
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              stripe.replace("bg-", "bg-")
            )}
            aria-hidden
          />
          <span className="font-medium uppercase tracking-[0.18em]">
            {TRACK_LABELS[track] ?? track}
          </span>
          {session.is_featured ? (
            <span className="ml-1 inline-flex items-center gap-0.5 rounded-full border border-gold-300/40 bg-gold-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-gold-200">
              <Sparkles className="h-2.5 w-2.5" />
              Featured
            </span>
          ) : null}
        </div>
        <h1 className="mt-2 font-serif text-2xl font-bold leading-tight text-balance text-white sm:text-3xl">
          {session.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span className="tabular-nums">
              {dayIST(session.starts_at)} · {rangeIST(session.starts_at, session.ends_at)}
            </span>
          </span>
          {session.venues?.name ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {session.venues.name}
              {session.venues.floor != null ? ` · Floor ${session.venues.floor}` : ""}
            </span>
          ) : null}
        </div>
      </div>

      <div className="-mt-3 mx-4 rounded-xl border border-navy-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <BookmarkButton
            sessionId={session.id}
            initial={bookmarked}
            variant="outline"
            showLabel
            className="flex-1"
          />
          <CheckInButton
            sessionId={session.id}
            checkedIn={checkedIn}
            disabled={!userId || !checkInOpen}
            disabledReason={
              !userId
                ? "Sign in"
                : !checkInOpen
                ? "Check-in opens 10 min before start"
                : undefined
            }
          />
        </div>
      </div>

      {session.description ? (
        <section className="mt-6 px-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
            About
          </h2>
          <p className="font-serif text-[15px] leading-relaxed text-navy-800">
            {session.description}
          </p>
        </section>
      ) : null}

      {speakers.length > 0 ? (
        <section className="mt-6 px-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
            Speakers
          </h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {speakers
              .filter((s) => s.speaker)
              .map(({ speaker: s }) =>
                s ? (
                  <li key={s.id}>
                    <Link
                      href={`/attendees/${s.id}`}
                      className="flex items-center gap-3 rounded-lg border border-navy-100 bg-white p-3 transition hover:border-navy-300 hover:shadow-sm"
                    >
                      <Avatar>
                        {s.avatar_url ? <AvatarImage src={s.avatar_url} alt={s.full_name ?? ""} /> : null}
                        <AvatarFallback>{initials(s.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-navy-900">
                          {s.full_name ?? "Speaker"}
                        </div>
                        <div className="truncate text-xs text-navy-500">
                          {[s.designation, s.company].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    </Link>
                  </li>
                ) : null
              )}
          </ul>
        </section>
      ) : null}

      <Separator className="my-6" />

      <section className="px-4">
        <h2 className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
          <span>Discussion</span>
        </h2>
        <QASection sessionId={session.id} userId={userId} />
      </section>
    </div>
  );
}
