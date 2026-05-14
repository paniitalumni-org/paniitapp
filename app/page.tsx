import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Calendar,
  Users,
  CalendarClock,
  MapPin,
  QrCode,
  MessagesSquare,
  Sparkles,
  ArrowRight,
  Building2,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const features = [
  {
    icon: Calendar,
    title: "Personalized Agenda",
    body:
      "Browse 50+ sessions across AI, deep tech, policy & climate. Bookmark what matters; we keep the timeline straight in IST.",
  },
  {
    icon: Users,
    title: "Find your people",
    body:
      "Search 2,000+ attendees by IIT batch, company, interests. Founders, VCs, alumni, government — all in one directory.",
  },
  {
    icon: CalendarClock,
    title: "Schedule meetings",
    body:
      "Pick three slots, send a request, accept in one tap. Auto-detects conflicts with your bookmarked sessions and accepted meetings.",
  },
  {
    icon: MapPin,
    title: "Two-floor venue map",
    body:
      "Find Mysore Hall, Investor Lounge, Sponsor Plaza. Hand-drawn map of Taj Yeshwantpur with tap-to-see-what's-on.",
  },
  {
    icon: QrCode,
    title: "QR badge swap",
    body:
      "Tap, scan, connect. Every attendee badge contains a private QR token — one scan saves the contact both ways.",
  },
  {
    icon: MessagesSquare,
    title: "Speak to the speakers",
    body:
      "Live discussion thread on every session. Ask anonymously, upvote great questions, reply, and speakers reply back — verified.",
  },
];

export default async function LandingPage() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/agenda");
  } catch {
    // env not yet configured — fall through to landing
  }

  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-paniit-gradient text-white">
        <div className="absolute inset-0 bg-dot-grid opacity-10" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-black/20" aria-hidden />

        <header className="safe-top relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 ring-1 ring-white/20 backdrop-blur">
              <span className="font-serif text-sm font-bold tracking-wide text-white">PI</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">PAN IIT</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">
                Bangalore 2026
              </div>
            </div>
          </div>
          <Link href="/login">
            <Button variant="gold" size="sm" className="font-semibold">
              Sign in
            </Button>
          </Link>
        </header>

        <div className="relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-8 sm:pt-12 md:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 ring-1 ring-white/20 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-gold-300" />
              Official Event App · 2,000+ Attendees
            </span>
            <h1 className="mt-6 font-serif text-4xl font-bold leading-[1.05] text-balance text-white sm:text-5xl md:text-6xl">
              Sovereignty in{" "}
              <span className="bg-gradient-to-r from-gold-300 to-gold-400 bg-clip-text text-transparent">
                Technology
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              One day. India&apos;s deepest network of builders, investors and policy
              minds. The PAN IIT Bangalore Summit, in your pocket.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/login">
                <Button size="lg" variant="gold" className="w-full sm:w-auto">
                  Open the App
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#agenda-preview">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  View Schedule
                </Button>
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: CalendarDays, label: "Date", value: "May 16, 2026" },
              { icon: Building2, label: "Venue", value: "Taj Yeshwantpur, Bengaluru" },
              { icon: Users, label: "Attendees", value: "2,000+ across IITs" },
            ].map((f) => (
              <div
                key={f.label}
                className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur"
              >
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/60">
                  <f.icon className="h-3.5 w-3.5 text-gold-300" />
                  {f.label}
                </div>
                <div className="mt-1.5 text-sm font-semibold text-white">{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="agenda-preview" className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-medium text-gold-700">
            Built for the summit
          </div>
          <h2 className="mt-4 font-serif text-3xl font-bold text-navy-900 sm:text-4xl">
            Everything you need on May 16
          </h2>
          <p className="mt-3 text-base leading-relaxed text-navy-500">
            Designed mobile-first. Works offline once installed. Made for the kind of day
            where every 30 minutes counts.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-navy-100 bg-white p-5 transition hover:border-navy-300 hover:shadow-sm"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-navy-50 text-navy-800">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-navy-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-y border-navy-100 bg-navy-50/60">
        <div className="mx-auto max-w-3xl px-5 py-14 text-center sm:py-20">
          <h2 className="font-serif text-2xl font-bold text-navy-900 sm:text-3xl">
            Sign in with your phone. We&apos;ll do the rest.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-navy-500 sm:text-base">
            Add to your home screen for a native feel. Notifications on for your
            bookmarked sessions and meeting requests.
          </p>
          <Link href="/login" className="mt-6 inline-block">
            <Button size="lg">
              Open the App
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mx-auto max-w-6xl px-5 py-10 text-center">
        <div className="flex flex-col items-center gap-2 text-xs text-navy-400 sm:flex-row sm:justify-between sm:text-sm">
          <div>© 2026 PAN IIT Alumni India · Bangalore Summit</div>
          <Link
            href="https://paniit.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-navy-700 hover:text-navy-900"
          >
            paniit.org →
          </Link>
        </div>
      </footer>
    </main>
  );
}
