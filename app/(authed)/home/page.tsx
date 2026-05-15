import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  MapPin,
  Mail,
  Compass,
  QrCode,
  ScanLine,
  BookOpenText,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
} from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { rethrowIfRedirect } from "@/lib/redirect";
import { SUMMIT_TZ } from "@/lib/constants";
import { HeroCarousel } from "./hero-carousel";
import { KeyParticipantsStrip } from "./key-participants-strip";
import { PartnersGroups } from "./partners-groups";

export const dynamic = "force-dynamic";

interface CalendarItem {
  kind: "meeting" | "session";
  start: string;
  end: string;
  title: string;
  href: string;
}

interface KeyParticipantRow {
  id: string;
  full_name: string;
  designation: string | null;
  company: string | null;
  photo_url: string | null;
}

interface PartnerTypeRow {
  id: string;
  name: string;
  description: string | null;
  partners: { id: string; name: string; logo_url: string | null; website: string | null }[];
}

const SUMMIT_VENUE = "Taj Yeshwantpur, Bengaluru";
const SUMMIT_DATE_LABEL = "16 May 2026 · 9:00 AM IST";
const SUMMIT_MAPS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=Taj+Yeshwantpur+Bengaluru";

const SOCIALS: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: "https://www.linkedin.com/company/paniit-alumni-india", label: "LinkedIn", icon: <Linkedin className="size-4" strokeWidth={1.8} /> },
  { href: "https://www.instagram.com/paniit_alumni_india/", label: "Instagram", icon: <Instagram className="size-4" strokeWidth={1.8} /> },
  { href: "https://x.com/paniit_india", label: "X (Twitter)", icon: <XGlyph className="size-[14px]" /> },
  { href: "https://www.youtube.com/@paniitalumniindia", label: "YouTube", icon: <Youtube className="size-4" strokeWidth={1.8} /> },
  { href: "https://www.facebook.com/paniitalumni/", label: "Facebook", icon: <Facebook className="size-4" strokeWidth={1.8} /> },
];

