import Image from "next/image";
import { redirect } from "next/navigation";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { rethrowIfRedirect } from "@/lib/redirect";
import { SignInForm } from "./sign-in-form";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/agenda");
  } catch (err) {
    rethrowIfRedirect(err);
  }

  return (
    <main className="lg:grid lg:min-h-screen lg:grid-cols-2">
      {/* HERO PANEL — visible top half on mobile, full-height left on desktop */}
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_left,#3b329e_0%,#1B1464_45%,#0d0930_100%)] pb-44 pt-20 lg:flex lg:flex-col lg:justify-between lg:p-12 lg:pb-12 xl:p-16">
        {/* Decorative dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.45) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
          aria-hidden
        />
        {/* Soft glow behind the logo card */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 -z-10 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl lg:left-[40%] lg:top-1/2"
          aria-hidden
        />

        {/* Logo card */}
        <div className="relative z-10 mx-auto flex w-full max-w-sm flex-col items-center px-6 lg:max-w-md lg:px-0">
          <div className="w-full rounded-2xl border border-white/10 bg-white px-8 py-7 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.45)] ring-1 ring-black/5">
            <Image
              src="/logo/paniit.png"
              alt="PAN IIT Alumni India"
              width={512}
              height={220}
              priority
              className="mx-auto h-14 w-auto"
            />
            <div className="mt-4 border-t border-slate-200 pt-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Bangalore Summit
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-600">
                Sovereignty in Technology · May 16, 2026
              </p>
            </div>
          </div>

          {/* Desktop-only tagline + metadata under the logo card */}
          <div className="hidden text-center lg:mt-12 lg:block">
            <h1 className="font-semibold leading-tight tracking-tight text-white text-3xl xl:text-4xl">
              India&apos;s deepest network of
              <br className="hidden xl:block" /> builders, investors &amp; policy minds.
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/70">
              One day. 2,000+ attendees across 23 IITs. The official PAN IIT
              Bangalore Summit app, in your pocket.
            </p>
            <dl className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-3 text-left">
              <Stat icon={CalendarDays} label="Date" value="May 16, 2026" />
              <Stat icon={MapPin} label="Venue" value="Taj Yeshwantpur" />
              <Stat icon={Users} label="Attendees" value="2,000+" />
            </dl>
          </div>
        </div>

        {/* Desktop-only footer attribution */}
        <p className="relative z-10 hidden text-center text-[11px] text-white/40 lg:block">
          © 2026 PAN IIT Alumni India · paniit.org
        </p>
      </section>

      {/* FORM PANEL */}
      <section className="relative z-10 -mt-28 flex flex-col bg-transparent lg:mt-0 lg:min-h-screen lg:bg-white">
        <div className="mx-auto w-full max-w-md rounded-t-3xl bg-white px-6 pb-10 pt-9 shadow-[0_-20px_50px_-25px_rgba(13,9,48,0.35)] sm:px-8 lg:my-auto lg:max-w-sm lg:rounded-2xl lg:p-10 lg:shadow-none">
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-800">
              Member sign in
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-brand-900 sm:text-[28px]">
              Welcome back
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Sign in with the email you registered with.
            </p>
          </div>

          <div className="mt-7">
            <SignInForm />
          </div>

          <p className="mt-8 text-xs leading-5 text-slate-500">
            By signing in you agree to the Summit Terms of Conduct. Trouble?{" "}
            <a
              href="mailto:summit@paniit.org"
              className="font-medium text-brand-800 hover:text-brand-900"
            >
              summit@paniit.org
            </a>
          </p>
        </div>

        <footer className="border-t border-slate-200 px-6 py-4 text-center text-[11px] text-slate-400 lg:hidden">
          © 2026 PAN IIT Alumni India · paniit.org
        </footer>
      </section>
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 inline-grid size-7 shrink-0 place-items-center rounded-md bg-white/10 ring-1 ring-white/15">
        <Icon className="size-3.5 text-white/80" />
      </div>
      <div className="min-w-0">
        <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
          {label}
        </dt>
        <dd className="mt-0.5 truncate text-xs font-medium text-white">{value}</dd>
      </div>
    </div>
  );
}
