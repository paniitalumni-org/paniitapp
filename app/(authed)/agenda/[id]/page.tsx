import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Linkedin, Mail, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { rethrowIfRedirect } from "@/lib/redirect";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookmarkButton } from "@/components/features/bookmark-button";
import { QaSection } from "@/components/features/qa/qa-section";
import { CheckInButton } from "./check-in-button";
import { TRACK_LABELS, TRACK_TO_INTERESTS } from "@/lib/constants";
import { rangeIST } from "@/lib/date";
import { initials } from "@/lib/utils";
import { trackColor } from "@/components/features/session-card";

type VenueShape = { name: string | null; floor: string | number | null };
interface SessionRow {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  start_at: string;
  end_at: string;
  is_featured: boolean | null;
  capacity: number | null;
  current_checkins: number | null;
  venues: VenueShape | VenueShape[] | null;
  interests: string[] | null;
}

function venueOf(v: VenueShape | VenueShape[] | null): VenueShape | null {
  if (!v) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

function venueFloorLabel(floor: VenueShape["floor"]): string | null {
  if (floor == null) return null;
  if (typeof floor === "number") return `Floor ${floor}`;
  return floor.trim() || null;
}

interface SpeakerProfile {
  id: string;
  full_name: string | null;
  designation: string | null;
  company: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  email: string | null;
}

interface SpeakerRow {
  speaker_id: string;
  role: "speaker" | "moderator" | "panelist" | "host" | null;
  // Supabase joins can come back as either object or array depending on the
  // relation kind it infers. Accept both so render-time code never crashes.
  profiles: SpeakerProfile | SpeakerProfile[] | null;
}

function speakerOf(row: SpeakerRow): SpeakerProfile | null {
  if (!row.profiles) return null;
  if (Array.isArray(row.profiles)) return row.profiles[0] ?? null;
  return row.profiles;
}

function speakerRoleLabel(role: SpeakerRow["role"]): string {
  if (role === "moderator") return "Moderator";
  if (role === "panelist") return "Panelist";
  if (role === "host") return "Host";
  return "Speaker";
}

export const dynamic = "force-dynamic";

function XGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.844l-5.357-7.014L4.34 22H1.082l8.063-9.214L1.5 2h7l4.84 6.404L18.244 2z" />
    </svg>
  );
}

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
  let userInterests: string[] = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // `interests` may not exist until migration 0007 is applied — degrade gracefully.
    const withInterests = await supabase
      .from("sessions")
      .select(
        "id, title, description, track, start_at, end_at, is_featured, capacity, current_checkins, venues(name, floor), interests"
      )
      .eq("id", id)
      .maybeSingle();
    let raw: unknown = withInterests.data;
    if (withInterests.error) {
      const fallback = await supabase
        .from("sessions")
        .select(
          "id, title, description, track, start_at, end_at, is_featured, capacity, current_checkins, venues(name, floor)"
        )
        .eq("id", id)
        .maybeSingle();
      raw = fallback.data;
    }
    session = (raw as SessionRow | null) ?? null;
    if (!session) notFound();

    // Speakers join — request the full profile shape, but if any of those
    // columns (email/social) isn't yet in the deployed schema, retry with the
    // safe subset so featured sessions (which actually have speakers) don't
    // crash when 0005 / 0006 haven't run.
    const spFull = await supabase
      .from("session_speakers")
      .select(
        "speaker_id, role, profiles:speaker_id(id, full_name, designation, company, photo_url, linkedin_url, twitter_url, email)"
      )
      .eq("session_id", id);
    if (spFull.error) {
      // eslint-disable-next-line no-console
      console.error(
        "[agenda detail] speakers full select failed for session",
        id,
        spFull.error
      );
      const spLite = await supabase
        .from("session_speakers")
        .select(
          "speaker_id, role, profiles:speaker_id(id, full_name, designation, company, photo_url)"
        )
        .eq("session_id", id);
      if (spLite.error) {
        // eslint-disable-next-line no-console
        console.error(
          "[agenda detail] speakers lite select failed for session",
          id,
          spLite.error
        );
      }
      speakers = (spLite.data as unknown as SpeakerRow[] | null) ?? [];
    } else {
      speakers = (spFull.data as unknown as SpeakerRow[] | null) ?? [];
    }

    if (user) {
      const [bm, ci, prof] = await Promise.all([
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
        supabase
          .from("profiles")
          .select("interests")
          .eq("id", user.id)
          .maybeSingle(),
      ]);
      bookmarked = !!bm.data;
      checkedIn = !!ci.data;
      userInterests =
        ((prof.data as { interests: string[] | null } | null)?.interests) ?? [];
    }
  } catch (err) {
    // Re-throw Next's internal signals (NOT_FOUND/REDIRECT). Otherwise we
    // would turn an intentional notFound() into a generic server error, and
    // a transient supabase fetch failure would never surface to the user.
    rethrowIfRedirect(err);
    // eslint-disable-next-line no-console
    console.error("[agenda detail] data fetch failed for session", id, err);
    notFound();
  }

  if (!session) notFound();

  const track = session.track ?? "general";
  const sessionInterests =
    session.interests && session.interests.length > 0
      ? session.interests
      : (TRACK_TO_INTERESTS[track] ?? []);
  const matches = userInterests.length
    ? sessionInterests.filter((i) => userInterests.includes(i))
    : [];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 pb-10 lg:max-w-4xl">
      <header className="rounded-lg border border-brand-100 bg-white p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-brand-100 bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-800">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: trackColor(track) }}
              aria-hidden
            />
            {TRACK_LABELS[track] ?? track}
          </span>
          {session.is_featured ? (
            <span className="rounded-[4px] border border-iit-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-iit-600">
              Featured
            </span>
          ) : null}
          {matches.length > 0 ? (
            <span className="rounded-[4px] border border-emerald-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              Recommended
            </span>
          ) : null}
        </div>
        <h1 className="mt-2 text-[22px] font-semibold leading-tight tracking-tight text-brand-950">
          {session.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-brand-900/85">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-brand-800/65" strokeWidth={1.7} />
            <span className="tabular-nums">
              {rangeIST(session.start_at, session.end_at)}
            </span>
          </span>
          {(() => {
            const v = venueOf(session.venues);
            if (!v?.name) return null;
            const floor = venueFloorLabel(v.floor);
            return (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-800/65" strokeWidth={1.7} />
                {v.name}
                {floor ? (
                  <span className="text-[11px] text-brand-800/55">
                    {" - "}
                    {floor}
                  </span>
                ) : null}
              </span>
            );
          })()}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <BookmarkButton sessionId={session.id} initial={bookmarked} withLabel size="md" />
          <CheckInButton
            sessionId={session.id}
            startsAtIso={session.start_at}
            endsAtIso={session.end_at}
            initialCheckedIn={checkedIn}
          />
        </div>

        {sessionInterests.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {sessionInterests.map((i) => {
              const matched = userInterests.includes(i);
              return (
                <span
                  key={i}
                  className={
                    matched
                      ? "rounded-[3px] bg-brand-800 px-2 py-0.5 text-[10px] font-semibold text-white"
                      : "rounded-[3px] border border-brand-100 bg-white px-2 py-0.5 text-[10px] font-semibold text-brand-800"
                  }
                >
                  {i}
                </span>
              );
            })}
          </div>
        ) : null}
      </header>

      {session.description ? (
        <section className="rounded-lg border border-brand-100 bg-white p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-800/75">
            About this session
          </h2>
          <p className="mt-2 whitespace-pre-line text-[14px] leading-7 text-brand-900">
            {session.description}
          </p>
        </section>
      ) : null}

      {speakers.length > 0 ? (
        <section className="rounded-lg border border-brand-100 bg-white p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-800/75">
            Speakers
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {speakers
              .map((s) => ({ id: s.speaker_id, role: s.role, p: speakerOf(s) }))
              .filter(
                (s): s is {
                  id: string;
                  role: SpeakerRow["role"];
                  p: SpeakerProfile;
                } => !!s.p && !!s.p.id
              )
              .map((s) => (
                <SpeakerCard key={s.id} p={s.p} role={s.role} />
              ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-lg border border-brand-100 bg-white p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-800/75">
          Q&amp;A discussion
        </h2>
        <QaSection sessionId={session.id} />
      </section>
    </div>
  );
}

function SpeakerCard({
  p,
  role,
}: {
  p: SpeakerProfile;
  role: SpeakerRow["role"];
}) {
  return (
    <li className="relative rounded-lg border border-brand-100 bg-white p-3 transition-colors hover:bg-brand-50/30">
      <span className="absolute right-3 top-3 rounded-[3px] border border-brand-100 bg-brand-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand-800">
        {speakerRoleLabel(role)}
      </span>
      <Link href={`/attendees/${p.id}`} className="flex items-start gap-3">
        <Avatar className="size-12 shrink-0 ring-1 ring-brand-100">
          {p.photo_url ? (
            <AvatarImage src={p.photo_url} alt={p.full_name ?? ""} />
          ) : null}
          <AvatarFallback className="bg-brand-50 text-[13px] font-semibold text-brand-800">
            {initials(p.full_name ?? "?")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 pr-12">
          <div className="truncate text-[14px] font-semibold text-brand-950">
            {p.full_name ?? "Speaker"}
          </div>
          {p.designation || p.company ? (
            <div className="mt-0.5 truncate text-[12px] text-brand-900/75">
              {[p.designation, p.company].filter(Boolean).join(" · ")}
            </div>
          ) : null}
        </div>
      </Link>
      {p.linkedin_url || p.twitter_url || p.email ? (
        <div className="mt-3 flex items-center gap-3 border-t border-brand-100 pt-2.5 pl-[60px]">
          {p.linkedin_url ? (
            <a
              href={p.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-brand-950/85 transition-colors hover:text-brand-950"
            >
              <Linkedin className="size-[15px]" strokeWidth={1.6} />
            </a>
          ) : null}
          {p.twitter_url ? (
            <a
              href={p.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="text-brand-950/85 transition-colors hover:text-brand-950"
            >
              <XGlyph className="size-[13px]" />
            </a>
          ) : null}
          {p.email ? (
            <a
              href={`mailto:${p.email}`}
              aria-label="Email"
              className="text-brand-950/85 transition-colors hover:text-brand-950"
            >
              <Mail className="size-[15px]" strokeWidth={1.6} />
            </a>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
