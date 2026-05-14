import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Linkedin, MessageSquare, Twitter } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScheduleMeetingButton } from "@/components/features/schedule-meeting-button";
import { ROLES } from "@/lib/constants";
import { initials } from "@/lib/utils";
import { rangeIST, dayIST } from "@/lib/date";

export const dynamic = "force-dynamic";

interface ProfileRow {
  id: string;
  full_name: string | null;
  role: string | null;
  company: string | null;
  designation: string | null;
  bio: string | null;
  iit_campus: string | null;
  graduation_year: number | null;
  branch: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  interests: string[] | null;
  asks: string | null;
  offers: string | null;
  avatar_url: string | null;
  office_hours_enabled: boolean | null;
}

interface SpeakingSession {
  session: {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string;
    venues: { name: string } | null;
  } | null;
}

export default async function AttendeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let profile: ProfileRow | null = null;
  let speakingAt: SpeakingSession[] = [];
  let envOk = true;
  let currentUserId: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    currentUserId = user?.id ?? null;

    const { data } = await supabase
      .from("profiles")
      .select(
        "id, full_name, role, company, designation, bio, iit_campus, graduation_year, branch, linkedin_url, twitter_url, interests, asks, offers, avatar_url, office_hours_enabled"
      )
      .eq("id", id)
      .maybeSingle();
    profile = data as ProfileRow | null;

    const { data: sp } = await supabase
      .from("session_speakers")
      .select("session:sessions(id, title, starts_at, ends_at, venues(name))")
      .eq("speaker_id", id);
    speakingAt = (sp as unknown as SpeakingSession[]) ?? [];
  } catch {
    envOk = false;
  }

  if (!profile && envOk) notFound();

  if (!profile) {
    return (
      <div className="px-4 pt-4">
        <BackLink />
        <div className="mt-6 rounded-xl border border-dashed border-navy-200 bg-white p-6 text-center text-sm text-navy-500">
          Profile will appear once Supabase is configured.
        </div>
      </div>
    );
  }

  const asksChips = (profile.asks ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const offersChips = (profile.offers ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const isMe = currentUserId === profile.id;

  return (
    <div className="pb-10">
      <div className="bg-paniit-gradient px-4 pb-6 pt-4 text-white">
        <BackLink className="text-white/80 hover:text-white" />
        <div className="mt-4 flex items-start gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-white/30">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? ""} />
            ) : null}
            <AvatarFallback className="bg-white/15 text-white">
              {initials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-xl font-bold text-balance text-white">
              {profile.full_name ?? "Attendee"}
            </h1>
            <p className="text-sm text-white/85">
              {[profile.designation, profile.company].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {profile.role ? (
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white">
                  {ROLES.find((r) => r.value === profile.role)?.label ?? profile.role}
                </span>
              ) : null}
              {profile.iit_campus ? (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/90">
                  {profile.iit_campus}
                  {profile.graduation_year ? ` · ${profile.graduation_year}` : ""}
                </span>
              ) : null}
              {profile.office_hours_enabled ? (
                <span className="rounded-full bg-gold-400/30 px-2 py-0.5 text-[11px] font-semibold text-gold-100">
                  Office hours
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {!isMe ? (
        <div className="-mt-3 mx-4 flex gap-2 rounded-xl border border-navy-100 bg-white p-3 shadow-sm">
          <ScheduleMeetingButton inviteeId={profile.id} className="flex-1" />
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/meetings`}>
              <MessageSquare className="h-4 w-4" />
              Message
            </Link>
          </Button>
        </div>
      ) : null}

      {profile.bio ? (
        <section className="mt-6 px-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
            About
          </h2>
          <p className="font-serif text-[15px] leading-relaxed text-navy-800">{profile.bio}</p>
        </section>
      ) : null}

      {(asksChips.length > 0 || offersChips.length > 0) && (
        <section className="mt-6 grid grid-cols-1 gap-4 px-4 sm:grid-cols-2">
          {asksChips.length > 0 ? (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
                Looking for
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {asksChips.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-gold-200 bg-gold-50 px-2.5 py-0.5 text-xs font-medium text-gold-700"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {offersChips.length > 0 ? (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
                Can offer
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {offersChips.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-navy-200 bg-white px-2.5 py-0.5 text-xs font-medium text-navy-700"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      )}

      {profile.interests?.length ? (
        <section className="mt-6 px-4">
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
            Interests
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {profile.interests.map((i) => (
              <span
                key={i}
                className="rounded-full bg-navy-50 px-2.5 py-0.5 text-xs text-navy-700"
              >
                {i}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {(profile.linkedin_url || profile.twitter_url) && (
        <section className="mt-6 px-4">
          <div className="flex gap-2">
            {profile.linkedin_url ? (
              <Button variant="outline" asChild className="flex-1">
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              </Button>
            ) : null}
            {profile.twitter_url ? (
              <Button variant="outline" asChild className="flex-1">
                <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-4 w-4" />
                  Twitter
                </a>
              </Button>
            ) : null}
          </div>
        </section>
      )}

      {speakingAt.length > 0 ? (
        <>
          <Separator className="my-6" />
          <section className="px-4">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
              Speaking at
            </h2>
            <ul className="space-y-2">
              {speakingAt
                .filter((s) => s.session)
                .map(({ session: s }) =>
                  s ? (
                    <li key={s.id}>
                      <Link
                        href={`/agenda/${s.id}`}
                        className="block rounded-xl border border-navy-100 bg-white p-3 transition hover:border-navy-300 hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between text-xs text-navy-500">
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Calendar className="h-3 w-3" />
                            {dayIST(s.starts_at)} · {rangeIST(s.starts_at, s.ends_at)}
                          </span>
                          {s.venues?.name ? <span>{s.venues.name}</span> : null}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-navy-900">{s.title}</div>
                      </Link>
                    </li>
                  ) : null
                )}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}

function BackLink({ className }: { className?: string }) {
  return (
    <Link
      href="/attendees"
      className={`inline-flex items-center gap-1 text-sm text-navy-500 hover:text-navy-900 ${className ?? ""}`}
    >
      <ArrowLeft className="h-4 w-4" />
      Network
    </Link>
  );
}

