import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Linkedin, MessageCircle, Twitter } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SessionCard, type SessionCardData } from "@/components/features/session-card";
import { ScheduleMeetingButton } from "@/components/features/schedule-meeting-button";
import { initials } from "@/lib/utils";

interface ProfileRow {
  id: string;
  full_name: string | null;
  designation: string | null;
  company: string | null;
  role: string | null;
  bio: string | null;
  iit_campus: string | null;
  graduation_year: number | null;
  branch: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  interests: string[] | null;
  asks: string[] | null;
  offers: string[] | null;
  photo_url: string | null;
}

export const dynamic = "force-dynamic";

export default async function AttendeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let profile: ProfileRow | null = null;
  let speakingAt: SessionCardData[] = [];
  let bookmarkSet = new Set<string>();

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("profiles")
      .select(
        "id, full_name, designation, company, role, bio, iit_campus, graduation_year, branch, linkedin_url, twitter_url, interests, asks, offers, photo_url"
      )
      .eq("id", id)
      .maybeSingle();
    profile = (data as ProfileRow | null) ?? null;
    if (!profile) notFound();

    const { data: sp } = await supabase
      .from("session_speakers")
      .select(
        "sessions(id, title, description, track, start_at, end_at, is_featured, capacity, current_checkins, venues(name))"
      )
      .eq("speaker_id", id);

    const rows = (sp as unknown as { sessions: SessionCardData | null }[] | null) ?? [];
    speakingAt = rows.map((r) => r.sessions).filter((s): s is SessionCardData => !!s);

    if (user && speakingAt.length > 0) {
      const ids = speakingAt.map((s) => s.id);
      const { data: bms } = await supabase
        .from("session_bookmarks")
        .select("session_id")
        .eq("user_id", user.id)
        .in("session_id", ids);
      bookmarkSet = new Set(
        ((bms as { session_id: string }[] | null) ?? []).map((b) => b.session_id)
      );
    }
  } catch {
    notFound();
  }

  if (!profile) notFound();

  const yearLine =
    profile.iit_campus || profile.graduation_year
      ? [profile.iit_campus, profile.graduation_year, profile.branch]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <div className="pb-10">
      <div className="px-4 pt-4">
        <Link
          href="/attendees"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Network
        </Link>
      </div>

      <div className="relative mt-3">
        <div className="h-32 w-full bg-brand-800" aria-hidden />
        <div className="-mt-12 px-4">
          <Avatar className="h-24 w-24 ring-4 ring-white">
            {profile.photo_url ? (
              <AvatarImage src={profile.photo_url} alt={profile.full_name ?? ""} />
            ) : null}
            <AvatarFallback className="bg-brand-50 text-2xl text-brand-800">
              {initials(profile.full_name ?? "?")}
            </AvatarFallback>
          </Avatar>
          <div className="mt-3">
            <h1 className="text-2xl font-semibold tracking-tight text-brand-900">
              {profile.full_name ?? "Attendee"}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
              {profile.designation || profile.company ? (
                <span>{[profile.designation, profile.company].filter(Boolean).join(" · ")}</span>
              ) : null}
              {profile.role ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
                  {profile.role}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 px-4">
        <ScheduleMeetingButton inviteeId={profile.id} />
        <Button variant="outline" className="gap-1.5" disabled>
          <MessageCircle className="h-4 w-4" />
          Message
        </Button>
      </div>

      {profile.bio ? (
        <section className="mt-6 px-4">
          <p className="text-sm leading-7 text-slate-700 whitespace-pre-line">{profile.bio}</p>
        </section>
      ) : null}

      {yearLine ? (
        <section className="mt-6 px-4">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Education
          </h2>
          <p className="mt-2 text-sm text-slate-700">{yearLine}</p>
        </section>
      ) : null}

      {profile.asks?.length ? (
        <Section title="Looking for">
          <ChipList items={profile.asks} />
        </Section>
      ) : null}

      {profile.offers?.length ? (
        <Section title="Can offer">
          <ChipList items={profile.offers} />
        </Section>
      ) : null}

      {profile.interests?.length ? (
        <Section title="Interests">
          <div className="flex flex-wrap gap-1.5">
            {profile.interests.map((i) => (
              <span
                key={i}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
              >
                {i}
              </span>
            ))}
          </div>
        </Section>
      ) : null}

      {profile.linkedin_url || profile.twitter_url ? (
        <section className="mt-6 flex flex-wrap items-center gap-2 px-4">
          {profile.linkedin_url ? (
            <a
              href={profile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
          ) : null}
          {profile.twitter_url ? (
            <a
              href={profile.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Twitter className="h-4 w-4" />
              Twitter / X
            </a>
          ) : null}
        </section>
      ) : null}

      {speakingAt.length > 0 ? (
        <section className="mt-8 px-4">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Speaking at
          </h2>
          <ul className="mt-3 space-y-3">
            {speakingAt.map((s) => (
              <li key={s.id}>
                <SessionCard session={s} bookmarked={bookmarkSet.has(s.id)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 px-4">
      <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
          {i}
        </span>
      ))}
    </div>
  );
}
