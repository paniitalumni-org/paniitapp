import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookmarkButton } from "@/components/features/bookmark-button";
import { QaSection } from "@/components/features/qa/qa-section";
import { CheckInButton } from "./check-in-button";
import { TRACK_LABELS } from "@/lib/constants";
import { rangeIST } from "@/lib/date";
import { initials } from "@/lib/utils";
import { trackColor } from "@/components/features/session-card";

interface SessionRow {
  id: string;
  title: string;
  description: string | null;
  track: string;
  start_at: string;
  end_at: string;
  is_featured: boolean | null;
  capacity: number | null;
  current_checkins: number | null;
  venues: { name: string | null; floor: number | null } | null;
}

interface SpeakerRow {
  speaker_id: string;
  profiles: {
    id: string;
    full_name: string | null;
    designation: string | null;
    company: string | null;
    photo_url: string | null;
  } | null;
}

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let session: SessionRow | null = null;
  let speakers: SpeakerRow[] = [];
  let bookmarked = false;
  let checkedIn = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("sessions")
      .select(
        "id, title, description, track, start_at, end_at, is_featured, capacity, current_checkins, venues(name, floor)"
      )
      .eq("id", id)
      .maybeSingle();
    session = (data as unknown as SessionRow | null) ?? null;
    if (!session) notFound();

    const { data: sp } = await supabase
      .from("session_speakers")
      .select(
        "speaker_id, profiles:speaker_id(id, full_name, designation, company, photo_url)"
      )
      .eq("session_id", id);
    speakers = (sp as unknown as SpeakerRow[] | null) ?? [];

    if (user) {
      const [bm, ci] = await Promise.all([
        supabase
          .from("session_bookmarks")
          .select("session_id")
          .eq("user_id", user.id)
          .eq("session_id", id)
          .maybeSingle(),
        supabase
          .from("session_checkins")
          .select("session_id")
          .eq("user_id", user.id)
          .eq("session_id", id)
          .maybeSingle(),
      ]);
      bookmarked = !!bm.data;
      checkedIn = !!ci.data;
    }
  } catch {
    notFound();
  }

  if (!session) notFound();

  return (
    <div className="pb-10">
      <div className="px-4 pt-4">
        <Link
          href="/agenda"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Agenda
        </Link>
      </div>

      <header className="px-4 pt-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: trackColor(session.track) }}
            aria-hidden
          />
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            {TRACK_LABELS[session.track] ?? session.track}
          </span>
          {session.is_featured ? (
            <span className="ml-1 text-[10px] font-medium uppercase tracking-wider text-iit-500">
              Featured
            </span>
          ) : null}
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-900">
          {session.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span className="tabular-nums">{rangeIST(session.start_at, session.end_at)}</span>
          </span>
          {session.venues?.name ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {session.venues.name}
              {session.venues.floor != null ? (
                <span className="text-xs text-slate-400">
                  · Floor {session.venues.floor}
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-3 px-4">
        <BookmarkButton sessionId={session.id} initial={bookmarked} withLabel size="md" />
        <CheckInButton
          sessionId={session.id}
          startsAtIso={session.start_at}
          endsAtIso={session.end_at}
          initialCheckedIn={checkedIn}
        />
      </div>

      {session.description ? (
        <section className="mt-6 px-4">
          <p className="text-sm leading-7 text-slate-700 whitespace-pre-line">
            {session.description}
          </p>
        </section>
      ) : null}

      {speakers.length > 0 ? (
        <section className="mt-8 px-4">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Speakers
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {speakers
              .filter((s) => s.profiles)
              .map((s) => {
                const p = s.profiles!;
                return (
                  <li key={p.id}>
                    <Link
                      href={`/attendees/${p.id}`}
                      className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-3 text-center transition-colors hover:border-slate-300"
                    >
                      <Avatar className="h-16 w-16">
                        {p.photo_url ? (
                          <AvatarImage src={p.photo_url} alt={p.full_name ?? ""} />
                        ) : null}
                        <AvatarFallback className="bg-brand-50 text-brand-800">
                          {initials(p.full_name ?? "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="mt-2 text-sm font-semibold leading-snug text-brand-900 line-clamp-2">
                        {p.full_name ?? "Speaker"}
                      </div>
                      {p.designation || p.company ? (
                        <div className="mt-0.5 text-[11px] leading-4 text-slate-500 line-clamp-2">
                          {[p.designation, p.company].filter(Boolean).join(" · ")}
                        </div>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="px-4">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Q&amp;A discussion
          </h2>
        </div>
        <QaSection sessionId={session.id} />
      </section>
    </div>
  );
}
