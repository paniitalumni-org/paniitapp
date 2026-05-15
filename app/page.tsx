import Image from "next/image";
import { redirect } from "next/navigation";
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
    if (user) redirect("/home");
  } catch (err) {
    rethrowIfRedirect(err);
  }

  return (
    <main className="flex min-h-[100svh] flex-col lg:grid lg:min-h-screen lg:grid-cols-2">
      {/* HERO PANEL */}
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_left,#3b329e_0%,#1B1464_45%,#0d0930_100%)] pb-32 pt-10 lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12 lg:pb-12 xl:p-16">
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
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl"
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
            <div className="mt-3 border-t border-brand-100 pt-2.5 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-800">
                Bangalore Summit
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-brand-900">
                Sovereignty in Technology · May 16, 2026
              </p>
            </div>
          </div>

          {/* Desktop-only tagline + stats */}
          <div className="hidden text-center lg:mt-10 lg:block">
            <h1 className="font-semibold leading-tight tracking-tight text-white text-3xl xl:text-[34px]">
              India&apos;s deepest network of
              <br className="hidden xl:block" /> builders, investors &amp; policy minds.
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/75">
              One day. 2,000+ attendees across 23 IITs. The official PAN IIT
              Bangalore Summit app, in your pocket.
            </p>
            <dl className="mx-auto mt-9 grid max-w-md grid-cols-3 divide-x divide-white/10 text-center">
              <Stat label="Date" value="16 May" hint="2026" />
              <Stat label="Venue" value="Taj" hint="Yeshwantpur" />
              <Stat label="Attendees" value="2,000+" hint="across 23 IITs" />
            </dl>
          </div>
        </div>
      </section>

      {/* FORM PANEL */}
      <section className="relative z-10 -mt-24 flex flex-1 flex-col bg-transparent lg:mt-0 lg:min-h-screen lg:bg-white">
        <div className="mx-auto w-full max-w-md rounded-t-3xl bg-white px-6 pb-6 pt-9 shadow-[0_-20px_50px_-25px_rgba(13,9,48,0.35)] sm:px-8 lg:my-auto lg:max-w-sm lg:rounded-2xl lg:p-10 lg:shadow-none">
          <div className="flex flex-col items-center text-center">
            <h2 className="font-kannada font-semibold tracking-tight text-brand-900 text-[42px] leading-none sm:text-[48px]">
              ನಮಸ್ಕಾರ
            </h2>
            <p className="mt-3 text-sm leading-6 text-brand-900">
              Sign in with the email registered
            </p>
          </div>

          <div className="mt-6">
            <SignInForm />
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-brand-800">
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
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="px-3 first:pl-0 last:pr-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
        {label}
      </dt>
      <dd className="mt-2 text-lg font-semibold tracking-tight text-white">
        {value}
      </dd>
      <dd className="mt-0.5 text-[11px] font-medium text-white/60">{hint}</dd>
    </div>
  );
}
