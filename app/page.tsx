import Image from "next/image";
import { redirect } from "next/navigation";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { rethrowIfRedirect } from "@/lib/redirect";
import { SignInForm } from "./sign-in-form";

export const dynamic = "force-dynamic";

const IITS = [
  "IIT Bombay",
  "IIT Delhi",
  "IIT Madras",
  "IIT Kanpur",
  "IIT Kharagpur",
  "IIT Roorkee",
  "IIT Guwahati",
  "IIT Hyderabad",
  "IIT Indore",
  "IIT Mandi",
  "IIT BHU",
  "IIT Bhubaneswar",
  "IIT Gandhinagar",
  "IIT Jodhpur",
  "IIT Patna",
  "IIT Ropar",
  "IIT Tirupati",
  "IIT Palakkad",
  "IIT Dhanbad",
  "IIT Bhilai",
  "IIT Goa",
  "IIT Jammu",
  "IIT Dharwad",
];

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
    <main className="flex min-h-[100svh] flex-col lg:grid lg:min-h-screen lg:grid-cols-2">
      {/* HERO PANEL */}
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_left,#3b329e_0%,#1B1464_45%,#0d0930_100%)] pb-32 pt-10 lg:flex lg:flex-col lg:justify-between lg:p-12 lg:pb-12 xl:p-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.45) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 -z-10 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl lg:left-[40%] lg:top-1/2"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex w-full max-w-sm flex-col items-center px-6 lg:max-w-md lg:px-0">
          <div className="w-full rounded-2xl border border-white/10 bg-white px-7 py-5 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.45)] ring-1 ring-black/5">
            <Image
              src="/logo/paniit.png"
              alt="PAN IIT Alumni India"
              width={512}
              height={220}
              priority
              className="mx-auto h-11 w-auto"
            />
            <div className="mt-3 border-t border-slate-200 pt-2.5 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Bangalore Summit
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-600">
                Sovereignty in Technology · May 16, 2026
              </p>
            </div>
          </div>

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
      </section>

      {/* FORM PANEL */}
      <section className="relative z-10 -mt-24 flex flex-1 flex-col bg-transparent lg:mt-0 lg:min-h-screen lg:bg-white">
        <div className="mx-auto w-full max-w-md rounded-t-3xl bg-white px-6 pb-6 pt-6 shadow-[0_-20px_50px_-25px_rgba(13,9,48,0.35)] sm:px-8 lg:my-auto lg:max-w-sm lg:rounded-2xl lg:p-10 lg:shadow-none">
            {/* IIT marquee */}
            <div className="-mx-6 overflow-hidden sm:-mx-8 lg:-mx-10">
              <div
                className="flex w-max animate-marquee-rtl gap-2"
                aria-hidden
              >
                {[...IITS, ...IITS].map((name, i) => (
                  <span
                    key={`${name}-${i}`}
                    className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-col items-center text-center">
              <h2 className="font-semibold tracking-tight text-brand-900 text-3xl sm:text-[34px]">
                ನಮಸ್ಕಾರ
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sign in with the email registered
              </p>
            </div>

            <div className="mt-5">
              <SignInForm />
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-slate-500">
              Trouble?{" "}
              <a
                href="mailto:summit@paniit.org"
                className="font-medium text-brand-800 hover:text-brand-900"
              >
                summit@paniit.org
              </a>
            </p>
        </div>
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