export default async function HomePage() {
  let calendar: CalendarItem[] = [];
  let participants: KeyParticipantRow[] = [];
  let partnerGroups: PartnerTypeRow[] = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // calendar: accepted meetings + bookmarked sessions
    const [meetingsRes, bookmarkRes, kpRes, ptRes] = await Promise.all([
      user
        ? supabase
            .from("meetings")
            .select(
              "id, requester_id, invitee_id, accepted_slot, status, requester:requester_id(id, full_name), invitee:invitee_id(id, full_name)"
            )
            .or(`requester_id.eq.${user.id},invitee_id.eq.${user.id}`)
            .eq("status", "accepted")
        : Promise.resolve({ data: [] as unknown[] }),
      user
        ? supabase
            .from("session_bookmarks")
            .select("sessions(id, title, start_at, end_at)")
            .eq("user_id", user.id)
        : Promise.resolve({ data: [] as unknown[] }),
      supabase
        .from("key_participants")
        .select("id, full_name, designation, company, photo_url")
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .limit(20),
      supabase
        .from("partner_types")
        .select(
          "id, name, description, display_order, partners(id, name, logo_url, website, display_order, is_published)"
        )
        .order("display_order", { ascending: true }),
    ]);

    const acceptedMeetings = (meetingsRes.data ?? []) as Array<{
      id: string;
      requester_id: string;
      invitee_id: string;
      accepted_slot: { start: string; end: string } | null;
      requester: { id: string; full_name: string | null } | null;
      invitee: { id: string; full_name: string | null } | null;
    }>;

    const bookmarks = ((bookmarkRes.data ?? []) as Array<{
      sessions: { id: string; title: string; start_at: string; end_at: string } | null;
    }>)
      .map((r) => r.sessions)
      .filter(
        (s): s is { id: string; title: string; start_at: string; end_at: string } =>
          !!s
      );

    calendar = [
      ...acceptedMeetings.flatMap((m) => {
        if (!m.accepted_slot || !user) return [];
        const other =
          m.requester_id === user.id ? m.invitee : m.requester;
        return [
          {
            kind: "meeting" as const,
            start: m.accepted_slot.start,
            end: m.accepted_slot.end,
            title: `Meeting · ${other?.full_name ?? "Attendee"}`,
            href: `/meetings/${m.id}`,
          },
        ];
      }),
      ...bookmarks.map((b) => ({
        kind: "session" as const,
        start: b.start_at,
        end: b.end_at,
        title: b.title,
        href: `/agenda/${b.id}`,
      })),
    ].sort((a, b) => a.start.localeCompare(b.start));

    participants = (kpRes.data as KeyParticipantRow[] | null) ?? [];
    partnerGroups = (
      (ptRes.data as Array<{
        id: string;
        name: string;
        description: string | null;
        partners:
          | Array<{
              id: string;
              name: string;
              logo_url: string | null;
              website: string | null;
              display_order: number | null;
              is_published: boolean | null;
            }>
          | null;
      }> | null) ?? []
    )
      .map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        partners: (t.partners ?? [])
          .filter((p) => p.is_published !== false)
          .sort(
            (a, b) =>
              (a.display_order ?? 0) - (b.display_order ?? 0) ||
              a.name.localeCompare(b.name)
          )
          .map(({ id, name, logo_url, website }) => ({
            id,
            name,
            logo_url,
            website,
          })),
      }))
      .filter((g) => g.partners.length > 0);
  } catch (err) {
    rethrowIfRedirect(err);
  }

  return (
    <div className="-mx-4 space-y-6 pt-4 sm:-mx-6 lg:-mx-8 lg:pt-6">
      <div className="px-4 sm:px-6 lg:px-8">
        <HeroCarousel />
      </div>

      {/* Event card */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[radial-gradient(circle_at_top_left,#3b329e_0%,#1B1464_55%,#0d0930_100%)] p-5 text-white ring-1 ring-brand-900/40">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/65">
            PAN IIT 2026 · Bangalore Summit
          </p>
          <h2 className="mt-1 text-[20px] font-semibold leading-tight tracking-tight">
            Sovereignty in Technology
          </h2>
          <div className="mt-4 space-y-2 text-[13px] font-medium text-white/85">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-white/70" strokeWidth={1.7} />
              {SUMMIT_DATE_LABEL}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-white/70" strokeWidth={1.7} />
              {SUMMIT_VENUE}
            </div>
          </div>
          <a
            href={SUMMIT_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-semibold text-brand-900 transition-colors hover:bg-brand-50"
          >
            <Compass className="size-4" strokeWidth={1.8} />
            View directions
          </a>
        </div>
      </section>

      {/* Quick actions */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <QuickAction href="/me/qr" icon={<QrCode className="size-5" strokeWidth={1.7} />} label="My QR" />
          <QuickAction href="/scan" icon={<ScanLine className="size-5" strokeWidth={1.7} />} label="Scan QR" />
          <QuickAction href="mailto:summit@paniit.org" icon={<Mail className="size-5" strokeWidth={1.7} />} label="Contact us" />
          <QuickAction href="/sponsors" icon={<BookOpenText className="size-5" strokeWidth={1.7} />} label="Resources" />
        </div>
      </section>

      {/* Calendar */}
      <section className="px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Today's calendar" />
        {calendar.length === 0 ? (
          <div className="rounded-2xl bg-white p-5 text-center ring-1 ring-brand-100">
            <p className="text-sm text-brand-900/75">
              Your day is open. Bookmark sessions in Agenda and accept meeting
              requests to fill this in.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {calendar.map((e, i) => (
              <li key={`${i}-${e.start}`}>
                <Link
                  href={e.href}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-brand-100 transition-colors hover:bg-brand-50/30"
                >
                  <div className="w-16 shrink-0 text-[12px] font-semibold tabular-nums text-brand-800/80">
                    {formatInTimeZone(new Date(e.start), SUMMIT_TZ, "h:mm a")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-brand-950">
                      {e.title}
                    </div>
                    <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-800/70">
                      {e.kind}
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-brand-800/70" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* About the summit */}
      <section className="px-4 sm:px-6 lg:px-8">
        <SectionHeader title="About the summit" />
        <div className="rounded-2xl bg-white p-5 ring-1 ring-brand-100">
          <p className="text-sm leading-6 text-brand-900">
            The PAN IIT Bangalore Summit 2026 brings together 2,000+ alumni,
            founders, investors, and policy makers across 23 IIT campuses for
            one day on building the technology backbone of a self-reliant
            India.
          </p>
          <Link
            href="/home/about"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800 hover:text-brand-900"
          >
            Know more
            <ArrowUpRight className="size-4" strokeWidth={1.8} />
          </Link>
        </div>
      </section>

      {/* Key participants */}
      <section>
        <div className="mb-2 px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Key participants" />
        </div>
        <KeyParticipantsStrip people={participants} />
      </section>

      {/* Partners */}
      {partnerGroups.length > 0 ? (
        <section className="px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Our partners" />
          <PartnersGroups groups={partnerGroups} />
        </section>
      ) : null}

      {/* Connect with us */}
      <section className="px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Connect with us" />
        <div className="rounded-2xl bg-white p-5 ring-1 ring-brand-100">
          <div className="flex flex-wrap justify-center gap-2.5">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="inline-grid size-11 place-items-center rounded-full bg-brand-50 text-brand-800 transition-colors hover:bg-brand-100"
              >
                {s.icon}
              </a>
            ))}
          </div>
          <p className="mt-3 text-center text-[12px] font-medium text-brand-900/70">
            paniit.org · summit@paniit.org
          </p>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-800/75">
      {title}
    </h2>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-start gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-brand-100 transition-colors hover:bg-brand-50/30"
    >
      <span className="inline-grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-800">
        {icon}
      </span>
      <span className="text-[13px] font-semibold leading-tight text-brand-950">
        {label}
      </span>
    </Link>
  );
}

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

